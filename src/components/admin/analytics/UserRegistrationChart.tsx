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
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, TrendingUp, Calendar, Users } from 'lucide-react'
import { aggregateUserAnalytics, getDailyUserRegistrations } from '@/lib/userAnalytics'
import { Booking, User } from '@/lib/types'

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

interface UserRegistrationChartProps {
  bookings: Booking[]
  users: User[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

type ChartType = 'line' | 'bar'
type ViewMode = 'monthly' | 'daily'

export function UserRegistrationChart({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: UserRegistrationChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  // Process data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      return processMonthlyData(users, bookings, dateFilter)
    } else {
      return getDailyUserRegistrations(users, bookings, dateFilter)
    }
  }, [users, bookings, viewMode, dateFilter])

  const totalRegistrations = useMemo(() => {
    return users.length
  }, [users])

  const averagePerPeriod = useMemo(() => {
    if (chartData.labels.length > 0) {
      return Math.round(totalRegistrations / chartData.labels.length)
    }
    return 0
  }, [chartData, totalRegistrations])

  const userAnalytics = useMemo(() => {
    return aggregateUserAnalytics(bookings, users, dateFilter)
  }, [bookings, users, dateFilter])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            User Registration Trends
          </CardTitle>
          <CardDescription>Trend registrasi pengguna</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              <UserPlus className="w-5 h-5" />
              {viewMode === 'monthly' ? 'Monthly Registration Trends' : 'Daily Registration Distribution'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'monthly' ? 'Trend registrasi pengguna bulanan' : 'Distribusi registrasi harian'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {averagePerPeriod}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Total: {totalRegistrations}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
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

function processMonthlyData(users: User[], bookings: Booking[], dateFilter?: { from?: Date; to?: Date }) {
  const monthlyData = new Map()

  // Process user registrations
  users.forEach(user => {
    if (dateFilter?.from && dateFilter?.to) {
      const regDate = parseISO(user.created_at)
      if (regDate < dateFilter.from || regDate > dateFilter.to) {
        return // Skip users outside date range
      }
    }

    const date = parseISO(user.created_at)
    const monthKey = format(date, 'yyyy-MM')

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        total: 0,
        withBookings: 0
      })
    }

    monthlyData.get(monthKey).total += 1
  })

  // Process bookings for users who registered in each month
  bookings.forEach(booking => {
    if (dateFilter?.from && dateFilter?.to) {
      const bookingDate = parseISO(booking.created_at)
      if (bookingDate < dateFilter.from || bookingDate > dateFilter.to) {
        return // Skip bookings outside date range
      }
    }

    const user = users.find(u => u.id === booking.user_id)
    if (user) {
      const userRegDate = parseISO(user.created_at)
      const bookingDate = parseISO(booking.created_at)
      const monthKey = format(userRegDate, 'yyyy-MM')

      if (monthlyData.has(monthKey) &&
          format(userRegDate, 'yyyy-MM') === format(bookingDate, 'yyyy-MM')) {
        monthlyData.get(monthKey).withBookings += 1
      }
    }
  })

  const sortedMonths = Array.from(monthlyData.keys()).sort()

  return {
    labels: sortedMonths.map(month => format(parseISO(month + '-01'), 'MMM yyyy', { locale: id })),
    datasets: [
      {
        label: 'Total Registrations',
        data: sortedMonths.map(month => monthlyData.get(month).total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'With Bookings',
        data: sortedMonths.map(month => monthlyData.get(month).withBookings),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4
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