'use client'

import { useMemo } from 'react'
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
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Calendar } from 'lucide-react'
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
  Legend
)

interface TourAverageTimeChartProps {
  bookings: Booking[]
  tours: Tour[]
  isLoading?: boolean
}

export function TourAverageTimeChart({
  bookings,
  tours,
  isLoading = false
}: TourAverageTimeChartProps) {
  // Filter tour bookings using the same logic as other tour components
  const tourBookings = useMemo(() => {
    return bookings.filter(booking => isTourBooking(booking) && booking.start_time && booking.end_time)
  }, [bookings])

  // Process average duration data by month
  const chartData = useMemo(() => {
    const monthlyData = new Map()

    tourBookings.forEach(booking => {
      const date = parseISO(booking.created_at)
      const monthKey = format(date, 'yyyy-MM')

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          totalDuration: 0,
          count: 0,
          avgDuration: 0
        })
      }

      const data = monthlyData.get(monthKey)
      const start = new Date(booking.start_time).getTime()
      const end = new Date(booking.end_time).getTime()
      const duration = (end - start) / (1000 * 60 * 60) // Convert to hours

      if (duration > 0 && duration < 24) { // Filter out invalid durations
        data.totalDuration += duration
        data.count += 1
        data.avgDuration = data.totalDuration / data.count
      }
    })

    const sortedMonths = Array.from(monthlyData.keys()).sort()
    const averages = sortedMonths.map(month => monthlyData.get(month).avgDuration)

    return {
      labels: sortedMonths.map(month => format(parseISO(month + '-01'), 'MMM yyyy', { locale: id })),
      datasets: [
        {
          label: 'Average Duration (Hours)',
          data: averages,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    }
  }, [tourBookings])

  const overallStats = useMemo(() => {
    if (tourBookings.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalBookings: 0
      }
    }

    const durations = tourBookings.map(booking => {
      const start = new Date(booking.start_time).getTime()
      const end = new Date(booking.end_time).getTime()
      return (end - start) / (1000 * 60 * 60)
    }).filter(duration => duration > 0 && duration < 24)

    const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    const minDuration = Math.min(...durations)
    const maxDuration = Math.max(...durations)

    return {
      avgDuration: Math.round(avgDuration * 10) / 10,
      minDuration: Math.round(minDuration * 10) / 10,
      maxDuration: Math.round(maxDuration * 10) / 10,
      totalBookings: tourBookings.length
    }
  }, [tourBookings])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Average Tour Duration
          </CardTitle>
          <CardDescription>Analisis rata-rata durasi tour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
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
              <Clock className="w-5 h-5" />
              Average Tour Duration
            </CardTitle>
            <CardDescription>
              Analisis rata-rata durasi tour per bulan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {overallStats.avgDuration}h
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {overallStats.totalBookings} bookings
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-primary">{overallStats.avgDuration}h</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rata-rata</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-green-600">{overallStats.minDuration}h</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Minimum</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-red-600">{overallStats.maxDuration}h</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Maximum</p>
            </motion.div>
          </div>

          {/* Chart */}
          {chartData.labels.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="h-64">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                          label: (context) => {
                            return `Average Duration: ${context.parsed.y.toFixed(1)} hours`
                          }
                        }
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
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          font: {
                            size: 11
                          },
                          callback: (value) => `${value}h`
                        }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No tour duration data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}