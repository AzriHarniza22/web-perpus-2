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
import { Line } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, Calendar } from 'lucide-react'
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

interface TourAverageGuestsChartProps {
  bookings: Booking[]
  tours: Tour[]
  isLoading?: boolean
}

export function TourAverageGuestsChart({
  bookings,
  tours,
  isLoading = false
}: TourAverageGuestsChartProps) {
  // Filter tour bookings using the utility function
  const tourBookings = useMemo(() => {
    return bookings.filter(isTourBooking)
  }, [bookings])

  // Process average guests data by month
  const chartData = useMemo(() => {
    const monthlyData = new Map()

    tourBookings.forEach(booking => {
      const date = parseISO(booking.created_at)
      const monthKey = format(date, 'yyyy-MM')

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          totalParticipants: 0,
          count: 0,
          avgParticipants: 0
        })
      }

      const data = monthlyData.get(monthKey)
      const participants = booking.guest_count || 0

      data.totalParticipants += participants
      data.count += 1
      data.avgParticipants = data.totalParticipants / data.count
    })

    const sortedMonths = Array.from(monthlyData.keys()).sort()
    const averages = sortedMonths.map(month => monthlyData.get(month).avgParticipants)

    return {
      labels: sortedMonths.map(month => format(parseISO(month + '-01'), 'MMM yyyy', { locale: id })),
      datasets: [
        {
          label: 'Average Participants per Booking',
          data: averages,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(147, 51, 234)',
          pointBorderColor: 'rgb(147, 51, 234)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    }
  }, [tourBookings])

  const overallStats = useMemo(() => {
    if (tourBookings.length === 0) {
      return {
        avgParticipants: 0,
        minParticipants: 0,
        maxParticipants: 0,
        totalParticipants: 0,
        totalBookings: 0
      }
    }

    const participants = tourBookings.map(booking => booking.guest_count || 0)
    const avgParticipants = participants.reduce((sum, count) => sum + count, 0) / participants.length
    const minParticipants = Math.min(...participants)
    const maxParticipants = Math.max(...participants)
    const totalParticipants = participants.reduce((sum, count) => sum + count, 0)

    return {
      avgParticipants: Math.round(avgParticipants * 10) / 10,
      minParticipants,
      maxParticipants,
      totalParticipants,
      totalBookings: tourBookings.length
    }
  }, [tourBookings])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Average Tour Guests
          </CardTitle>
          <CardDescription>Analisis rata-rata peserta tour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
              <Users className="w-5 h-5" />
              Average Tour Guests
            </CardTitle>
            <CardDescription>
              Analisis rata-rata peserta per booking tour
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {overallStats.avgParticipants}
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
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-secondary">{overallStats.avgParticipants}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rata-rata</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-primary">{overallStats.minParticipants}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Minimum</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-green-600">{overallStats.maxParticipants}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Maximum</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
            >
              <p className="text-lg font-bold text-orange-600">{overallStats.totalParticipants}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Peserta</p>
            </motion.div>
          </div>

          {/* Chart */}
          {chartData.labels.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="h-64">
                <Line
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
                            return `Average Participants: ${context.parsed.y.toFixed(1)}`
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
                          precision: 1
                        }
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
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
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No tour guest data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}