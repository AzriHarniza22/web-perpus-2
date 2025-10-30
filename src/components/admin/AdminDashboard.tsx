'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Building, Calendar, Clock, AlertTriangle, LogOut, Sparkles, TrendingUp, BookOpen, CheckCircle } from 'lucide-react'
import { useBookings, useRooms } from '@/lib/api'
import AdminSidebar from './AdminSidebar'
import InteractiveCalendar from '@/app/InteractiveCalendar'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'staff';
  created_at: string;
  updated_at: string;
}

interface AdminDashboardProps {
  profile: Profile
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings()
  const bookings = bookingsData?.bookings || []
  const { data: rooms = [], isLoading: roomsLoading } = useRooms()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Calculate real admin stats using useMemo to prevent infinite re-renders
  const adminStats = useMemo(() => {
    const currentBookings = bookings || []
    const currentRooms = rooms || []

    if (currentBookings.length === 0 && currentRooms.length === 0) {
      return {
        totalRooms: 0,
        totalUsers: 0,
        monthlyBookings: 0,
        occupancyRate: 0,
        todayBookings: 0,
        tomorrowBookings: 0,
        pendingApprovals: 0
      }
    }

    // Get unique users from bookings
    const uniqueUsers = new Set(currentBookings.map(booking => booking.user_id)).size

    // Get current month bookings
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyBookings = currentBookings.filter(booking => {
      const bookingDate = new Date(booking.created_at)
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
    }).length

    // Calculate occupancy rate (simplified - bookings vs available slots)
    const totalPossibleBookings = currentRooms.length * 30 // Assuming 30 days in month
    const occupancyRate = totalPossibleBookings > 0 ? Math.round((monthlyBookings / totalPossibleBookings) * 100) : 0

    // Filter today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayBookings = currentBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate >= today && bookingDate < tomorrow &&
             (booking.status === 'approved' || booking.status === 'pending')
    }).length

    const tomorrowBookings = currentBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate >= tomorrow && bookingDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) &&
             (booking.status === 'approved' || booking.status === 'pending')
    }).length

    // Count pending approvals
    const pendingApprovals = currentBookings.filter(booking => booking.status === 'pending').length

    return {
      totalRooms: currentRooms.length,
      totalUsers: uniqueUsers,
      monthlyBookings,
      occupancyRate,
      todayBookings,
      tomorrowBookings,
      pendingApprovals
    }
  }, [bookings, rooms])

  if (bookingsLoading || roomsLoading) {
    return (
      <Loading variant="skeleton">
        <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900 overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar onToggle={setSidebarCollapsed} />

          {/* Header - Fixed */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`flex-shrink-0 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="px-4 py-3 flex justify-between items-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Skeleton className="h-7 w-40 mb-1" />
                <Skeleton className="h-3 w-48" />
              </motion.div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-24 hidden md:block" />
                <ThemeToggle />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </motion.header>

          {/* Main Content - Scrollable */}
          <main className={`flex-1 overflow-auto transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <div className="p-4 h-full flex flex-col">
              {/* Title */}
              <div className="flex-shrink-0 mb-3">
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>

              {/* Stats Cards */}
              <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-card">
                    <CardContent className="p-3">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-12" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Grid - Flexible */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                <div className="lg:col-span-2">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-2">
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      <Skeleton className="h-full w-full rounded-lg" />
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-col gap-4">
                  <Card className="flex-1 min-h-0">
                    <CardHeader className="flex-shrink-0 pb-2">
                      <Skeleton className="h-5 w-28" />
                    </CardHeader>
                    <CardContent className="overflow-auto">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full mb-2" />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Loading>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header - Fixed at top */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`flex-shrink-0 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 z-10 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-4 lg:px-6 py-3 flex justify-between items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Kelola ruangan dan reservasi</p>
          </motion.div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-600 dark:text-gray-300 hidden md:block"
            >
              {profile?.full_name}
            </motion.span>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="w-4 h-4 lg:mr-2 text-primary" />
                <span className="hidden lg:inline">Keluar</span>
              </Button>
            </form>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Scrollable area */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="p-3 lg:p-4 h-full flex flex-col">
          {/* Stats Cards - Fixed height, no grow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-3 lg:mb-4"
          >
            {[
              { icon: BookOpen, label: 'Total Ruangan', value: adminStats.totalRooms.toString(), bgColor: 'bg-blue-500' },
              { icon: TrendingUp, label: 'Total Pengguna', value: adminStats.totalUsers.toString(), bgColor: 'bg-purple-500' },
              { icon: CheckCircle, label: 'Hari Ini', value: adminStats.todayBookings.toString(), bgColor: 'bg-green-500' },
              { icon: Clock, label: 'Besok', value: adminStats.tomorrowBookings.toString(), bgColor: 'bg-orange-500' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05, type: "spring", stiffness: 200 }}
              >
                <Card className="bg-card backdrop-blur-sm hover:shadow-lg transition-all group">
                  <CardContent className="p-2.5 lg:p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] lg:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{stat.label}</p>
                        <p className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-75 ease-out`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid - Flexible, fills remaining space */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 min-h-0">
            {/* Calendar - 2 columns on large screens */}
            <div className="lg:col-span-2 flex flex-col min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="h-full flex flex-col"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col min-h-0">
                  <CardHeader className="pb-2 lg:pb-3 flex-shrink-0">
                    <CardTitle className="flex items-center text-sm lg:text-base">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      Kalender Reservasi
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                      Lihat reservasi berdasarkan tanggal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-3 pt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full rounded-lg overflow-hidden">
                      <InteractiveCalendar bookings={bookings} layout="horizontal" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Side Panel - 1 column, scrollable content */}
            <div className="flex flex-col gap-3 lg:gap-4 min-h-0">
              {/* Pending Approvals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex-1 min-h-0"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col">
                  <CardHeader className="pb-2 lg:pb-3">
                    <CardTitle className="flex items-center text-sm lg:text-base">
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                      {adminStats.pendingApprovals} menunggu persetujuan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-3 pt-0 flex-1 overflow-y-auto">
                    {adminStats.pendingApprovals > 0 ? (
                      <div className="space-y-2">
                        {bookings
                          .filter(booking => booking.status === 'pending')
                          .slice(0, 4)
                          .map((booking) => (
                            <div key={booking.id} className="p-1 lg:p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-start justify-between mb-0.5">
                                <p className="font-medium text-gray-900 dark:text-white text-[10px] lg:text-xs truncate flex-1">
                                  {booking.rooms?.name}
                                </p>
                                <Badge variant="secondary" className="text-[10px] lg:text-xs ml-2 flex-shrink-0">
                                  Pending
                                </Badge>
                              </div>
                              <p className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400 truncate">
                                {booking.profiles?.full_name}
                              </p>
                              <p className="text-[9px] lg:text-[10px] text-gray-500 dark:text-gray-500">
                                {new Date(booking.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        {adminStats.pendingApprovals > 4 && (
                          <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                            +{adminStats.pendingApprovals - 4} lagi
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-green-500 text-xl mb-1">✅</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Semua sudah diproses
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Reservations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 min-h-0"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col">
                  <CardHeader className="pb-2 lg:pb-3">
                    <CardTitle className="flex items-center text-sm lg:text-base">
                      <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                      Reservasi Mendatang
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                      Hari ini dan besok
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-3 pt-0 flex-1 overflow-y-auto">
                    {(() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const tomorrow = new Date(today)
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      const dayAfterTomorrow = new Date(tomorrow)
                      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

                      const upcomingBookings = bookings
                        .filter(booking => {
                          const bookingDate = new Date(booking.start_time)
                          return bookingDate >= today &&
                                 bookingDate < dayAfterTomorrow &&
                                 (booking.status === 'approved' || booking.status === 'pending')
                        })
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .slice(0, 6)

                      const todayBookings = upcomingBookings.filter(booking => {
                        const bookingDate = new Date(booking.start_time)
                        return bookingDate >= today && bookingDate < tomorrow
                      })

                      const tomorrowBookings = upcomingBookings.filter(booking => {
                        const bookingDate = new Date(booking.start_time)
                        return bookingDate >= tomorrow && bookingDate < dayAfterTomorrow
                      })

                      if (upcomingBookings.length === 0) {
                        return (
                          <div className="text-center py-4">
                            <div className="text-gray-400 text-2xl mb-1">📅</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Belum ada reservasi
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-3">
                          {todayBookings.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                                Hari Ini
                              </h4>
                              <div className="space-y-1.5">
                                {todayBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                                        {booking.rooms?.name}
                                      </p>
                                      <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                                        {booking.profiles?.full_name} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'} className="ml-2 flex-shrink-0 text-[9px] lg:text-[10px] px-1.5 py-0">
                                      {booking.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tomorrowBookings.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-1.5"></div>
                                Besok
                              </h4>
                              <div className="space-y-1.5">
                                {tomorrowBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                                        {booking.rooms?.name}
                                      </p>
                                      <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                                        {booking.profiles?.full_name} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'} className="ml-2 flex-shrink-0 text-[9px] lg:text-[10px] px-1.5 py-0">
                                      {booking.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}