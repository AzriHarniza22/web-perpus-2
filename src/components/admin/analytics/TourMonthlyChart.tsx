'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Calendar, MapPin, Users } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TourMonthlyChartProps {
  bookings: any[]
  tours: any[]
  isLoading?: boolean
}

type ChartType = 'line' | 'bar'
type ViewMode = 'monthly' | 'daily'

export function TourMonthlyChart({
  bookings,
  tours,
  isLoading = false
}: TourMonthlyChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  // Filter tour bookings
  const tourBookings = useMemo(() => {
    return bookings.filter(booking => booking.tour_id)
  }, [bookings])

  // Process data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      return processMonthlyData(tourBookings)
    } else {
      return processDailyData(tourBookings)
    }
  }, [tourBookings, viewMode])

  const totalReservations = useMemo(() => {
    return tourBookings.length
  }, [tourBookings])

  const averagePerPeriod = useMemo(() => {
    if (chartData.labels.length > 0) {
      return Math.round(totalReservations / chartData.labels.length)
    }
    return 0
  }, [chartData, totalReservations])

  const totalParticipants = useMemo(() => {
    return tourBookings.reduce((sum: number, booking: any) => {
      return sum + (booking.participant_count || 0)
    }, 0)
  }, [tourBookings])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Tour Monthly Trends
          </CardTitle>
          <CardDescription>Trend reservasi tour bulanan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {viewMode === 'monthly' ? 'Tour Monthly Trends' : 'Tour Daily Distribution'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'monthly'
                ? 'Trend reservasi tour bulanan'
                : 'Distribusi reservasi tour harian'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {tours?.length || 0} Tours
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {averagePerPeriod}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Total: {totalReservations}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Participants: {totalParticipants}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border bg-white dark:bg-gray-800">
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('monthly')}
                className="rounded-r-none"
              >
                Monthly
              </Button>
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('daily')}
                className="rounded-l-none"
              >
                Daily
              </Button>
            </div>

            <div className="flex rounded-lg border bg-white dark:bg-gray-800">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="rounded-r-none"
              >
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="rounded-l-none"
              >
                Bar
              </Button>
            </div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-64">
              {chartType === 'line' ? (
                <Line data={chartData} options={getChartOptions(viewMode)} />
              ) : (
                <Bar data={chartData} options={getChartOptions(viewMode)} />
              )}
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}

function processMonthlyData(bookings: any[]) {
  const monthlyData = new Map()

  bookings.forEach(booking => {
    const date = parseISO(booking.created_at)
    const monthKey = format(date, 'yyyy-MM')

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        participants: 0
      })
    }

    const data = monthlyData.get(monthKey)
    data.total += 1
    data.participants += booking.participant_count || 0

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

  const sortedMonths = Array.from(monthlyData.keys()).sort()

  return {
    labels: sortedMonths.map(month => format(parseISO(month + '-01'), 'MMM yyyy', { locale: id })),
    datasets: [
      {
        label: 'Total Bookings',
        data: sortedMonths.map(month => monthlyData.get(month).total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Approved',
        data: sortedMonths.map(month => monthlyData.get(month).approved),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Pending',
        data: sortedMonths.map(month => monthlyData.get(month).pending),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Rejected',
        data: sortedMonths.map(month => monthlyData.get(month).rejected),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4
      }
    ]
  }
}

function processDailyData(bookings: any[]) {
  const dailyData = new Map()

  bookings.forEach(booking => {
    const date = parseISO(booking.created_at)
    const dayKey = format(date, 'yyyy-MM-dd')

    if (!dailyData.has(dayKey)) {
      dailyData.set(dayKey, {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        participants: 0
      })
    }

    const data = dailyData.get(dayKey)
    data.total += 1
    data.participants += booking.participant_count || 0

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

  const sortedDays = Array.from(dailyData.keys()).sort()

  return {
    labels: sortedDays.map(day => format(parseISO(day), 'dd/MM', { locale: id })),
    datasets: [
      {
        label: 'Total Bookings',
        data: sortedDays.map(day => dailyData.get(day).total),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Approved',
        data: sortedDays.map(day => dailyData.get(day).approved),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Pending',
        data: sortedDays.map(day => dailyData.get(day).pending),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      },
      {
        label: 'Rejected',
        data: sortedDays.map(day => dailyData.get(day).rejected),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  }
}

function getChartOptions(viewMode: ViewMode) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: viewMode === 'daily' ? 45 : 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5]
        },
        ticks: {
          font: {
            size: 11
          },
          precision: 0
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2
      }
    }
  }
}