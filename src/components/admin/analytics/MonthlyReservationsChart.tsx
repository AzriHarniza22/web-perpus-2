'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { BaseChart, ChartType as BaseChartType, ViewMode } from './BaseChart'
import { aggregateMonthlyBookings, aggregateDailyBookings, calculateStats } from '@/lib/chart-data-utils'
import { getChartOptionsByType, createStatusDatasets, STATUS_COLORS } from '@/lib/chart-config-utils'

interface MonthlyReservationsChartProps {
  bookings: any[]
  isLoading?: boolean
}

export function MonthlyReservationsChart({ bookings, isLoading = false }: MonthlyReservationsChartProps) {
  const [chartType, setChartType] = useState<BaseChartType>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  // Process data based on view mode using new utilities
  const chartData = useMemo(() => {
    console.log('Processing chart data:', { bookingsCount: bookings?.length, viewMode })

    if (!bookings || bookings.length === 0) {
      console.warn('No bookings data provided')
      return { labels: [], datasets: [] }
    }

    if (viewMode === 'monthly') {
      const result = aggregateMonthlyBookings(bookings)
      console.log('Monthly aggregation result:', result)
      return result
    } else {
      const result = aggregateDailyBookings(bookings)
      console.log('Daily aggregation result:', result)
      return result
    }
  }, [bookings, viewMode])

  const stats = useMemo(() => calculateStats(chartData), [chartData])

  const customStats = [
    { label: 'Avg', value: stats.average, icon: TrendingUp },
    { label: 'Total', value: stats.total, icon: Calendar }
  ]

  const getChartOptions = (mode?: ViewMode) => {
    return getChartOptionsByType(chartType, {
      plugins: {
        tooltip: {
          callbacks: {
            title: function(context: any) {
              return mode === 'monthly' ? `Bulan ${context[0].label}` : `Tanggal ${context[0].label}`
            },
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.y}`
            }
          }
        }
      }
    })
  }

  return (
    <BaseChart
      title={viewMode === 'monthly' ? 'Monthly Trends' : 'Daily Distribution'}
      description={viewMode === 'monthly' ? 'Trend reservasi bulanan' : 'Distribusi reservasi harian'}
      icon={BarChart3}
      isLoading={isLoading}
      chartType={chartType}
      viewMode={viewMode}
      availableChartTypes={['line', 'bar']}
      availableViewModes={['monthly', 'daily']}
      onChartTypeChange={setChartType}
      onViewModeChange={setViewMode}
      chartData={chartData}
      getChartOptions={getChartOptions}
      customStats={customStats}
      height={256}
    />
  )
}
