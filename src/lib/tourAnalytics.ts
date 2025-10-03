import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'
import { Booking, Tour } from './types'

/**
 * Utility function to identify if a booking is a tour booking
 */
export function isTourBooking(booking: Booking): boolean {
  return booking.is_tour === true
}

/**
 * Filter bookings to get only tour bookings
 */
export function filterTourBookings(bookings: Booking[]): Booking[] {
  return bookings.filter(isTourBooking)
}

export interface TourBooking {
  id: string
  room_id: string
  user_id: string
  guest_count: number | null
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
  event_description: string | null
  notes: string | null
  is_tour?: boolean
  rooms?: {
    id: string
    name: string
    capacity: number
    description?: string
  }
}

export interface TourAnalyticsData {
  totalBookings: number
  approvedBookings: number
  pendingBookings: number
  rejectedBookings: number
  totalParticipants: number
  avgParticipants: number
  avgDuration: number
  utilizationRate: number
  peakHour: string
  monthlyTrends: MonthlyTrend[]
  dailyDistribution: DailyDistribution[]
  timeHeatmap: TimeHeatmapData
}

export interface MonthlyTrend {
  month: string
  total: number
  approved: number
  pending: number
  rejected: number
  participants: number
}

export interface DailyDistribution {
  date: string
  total: number
  approved: number
  pending: number
  rejected: number
  participants: number
}

export interface TimeHeatmapData {
  days: string[]
  hours: number[]
  grid: number[][]
  maxValue: number
}

/**
 * Filter tour bookings based on date range
 */
export function filterTourBookingsByDateRange(
  bookings: Booking[],
  startDate?: Date,
  endDate?: Date
): Booking[] {
  if (!startDate || !endDate) return bookings

  return bookings.filter(booking => {
    const bookingDate = parseISO(booking.created_at)
    return isWithinInterval(bookingDate, { start: startDate, end: endDate })
  })
}

/**
 * Calculate comprehensive tour analytics
 */
export function calculateTourAnalytics(
  bookings: Booking[],
  tours: Tour[] = []
): TourAnalyticsData {
  // Filter tour bookings using the utility function
  const tourBookings = bookings.filter(isTourBooking)

  const totalBookings = tourBookings.length
  const approvedBookings = tourBookings.filter(b => b.status === 'approved').length
  const pendingBookings = tourBookings.filter(b => b.status === 'pending').length
  const rejectedBookings = tourBookings.filter(b => b.status === 'rejected').length

  const totalParticipants = tourBookings.reduce((sum, booking) => {
    return sum + (booking.guest_count || 0)
  }, 0)

  const avgParticipants = totalBookings > 0 ? Math.round((totalParticipants / totalBookings) * 10) / 10 : 0

  // Calculate average duration
  const bookingsWithDuration = tourBookings.filter(
    booking => booking.start_time && booking.end_time
  )

  const totalDuration = bookingsWithDuration.reduce((sum, booking) => {
    const start = new Date(booking.start_time!).getTime()
    const end = new Date(booking.end_time!).getTime()
    const duration = (end - start) / (1000 * 60 * 60) // Convert to hours
    return sum + (duration > 0 && duration < 24 ? duration : 0)
  }, 0)

  const avgDuration = bookingsWithDuration.length > 0
    ? Math.round((totalDuration / bookingsWithDuration.length) * 10) / 10
    : 0

  // Calculate utilization rate based on tour bookings capacity
  // For tours, we use a default capacity per tour booking or calculate from actual bookings
  const avgCapacityPerTour = 20 // Default capacity for tour bookings
  const totalCapacity = tourBookings.length * avgCapacityPerTour
  const utilizationRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0

  // Find peak hour
  const hourCounts = new Map<number, number>()
  tourBookings.forEach(booking => {
    const hour = new Date(booking.created_at).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + (booking.guest_count || 1))
  })

  let peakHour = '0'
  let maxCount = 0
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count
      peakHour = `${hour}:00`
    }
  })

  return {
    totalBookings,
    approvedBookings,
    pendingBookings,
    rejectedBookings,
    totalParticipants,
    avgParticipants,
    avgDuration,
    utilizationRate,
    peakHour,
    monthlyTrends: calculateMonthlyTrends(tourBookings),
    dailyDistribution: calculateDailyDistribution(tourBookings),
    timeHeatmap: calculateTimeHeatmap(tourBookings)
  }
}

/**
 * Calculate monthly trends for tour bookings
 */
export function calculateMonthlyTrends(bookings: Booking[]): MonthlyTrend[] {
  const monthlyData = new Map<string, MonthlyTrend>()

  bookings.forEach(booking => {
    const date = parseISO(booking.created_at)
    const monthKey = format(date, 'yyyy-MM')

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthKey,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        participants: 0
      })
    }

    const data = monthlyData.get(monthKey)!
    data.total += 1
    data.participants += booking.guest_count || 0

    switch (booking.status) {
      case 'approved':
        data.approved += 1
        break
      case 'pending':
        data.pending += 1
        break
      case 'rejected':
        data.rejected += 1
        break
    }
  })

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calculate daily distribution for tour bookings
 */
export function calculateDailyDistribution(bookings: Booking[]): DailyDistribution[] {
  const dailyData = new Map<string, DailyDistribution>()

  bookings.forEach(booking => {
    const date = parseISO(booking.created_at)
    const dayKey = format(date, 'yyyy-MM-dd')

    if (!dailyData.has(dayKey)) {
      dailyData.set(dayKey, {
        date: dayKey,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        participants: 0
      })
    }

    const data = dailyData.get(dayKey)!
    data.total += 1
    data.participants += booking.guest_count || 0

    switch (booking.status) {
      case 'approved':
        data.approved += 1
        break
      case 'pending':
        data.pending += 1
        break
      case 'rejected':
        data.rejected += 1
        break
    }
  })

  return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate time-based heatmap data
 */
export function calculateTimeHeatmap(
  bookings: Booking[],
  timeRange: 'week' | 'month' | '3months' = 'month'
): TimeHeatmapData {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Initialize grid
  const grid = days.map(() => Array(24).fill(0))

  // Filter bookings based on time range
  const now = new Date()
  let startDate: Date

  switch (timeRange) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '3months':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
  }

  // Process bookings within time range
  bookings
    .filter(booking => new Date(booking.created_at) >= startDate)
    .forEach(booking => {
      const date = new Date(booking.created_at)
      const dayOfWeek = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
      const hour = date.getHours()

      if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
        grid[dayOfWeek][hour] += booking.guest_count || 1
      }
    })

  // Find max value for scaling
  const maxValue = Math.max(...grid.flat())

  return {
    days,
    hours,
    grid,
    maxValue
  }
}

/**
 * Get tour capacity utilization metrics
 */
export function calculateTourCapacityUtilization(
  bookings: Booking[],
  tours: Tour[]
): { tourId: string; name: string; capacity: number; utilization: number; bookings: number }[] {
  // Filter tour bookings using the utility function
  const tourBookings = bookings.filter(isTourBooking)

  return tours.map(tour => {
    // For each tour (room), calculate utilization based on tour bookings
    const totalParticipants = tourBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    const utilization = tour.capacity > 0 ? Math.round((totalParticipants / tour.capacity) * 100) : 0

    return {
      tourId: tour.id,
      name: tour.name,
      capacity: tour.capacity,
      utilization,
      bookings: tourBookings.length
    }
  })
}

/**
 * Get tour booking status distribution
 */
export function getTourBookingStatusDistribution(bookings: Booking[]): {
  status: string
  count: number
  percentage: number
  participants: number
}[] {
  // Filter tour bookings using the utility function
  const tourBookings = bookings.filter(isTourBooking)
  const totalBookings = tourBookings.length

  if (totalBookings === 0) {
    return []
  }

  const statusGroups = tourBookings.reduce((acc, booking) => {
    const status = booking.status
    if (!acc[status]) {
      acc[status] = { count: 0, participants: 0 }
    }
    acc[status].count += 1
    acc[status].participants += booking.guest_count || 0
    return acc
  }, {} as Record<string, { count: number; participants: number }>)

  return Object.entries(statusGroups).map(([status, data]) => ({
    status,
    count: data.count,
    percentage: Math.round((data.count / totalBookings) * 100),
    participants: data.participants
  }))
}

/**
 * Get tour participant trends over time
 */
export function getTourParticipantTrends(
  bookings: Booking[],
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): { period: string; participants: number; bookings: number }[] {
  const trends = new Map<string, { participants: number; bookings: number }>()

  // Filter tour bookings using the utility function
  const tourBookings = bookings.filter(isTourBooking)

  tourBookings
    .forEach(booking => {
      const date = parseISO(booking.created_at)
      let periodKey: string

      switch (period) {
        case 'daily':
          periodKey = format(date, 'yyyy-MM-dd')
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          periodKey = format(weekStart, 'yyyy-MM-dd')
          break
        case 'monthly':
          periodKey = format(date, 'yyyy-MM')
          break
      }

      if (!trends.has(periodKey)) {
        trends.set(periodKey, { participants: 0, bookings: 0 })
      }

      const data = trends.get(periodKey)!
      data.participants += booking.guest_count || 0
      data.bookings += 1
    })

  return Array.from(trends.entries())
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period))
}