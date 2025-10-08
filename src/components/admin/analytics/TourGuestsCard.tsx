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
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, UserCheck, BarChart3, Calendar } from 'lucide-react'
import { isTourBooking } from '@/lib/tourAnalytics'
import { Booking, Tour } from '@/lib/types'

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

interface TourGuestsCardProps {
  bookings: Booking[]
  tours: Tour[]
  isLoading?: boolean
}

type ChartType = 'line' | 'bar'
type ViewMode = 'monthly' | 'daily'

export function TourGuestsCard({
  bookings,
  tours,
  isLoading = false
}: TourGuestsCardProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  // Filter tour bookings using the utility function
  const tourBookings = useMemo(() => {
    return bookings.filter(isTourBooking)
  }, [bookings])

  // Process chart data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      return processMonthlyGuestData(tourBookings)
    } else {
      return processDailyGuestData(tourBookings)
    }
  }, [tourBookings, viewMode])

  const guestStats = useMemo(() => {
    const participants = tourBookings.map(booking => booking.guest_count || 0)
    const totalParticipants = participants.reduce((sum, count) => sum + count, 0)

    const approvedParticipants = tourBookings
       .filter(booking => booking.status === 'approved' || booking.status === 'completed')
       .reduce((sum: number, booking: Booking) => sum + (booking.guest_count || 0), 0)

    const pendingParticipants = tourBookings
       .filter(booking => booking.status === 'pending')
       .reduce((sum: number, booking: Booking) => sum + (booking.guest_count || 0), 0)

    const avgParticipantsPerBooking = tourBookings.length > 0
      ? Math.round((totalParticipants / tourBookings.length) * 10) / 10
      : 0

    const minParticipants = participants.length > 0 ? Math.min(...participants) : 0
    const maxParticipants = participants.length > 0 ? Math.max(...participants) : 0

    // Calculate capacity utilization
    const totalCapacity = tours.reduce((sum: number, tour: Tour) => sum + (tour.capacity || 0), 0)
    const utilizationRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0

    return {
      totalParticipants,
      approvedParticipants,
      pendingParticipants,
      avgParticipantsPerBooking,
      minParticipants,
      maxParticipants,
      utilizationRate,
      totalCapacity
    }
  }, [tourBookings, tours])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Tour Guest Chart
          </CardTitle>
          <CardDescription>Grafik jumlah peserta tour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  function processMonthlyGuestData(bookings: Booking[]) {
    const monthlyData = new Map()
  
    bookings.forEach(booking => {
      const date = parseISO(booking.created_at)
      const monthKey = format(date, 'yyyy-MM')
  
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          totalParticipants: 0,
          count: 0
        })
      }
  
      const data = monthlyData.get(monthKey)
      data.totalParticipants += booking.guest_count || 0
      data.count += 1
    })
  
    const sortedMonths = Array.from(monthlyData.keys()).sort()
  
    return {
      labels: sortedMonths.map(month => format(parseISO(month + '-01'), 'MMM yyyy', { locale: id })),
      datasets: [
        {
          label: 'Total Participants',
          data: sortedMonths.map(month => monthlyData.get(month).totalParticipants),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Average per Booking',
          data: sortedMonths.map(month => {
            const data = monthlyData.get(month)
            return data.count > 0 ? Math.round((data.totalParticipants / data.count) * 10) / 10 : 0
          }),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    }
  }
  
  function processDailyGuestData(bookings: Booking[]) {
    const dailyData = new Map()
  
    bookings.forEach(booking => {
      const date = parseISO(booking.created_at)
      const dayKey = format(date, 'yyyy-MM-dd')
  
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          totalParticipants: 0,
          count: 0
        })
      }
  
      const data = dailyData.get(dayKey)
      data.totalParticipants += booking.guest_count || 0
      data.count += 1
    })
  
    const sortedDays = Array.from(dailyData.keys()).sort()
  
    return {
      labels: sortedDays.map(day => format(parseISO(day), 'dd/MM', { locale: id })),
      datasets: [
        {
          label: 'Total Participants',
          data: sortedDays.map(day => dailyData.get(day).totalParticipants),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Average per Booking',
          data: sortedDays.map(day => {
            const data = dailyData.get(day)
            return data.count > 0 ? Math.round((data.totalParticipants / data.count) * 10) / 10 : 0
          }),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
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

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tour Guest Chart
            </CardTitle>
            <CardDescription>
              {viewMode === 'monthly'
                ? 'Grafik jumlah peserta tour bulanan'
                : 'Grafik jumlah peserta tour harian'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Total: {guestStats.totalParticipants}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {guestStats.avgParticipantsPerBooking}
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

          {/* Statistics Below Chart */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.avgParticipantsPerBooking}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rata-rata</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.minParticipants}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Minimum</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.maxParticipants}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Maximum</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.totalParticipants}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Peserta</p>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}