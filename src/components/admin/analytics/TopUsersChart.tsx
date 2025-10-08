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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Search, BookOpen, Award, ChevronLeft, ChevronRight, Trophy, Medal, Star } from 'lucide-react'
import { aggregateUserAnalytics, getUserInitials } from '@/lib/userAnalytics'
import { Booking, User } from '@/lib/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TopUsersChartProps {
  bookings: Booking[]
  users: User[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

type ViewMode = 'chart' | 'leaderboard'
type SortBy = 'bookings' | 'approved' | 'recent'

export function TopUsersChart({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: TopUsersChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('leaderboard')
  const [sortBy, setSortBy] = useState<SortBy>('bookings')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const userAnalytics = useMemo(() => {
    console.log('DEBUG: TopUsersChart - Input data:', {
      bookingsCount: bookings?.length || 0,
      usersCount: users?.length || 0,
      dateFilter
    })

    const result = aggregateUserAnalytics(bookings, users, dateFilter)

    console.log('DEBUG: TopUsersChart - Analytics result:', {
      totalUsers: result.totalUsers,
      activeUsers: result.activeUsers,
      topUsersCount: result.topUsers.length,
      sampleTopUsers: result.topUsers.slice(0, 3).map(u => ({
        name: u.name,
        bookingCount: u.bookingCount,
        approvedBookingCount: u.approvedBookingCount
      }))
    })

    return result
  }, [bookings, users, dateFilter])

  const filteredUsers = useMemo(() => {
    let filtered = userAnalytics.topUsers

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.institution.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'bookings':
          return b.bookingCount - a.bookingCount
        case 'approved':
          return b.approvedBookingCount - a.approvedBookingCount
        case 'recent':
          return new Date(b.lastBookingDate || 0).getTime() - new Date(a.lastBookingDate || 0).getTime()
        default:
          return b.bookingCount - a.bookingCount
      }
    })

    return filtered
  }, [userAnalytics.topUsers, searchTerm, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const chartData = useMemo(() => {
    const top10Users = filteredUsers.slice(0, 10)

    return {
      labels: top10Users.map(user => user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name),
      datasets: [
        {
          label: 'Total Bookings',
          data: top10Users.map(user => user.bookingCount),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Approved Bookings',
          data: top10Users.map(user => user.approvedBookingCount),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [filteredUsers])

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <Star className="w-5 h-5 text-blue-500" />
    }
  }

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
      case 3:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Users Leaderboard
          </CardTitle>
          <CardDescription>Pengguna dengan aktivitas tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
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
              Top Users Leaderboard
            </CardTitle>
            <CardDescription>
              Pengguna dengan aktivitas booking tertinggi
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {filteredUsers.length} Users
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
                  variant={viewMode === 'leaderboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('leaderboard')}
                  className="rounded-r-none"
                >
                  Leaderboard
                </Button>
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                  className="rounded-l-none"
                >
                  Chart
                </Button>
              </div>

              <div className="flex rounded-lg border bg-white dark:bg-gray-800">
                <Button
                  variant={sortBy === 'bookings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('bookings')}
                  className="rounded-r-none"
                >
                  Bookings
                </Button>
                <Button
                  variant={sortBy === 'approved' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('approved')}
                  className="rounded-none"
                >
                  Approved
                </Button>
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                  className="rounded-l-none"
                >
                  Recent
                </Button>
              </div>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          {viewMode === 'leaderboard' ? (
            <>
              {/* User List */}
              <div className="space-y-3">
                {paginatedUsers.map((user, index) => {
                  const globalIndex = startIndex + index
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getRankBadgeColor(globalIndex + 1)}`}>
                            #{globalIndex + 1}
                          </Badge>
                          {getRankIcon(globalIndex + 1)}
                        </div>

                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {user.institution}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.bookingCount}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.approvedBookingCount} approved
                            </p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {user.bookingCount}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Chart View */
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}