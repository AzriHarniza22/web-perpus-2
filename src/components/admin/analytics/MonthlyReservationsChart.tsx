'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { BaseChart, ChartType as BaseChartType, ViewMode } from './BaseChart'
import { aggregateMonthlyBookings, aggregateDailyBookings, calculateStats } from '@/lib/chart-data-utils'
import { getChartOptionsByType, createStatusDatasets, STATUS_COLORS } from '@/lib/chart-config-utils'
import { Booking } from '@/lib/types'
import { TooltipItem, ChartOptions } from 'chart.js'

interface MonthlyReservationsChartProps {
  bookings: Booking[]
  isLoading?: boolean
}

export function MonthlyReservationsChart({ bookings, isLoading = false }: MonthlyReservationsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  // Process data based on view mode using new utilities
  const chartData = useMemo(() => {
    console.log('Processing chart data:', { bookingsCount: bookings?.length, viewMode })

    if (!bookings || bookings.length === 0) {
      console.warn('No bookings data provided')
      return { labels: [], datasets: [] }
    }

    if (viewMode === 'monthly') {
      const result = aggregateMonthlyBookings(bookings as any)
      console.log('Monthly aggregation result:', result)
      return result
    } else {
      const result = aggregateDailyBookings(bookings as any)
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
            title: function(tooltipItems: TooltipItem<'line' | 'bar'>[]) {
              const tooltipItem = tooltipItems[0]
              return mode === 'monthly' ? `Bulan ${tooltipItem.label}` : `Tanggal ${tooltipItem.label}`
            },
            label: function(tooltipItem: TooltipItem<'line' | 'bar'>) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y}`
            }
          }
        }
      }
    }) as ChartOptions<'line' | 'bar'>
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
      onChartTypeChange={(type) => setChartType(type as 'bar' | 'line')}
      onViewModeChange={setViewMode}
      chartData={chartData}
      getChartOptions={getChartOptions}
      customStats={customStats}
      height={256}
    />
  )
}
