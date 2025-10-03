'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react'
import { aggregateUserAnalytics } from '@/lib/userAnalytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface UserBookingDistributionChartProps {
  bookings: any[]
  users: any[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

type DistributionType = 'histogram' | 'cumulative'
type MetricType = 'count' | 'percentage'

export function UserBookingDistributionChart({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: UserBookingDistributionChartProps) {
  const [distributionType, setDistributionType] = useState<DistributionType>('histogram')
  const [metricType, setMetricType] = useState<MetricType>('count')

  const userAnalytics = useMemo(() => {
    return aggregateUserAnalytics(bookings, users, dateFilter)
  }, [bookings, users, dateFilter])

  const distributionData = useMemo(() => {
    const usersWithBookings = userAnalytics.topUsers.filter(user => user.bookingCount > 0)

    // Create booking frequency ranges
    const ranges = [
      { min: 1, max: 2, label: '1-2 bookings' },
      { min: 3, max: 5, label: '3-5 bookings' },
      { min: 6, max: 10, label: '6-10 bookings' },
      { min: 11, max: 20, label: '11-20 bookings' },
      { min: 21, max: 50, label: '21-50 bookings' },
      { min: 51, max: Infinity, label: '50+ bookings' }
    ]

    const histogramData = ranges.map(range => {
      const count = usersWithBookings.filter(user =>
        user.bookingCount >= range.min && user.bookingCount <= range.max
      ).length

      const percentage = usersWithBookings.length > 0 ? (count / usersWithBookings.length) * 100 : 0

      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 10) / 10
      }
    })

    // Calculate cumulative data
    const cumulativeData = []
    let cumulativeCount = 0
    let cumulativePercentage = 0

    for (let i = 0; i < histogramData.length; i++) {
      cumulativeCount += histogramData[i].count
      cumulativePercentage += histogramData[i].percentage

      cumulativeData.push({
        range: histogramData[i].range,
        count: cumulativeCount,
        percentage: Math.round(cumulativePercentage * 10) / 10
      })
    }

    return {
      histogram: histogramData,
      cumulative: cumulativeData
    }
  }, [userAnalytics.topUsers])

  const chartData = useMemo(() => {
    const data = distributionType === 'histogram' ? distributionData.histogram : distributionData.cumulative

    return {
      labels: data.map(d => d.range),
      datasets: [
        {
          label: metricType === 'count' ? 'Number of Users' : 'Percentage (%)',
          data: data.map(d => metricType === 'count' ? d.count : d.percentage),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [distributionData, distributionType, metricType])

  const stats = useMemo(() => {
    const usersWithBookings = userAnalytics.topUsers.filter(user => user.bookingCount > 0)
    const bookingCounts = usersWithBookings.map(user => user.bookingCount)

    if (bookingCounts.length === 0) {
      return {
        mean: 0,
        median: 0,
        mode: 0,
        totalUsers: 0,
        usersWithBookings: 0
      }
    }

    // Calculate mean
    const mean = bookingCounts.reduce((sum, count) => sum + count, 0) / bookingCounts.length

    // Calculate median
    const sortedCounts = [...bookingCounts].sort((a, b) => a - b)
    const median = sortedCounts.length % 2 === 0
      ? (sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2
      : sortedCounts[Math.floor(sortedCounts.length / 2)]

    // Calculate mode (most frequent booking count)
    const frequencyMap = new Map()
    bookingCounts.forEach(count => {
      frequencyMap.set(count, (frequencyMap.get(count) || 0) + 1)
    })
    const mode = Array.from(frequencyMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]

    return {
      mean: Math.round(mean * 10) / 10,
      median,
      mode,
      totalUsers: userAnalytics.totalUsers,
      usersWithBookings: usersWithBookings.length
    }
  }, [userAnalytics])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Booking Distribution
          </CardTitle>
          <CardDescription>Distribusi frekuensi booking pengguna</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              Booking Distribution Analysis
            </CardTitle>
            <CardDescription>
              Distribusi frekuensi booking pengguna
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stats.usersWithBookings} Active
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Mean: {stats.mean}
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
                variant={distributionType === 'histogram' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDistributionType('histogram')}
                className="rounded-r-none"
              >
                Histogram
              </Button>
              <Button
                variant={distributionType === 'cumulative' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDistributionType('cumulative')}
                className="rounded-l-none"
              >
                Cumulative
              </Button>
            </div>

            <div className="flex rounded-lg border bg-white dark:bg-gray-800">
              <Button
                variant={metricType === 'count' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetricType('count')}
                className="rounded-r-none"
              >
                Count
              </Button>
              <Button
                variant={metricType === 'percentage' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMetricType('percentage')}
                className="rounded-l-none"
              >
                Percentage
              </Button>
            </div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-80">
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
                        label: (context: any) => {
                          const value = context.parsed.y
                          return `${metricType === 'count' ? 'Users' : 'Percentage'}: ${value}${metricType === 'percentage' ? '%' : ''}`
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
                        },
                        maxRotation: 45
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
                        precision: 0,
                        callback: function(value: any) {
                          return metricType === 'percentage' ? value + '%' : value
                        }
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest' as const,
                    axis: 'x' as const,
                    intersect: false
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Mean</span>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats.mean}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Avg bookings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Median</span>
              </div>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">{stats.median}</p>
              <p className="text-xs text-green-700 dark:text-green-300">Middle value</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Mode</span>
              </div>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{stats.mode}</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Most common</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Active</span>
              </div>
              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {Math.round((stats.usersWithBookings / stats.totalUsers) * 100)}%
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">Activity rate</p>
            </motion.div>
          </div>

          {/* Distribution Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Distribution Details
            </h4>
            <div className="space-y-2">
              {distributionData.histogram.map((item, index) => (
                <motion.div
                  key={item.range}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.range}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count} users
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}