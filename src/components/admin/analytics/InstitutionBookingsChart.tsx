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
import { Building, TrendingUp, Users, BookOpen } from 'lucide-react'
import { aggregateUserAnalytics } from '@/lib/userAnalytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface InstitutionBookingsChartProps {
  bookings: any[]
  users: any[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

type ChartType = 'grouped' | 'stacked'
type MetricType = 'bookings' | 'users' | 'efficiency'

export function InstitutionBookingsChart({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: InstitutionBookingsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('grouped')
  const [metricType, setMetricType] = useState<MetricType>('bookings')

  const userAnalytics = useMemo(() => {
    return aggregateUserAnalytics(bookings, users, dateFilter)
  }, [bookings, users, dateFilter])

  const chartData = useMemo(() => {
    const topInstitutions = userAnalytics.institutionStats.slice(0, 10)

    if (chartType === 'stacked') {
      return {
        labels: topInstitutions.map(inst => inst.institution.length > 15 ? inst.institution.substring(0, 15) + '...' : inst.institution),
        datasets: [
          {
            label: 'Approved Bookings',
            data: topInstitutions.map(inst => inst.approvedBookings),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Pending Bookings',
            data: topInstitutions.map(inst => inst.totalBookings - inst.approvedBookings),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      }
    } else {
      // Grouped bar chart
      const colors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(124, 58, 237, 0.8)',
        'rgba(244, 63, 94, 0.8)',
      ]

      return {
        labels: topInstitutions.map(inst => inst.institution.length > 15 ? inst.institution.substring(0, 15) + '...' : inst.institution),
        datasets: [
          {
            label: metricType === 'bookings' ? 'Total Bookings' :
                   metricType === 'users' ? 'Total Users' : 'Avg Bookings/User',
            data: topInstitutions.map((inst, index) => {
              switch (metricType) {
                case 'bookings':
                  return inst.totalBookings
                case 'users':
                  return inst.totalUsers
                case 'efficiency':
                  return inst.avgBookingsPerUser
                default:
                  return inst.totalBookings
              }
            }),
            backgroundColor: colors.slice(0, topInstitutions.length),
            borderColor: colors.slice(0, topInstitutions.length).map(color => color.replace('0.8', '1')),
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      }
    }
  }, [userAnalytics.institutionStats, chartType, metricType])

  const totalBookings = useMemo(() => {
    return userAnalytics.institutionStats.reduce((sum, inst) => sum + inst.totalBookings, 0)
  }, [userAnalytics.institutionStats])

  const totalInstitutions = useMemo(() => {
    return userAnalytics.institutionStats.length
  }, [userAnalytics.institutionStats])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Institution Comparison
          </CardTitle>
          <CardDescription>Perbandingan aktivitas antar institusi</CardDescription>
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
              <Building className="w-5 h-5" />
              Institution Comparison
            </CardTitle>
            <CardDescription>
              Perbandingan aktivitas booking antar institusi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {totalInstitutions} Institutions
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {totalBookings} Total Bookings
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
                variant={chartType === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('grouped')}
                className="rounded-r-none"
              >
                Grouped
              </Button>
              <Button
                variant={chartType === 'stacked' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('stacked')}
                className="rounded-l-none"
              >
                Stacked
              </Button>
            </div>

            {chartType === 'grouped' && (
              <div className="flex rounded-lg border bg-white dark:bg-gray-800">
                <Button
                  variant={metricType === 'bookings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMetricType('bookings')}
                  className="rounded-r-none"
                >
                  Bookings
                </Button>
                <Button
                  variant={metricType === 'users' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMetricType('users')}
                  className="rounded-none"
                >
                  Users
                </Button>
                <Button
                  variant={metricType === 'efficiency' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMetricType('efficiency')}
                  className="rounded-l-none"
                >
                  Efficiency
                </Button>
              </div>
            )}
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
                          const institution = userAnalytics.institutionStats[context.dataIndex]

                          if (chartType === 'stacked') {
                            return `${context.dataset.label}: ${value}`
                          } else {
                            switch (metricType) {
                              case 'bookings':
                                return `Total Bookings: ${value}`
                              case 'users':
                                return `Total Users: ${value}`
                              case 'efficiency':
                                return `Avg Bookings/User: ${value.toFixed(1)}`
                              default:
                                return `${value}`
                            }
                          }
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
                        precision: 0
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

          {/* Institution Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userAnalytics.institutionStats.slice(0, 6).map((institution, index) => (
              <motion.div
                key={institution.institution}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {institution.institution}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Bookings
                    </span>
                    <span className="font-medium">{institution.totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Users
                    </span>
                    <span className="font-medium">{institution.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Efficiency
                    </span>
                    <span className="font-medium">{institution.avgBookingsPerUser.toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}