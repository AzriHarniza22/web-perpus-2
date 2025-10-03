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
  Legend,
  TooltipItem
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building, Search, Users, BookOpen, Award } from 'lucide-react'
import { aggregateUserAnalytics } from '@/lib/userAnalytics'
import { Booking, User } from '@/lib/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TopInstitutionsChartProps {
  bookings: Booking[]
  users: User[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

type ViewMode = 'bar' | 'treemap'
type SortBy = 'users' | 'bookings' | 'activity'

export function TopInstitutionsChart({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: TopInstitutionsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')
  const [sortBy, setSortBy] = useState<SortBy>('users')
  const [searchTerm, setSearchTerm] = useState('')

  const userAnalytics = useMemo(() => {
    return aggregateUserAnalytics(bookings, users, dateFilter)
  }, [bookings, users, dateFilter])

  const filteredInstitutions = useMemo(() => {
    let filtered = userAnalytics.topInstitutions

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'users':
          return b.userCount - a.userCount
        case 'bookings':
          return b.bookingCount - a.bookingCount
        case 'activity':
          return (b.bookingCount / Math.max(b.userCount, 1)) - (a.bookingCount / Math.max(a.userCount, 1))
        default:
          return b.userCount - a.userCount
      }
    })

    return filtered.slice(0, 15) // Top 15
  }, [userAnalytics.topInstitutions, searchTerm, sortBy])

  const chartData = useMemo(() => {
    return {
      labels: filteredInstitutions.map(inst => inst.name),
      datasets: [
        {
          label: 'Total Users',
          data: filteredInstitutions.map(inst => inst.userCount),
          backgroundColor: filteredInstitutions.map(inst => inst.color),
          borderColor: filteredInstitutions.map(inst => inst.color.replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Total Bookings',
          data: filteredInstitutions.map(inst => inst.bookingCount),
          backgroundColor: filteredInstitutions.map(inst => inst.color.replace('0.8', '0.6')),
          borderColor: filteredInstitutions.map(inst => inst.color.replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    }
  }, [filteredInstitutions])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Top Institutions
          </CardTitle>
          <CardDescription>Institusi dengan pengguna terbanyak</CardDescription>
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
              Top Institutions
            </CardTitle>
            <CardDescription>
              Institusi dengan aktivitas pengguna tertinggi
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            {filteredInstitutions.length} Institutions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-white dark:bg-gray-800">
                <Button
                  variant={sortBy === 'users' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('users')}
                  className="rounded-r-none"
                >
                  Users
                </Button>
                <Button
                  variant={sortBy === 'bookings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('bookings')}
                  className="rounded-none"
                >
                  Bookings
                </Button>
                <Button
                  variant={sortBy === 'activity' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('activity')}
                  className="rounded-l-none"
                >
                  Activity
                </Button>
              </div>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari institusi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  indexAxis: 'y' as const,
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
                        label: (tooltipItem: TooltipItem<'bar'>) => {
                          const institution = filteredInstitutions[tooltipItem.dataIndex]
                          const isUsers = tooltipItem.datasetIndex === 0
                          return `${isUsers ? 'Users' : 'Bookings'}: ${tooltipItem.parsed.x}`
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
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
                    },
                    y: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 11
                        },
                        callback: function(value: string | number) {
                          const label = this.getLabelForValue(value as number)
                          return label.length > 20 ? label.substring(0, 20) + '...' : label
                        }
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest' as const,
                    axis: 'y' as const,
                    intersect: false
                  },
                  elements: {
                    bar: {
                      borderRadius: 4
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Institution List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredInstitutions.slice(0, 9).map((institution, index) => (
              <motion.div
                key={institution.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: institution.color }}
                    />
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {institution.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Users
                    </span>
                    <span className="font-medium">{institution.userCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Bookings
                    </span>
                    <span className="font-medium">{institution.bookingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Activity
                    </span>
                    <span className="font-medium">
                      {institution.userCount > 0 ? (institution.bookingCount / institution.userCount).toFixed(1) : '0'}
                    </span>
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