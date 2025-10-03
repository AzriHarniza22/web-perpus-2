import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking } from './types'

export interface DataPoint {
  [key: string]: unknown
}

export interface AggregatedData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
    tension?: number
    pointBackgroundColor?: string
    pointBorderColor?: string
    pointBorderWidth?: number
    pointRadius?: number
    pointHoverRadius?: number
  }>
}

export interface StatusAggregation {
  total: number
  approved: number
  pending: number
  rejected: number
  cancelled?: number
  completed?: number
}

/**
 * Generic data aggregation utility for time-based grouping
 */
export function aggregateTimeSeriesData<T extends Record<string, unknown>>(
  data: T[],
  options: {
    dateField?: keyof T
    groupBy: 'hour' | 'day' | 'month' | 'year'
    valueFields?: Array<keyof T>
    statusField?: keyof T
    filterFn?: (item: T) => boolean
    dateFilter?: { from?: Date; to?: Date }
  }
): Map<string, StatusAggregation & Record<string, number>> {
  const {
    dateField = 'created_at' as keyof T,
    groupBy,
    valueFields = [],
    statusField = 'status' as keyof T,
    filterFn,
    dateFilter
  } = options

  const aggregatedData = new Map<string, StatusAggregation & Record<string, number>>()

  data.forEach(item => {
    // Apply custom filter if provided
    if (filterFn && !filterFn(item)) return

    // Apply date filter if provided
    if (dateFilter?.from || dateFilter?.to) {
      const itemDate = new Date(item[dateField] as string)
      if (dateFilter.from && itemDate < dateFilter.from) return
      if (dateFilter.to && itemDate > dateFilter.to) return
    }

    const date = new Date(item[dateField] as string)
    let key: string

    // Generate grouping key based on groupBy option
    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00:00`
        break
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'year':
        key = String(date.getFullYear())
        break
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    if (!aggregatedData.has(key)) {
      aggregatedData.set(key, {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        cancelled: 0,
        completed: 0,
        // Initialize value fields
        ...valueFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {})
      })
    }

    const current = aggregatedData.get(key)!
    current.total += 1

    // Aggregate by status if status field exists
    const status = item[statusField] as string
    if (status) {
      // Map booking statuses to our aggregation keys
      switch (status) {
        case 'approved':
          current.approved += 1
          break
        case 'pending':
          current.pending += 1
          break
        case 'rejected':
          current.rejected += 1
          break
        case 'cancelled':
          current.cancelled = (current.cancelled || 0) + 1
          break
        case 'completed':
          current.completed = (current.completed || 0) + 1
          break
        default:
          // For any other status, add to total but don't categorize
          break
      }
    }

    // Aggregate value fields
    valueFields.forEach(field => {
      const value = Number(item[field as keyof T]) || 0
      const fieldKey = String(field)
      current[fieldKey] = (current[fieldKey] || 0) + value
    })
  })

  return aggregatedData
}

/**
 * Convert aggregated data to chart format
 */
export function formatChartData(
  aggregatedData: Map<string, StatusAggregation & Record<string, number>>,
  options: {
    labelFormat?: (key: string) => string
    sortFn?: (a: [string, StatusAggregation & Record<string, number>], b: [string, StatusAggregation & Record<string, number>]) => number
    datasetConfigs?: Array<{
      key: string
      label: string
      color?: string
      backgroundColor?: string
    }>
  } = {}
): AggregatedData {
  const {
    labelFormat = (key: string) => key,
    sortFn = ([a], [b]) => a.localeCompare(b),
    datasetConfigs = [
      { key: 'total', label: 'Total', color: 'rgb(59, 130, 246)' },
      { key: 'approved', label: 'Disetujui', color: 'rgb(34, 197, 94)' },
      { key: 'pending', label: 'Menunggu', color: 'rgb(245, 158, 11)' },
      { key: 'rejected', label: 'Ditolak', color: 'rgb(239, 68, 68)' }
    ]
  } = options

  const sortedEntries = Array.from(aggregatedData.entries()).sort(sortFn)

  return {
    labels: sortedEntries.map(([key]) => labelFormat(key)),
    datasets: datasetConfigs.map(({ key, label, color, backgroundColor }) => ({
      label,
      data: sortedEntries.map(([, values]) => values[key] || 0),
      borderColor: color,
      backgroundColor: backgroundColor || `${color}1A`, // Add alpha for background
      fill: false,
      tension: 0.4
    }))
  }
}

/**
 * Specialized function for monthly booking aggregation (replaces processMonthlyData)
 */
export function aggregateMonthlyBookings(
  bookings: Booking[],
  dateFilter?: { from?: Date; to?: Date }
): AggregatedData {
  console.log('aggregateMonthlyBookings called with:', { bookingsCount: bookings?.length, dateFilter })

  if (!bookings || bookings.length === 0) {
    console.warn('No bookings provided to aggregateMonthlyBookings')
    return { labels: [], datasets: [] }
  }

  const aggregatedData = aggregateTimeSeriesData(bookings as unknown as Record<string, unknown>[], {
    groupBy: 'month',
    dateFilter
  })

  console.log('Monthly aggregated data:', aggregatedData)

  const result = formatChartData(aggregatedData, {
    labelFormat: (key) => {
      const [year, month] = key.split('-')
      return format(parseISO(`${year}-${month}-01`), 'MMM yyyy', { locale: id })
    }
  })

  console.log('Monthly chart data result:', result)
  return result
}

/**
 * Specialized function for daily booking aggregation (replaces processDailyData)
 */
export function aggregateDailyBookings(
  bookings: Booking[],
  dateFilter?: { from?: Date; to?: Date }
): AggregatedData {
  const aggregatedData = aggregateTimeSeriesData(bookings as unknown as Record<string, unknown>[], {
    groupBy: 'day',
    dateFilter
  })

  return formatChartData(aggregatedData, {
    labelFormat: (key) => {
      const date = parseISO(key)
      return format(date, 'dd/MM', { locale: id })
    }
  })
}

/**
 * Specialized function for peak hours analysis
 */
export function aggregatePeakHours(
  bookings: DataPoint[],
  timeRange: number = 24
): AggregatedData {
  const hoursData = new Map<number, number>()

  // Initialize all hours in range
  for (let i = 0; i < timeRange; i++) {
    hoursData.set(i, 0)
  }

  // Count bookings per hour
  bookings.forEach(booking => {
    const dateTime = booking.start_time
      ? parseISO(booking.start_time as string)
      : parseISO(booking.created_at as string)
    const hour = dateTime.getHours()

    if (hour < timeRange) {
      hoursData.set(hour, hoursData.get(hour)! + 1)
    }
  })

  const labels = Array.from(hoursData.keys()).map(hour =>
    `${hour.toString().padStart(2, '0')}:00`
  )
  const data = Array.from(hoursData.values())

  return {
    labels,
    datasets: [
      {
        label: 'Jumlah Reservasi',
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
}

/**
 * Calculate statistical metrics from aggregated data
 */
export function calculateStats(data: AggregatedData) {
  console.log('calculateStats called with:', data)

  if (!data.datasets || data.datasets.length === 0) {
    console.warn('No datasets provided to calculateStats')
    return { total: 0, average: 0, max: 0, min: 0, count: 0 }
  }

  const allValues = data.datasets.flatMap(dataset => dataset.data)
  console.log('All values:', allValues)

  const total = allValues.reduce((sum, val) => sum + val, 0)
  const average = allValues.length > 0 ? total / allValues.length : 0
  const max = Math.max(...allValues, 0)
  const min = Math.min(...allValues, 0)

  const result = {
    total: Math.round(total),
    average: Math.round(average * 10) / 10,
    max: Math.round(max),
    min: Math.round(min),
    count: allValues.length
  }

  console.log('Stats result:', result)
  return result
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T extends DataPoint>(
  data: T[],
  dateField: keyof T,
  from?: Date,
  to?: Date
): T[] {
  if (!from && !to) return data

  return data.filter(item => {
    const itemDate = new Date(item[dateField] as string)

    if (from && itemDate < from) return false
    if (to && itemDate > to) return false

    return true
  })
}

/**
 * Group data by a specific field and calculate aggregations
 */
export function groupByField<T extends DataPoint>(
  data: T[],
  groupField: keyof T,
  aggregations: Array<{
    field: string
    method: 'sum' | 'count' | 'avg' | 'max' | 'min'
  }> = []
): Map<string, Record<string, number>> {
  const grouped = new Map<string, Record<string, number>>()

  data.forEach(item => {
    const key = String(item[groupField])

    if (!grouped.has(key)) {
      grouped.set(key, {})
    }

    const current = grouped.get(key)!

    aggregations.forEach(({ field, method }) => {
      const value = Number(item[field as keyof T]) || 0

      switch (method) {
        case 'sum':
          current[field] = (current[field] || 0) + value
          break
        case 'count':
          current[field] = (current[field] || 0) + 1
          break
        case 'avg':
          const countKey = `${field}_count`
          const sumKey = `${field}_sum`
          const count = current[countKey] || 0
          const sum = current[sumKey] || 0
          current[field] = count > 0 ? (sum + value) / (count + 1) : value
          current[countKey] = count + 1
          current[sumKey] = sum + value
          break
        case 'max':
          current[field] = Math.max(current[field] || 0, value)
          break
        case 'min':
          current[field] = current[field] === undefined ? value : Math.min(current[field], value)
          break
      }
    })
  })

  return grouped
}

/**
 * Calculate percentage distribution
 */
export function calculateDistribution(
  data: Array<{ label: string; value: number }>
): Array<{ label: string; value: number; percentage: number }> {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
  }))
}