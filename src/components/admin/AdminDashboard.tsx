'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Building, Calendar, Clock, AlertTriangle, LogOut, Sparkles, TrendingUp } from 'lucide-react'
import { useBookings, useRooms } from '@/lib/api'
import AdminSidebar from './AdminSidebar'
import InteractiveCalendar from '@/app/InteractiveCalendar'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  role: 'user' | 'admin';
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          {/* Sidebar */}
          <AdminSidebar onToggle={setSidebarCollapsed} />

          {/* Header */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="px-6 py-4 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-600 dark:text-gray-300 hidden md:block"
                >
                  <Skeleton className="h-4 w-32" />
                </motion.span>
                <ThemeToggle />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </motion.header>

          <main className={`p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {[
                { icon: Building, label: 'Total Ruangan', value: '0', color: 'from-blue-500 to-cyan-400' },
                { icon: Users, label: 'Total Pengguna', value: '0', color: 'from-purple-500 to-pink-400' },
                { icon: Calendar, label: 'Reservasi Hari Ini', value: '0', color: 'from-green-500 to-emerald-400' },
                { icon: Clock, label: 'Reservasi Besok', value: '0', color: 'from-orange-500 to-red-400' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                          <Skeleton className="h-6 w-12 mt-1" />
                        </div>
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              {/* Calendar Skeleton */}
              <div className="xl:col-span-2">
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <Skeleton className="h-96 w-full rounded-3xl" />
                  </CardContent>
                </Card>
              </div>

              {/* Pending Approvals Skeleton */}
              <div className="xl:col-span-1">
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-56" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    Aktivitas Terbaru
                  </CardTitle>
                  <CardDescription>
                    Reservasi terbaru yang perlu perhatian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </Loading>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola ruangan dan reservasi dengan efisien</p>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden md:block"
            >
              Selamat datang, {profile?.full_name}
            </motion.span>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </motion.header>

      <main className={`p-4 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex-shrink-0"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Kelola ruangan dan reservasi dengan efisien
          </p>
        </motion.div>

        {/* Stats Cards - Compact Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 flex-shrink-0"
        >
          {[
            { icon: Building, label: 'Total Ruangan', value: adminStats.totalRooms.toString(), color: 'from-blue-500 to-cyan-400' },
            { icon: Users, label: 'Total Pengguna', value: adminStats.totalUsers.toString(), color: 'from-purple-500 to-pink-400' },
            { icon: Calendar, label: 'Reservasi Hari Ini', value: adminStats.todayBookings.toString(), color: 'from-green-500 to-emerald-400' },
            { icon: Clock, label: 'Reservasi Besok', value: adminStats.tomorrowBookings.toString(), color: 'from-orange-500 to-red-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 flex-1">
          {/* Interactive Calendar - Takes 2 columns on xl screens, full width on smaller screens */}
          <div className="lg:col-span-2 xl:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center text-base">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Kalender Reservasi
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Lihat reservasi berdasarkan tanggal
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex-1 min-h-0">
                  <div className="h-full overflow-hidden rounded-lg">
                    <InteractiveCalendar bookings={bookings} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Combined Side Panel - Notifications & Upcoming Reservations */}
          <div className="lg:col-span-2 xl:col-span-1 flex flex-col gap-4">
            {/* Pending Approvals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center text-base">
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {adminStats.pendingApprovals} reservasi menunggu persetujuan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex-1">
                  <div className="max-h-96 overflow-y-auto">
                    {adminStats.pendingApprovals > 0 ? (
                      <div className="space-y-3">
                        {bookings
                          .filter(booking => booking.status === 'pending')
                          .slice(0, 5)
                          .map((booking) => (
                            <div key={booking.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {booking.rooms?.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Pending
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {booking.profiles?.full_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(booking.start_time).toLocaleDateString('id-ID')} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        {adminStats.pendingApprovals > 5 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                            +{adminStats.pendingApprovals - 5} lagi...
                          </p>
                        )}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href="/admin/approvals">
                              Lihat Semua Approvals
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-green-500 text-2xl mb-2">✅</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Semua reservasi sudah diproses
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Reservations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center text-base">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Reservasi Mendatang
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Reservasi hari ini dan besok yang perlu diperhatian
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex-1">
                  <div className="max-h-96 overflow-y-auto">
                    {/* Get upcoming bookings for today and tomorrow */}
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
                        .slice(0, 10) // Max 10 items

                      // Group bookings by day
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
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-3">📅</div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Belum ada reservasi untuk hari ini dan besok
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-4">
                          {/* Today's Bookings */}
                          {todayBookings.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Hari Ini
                              </h4>
                              <div className="space-y-2">
                                {todayBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {booking.rooms?.name}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {booking.profiles?.full_name} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Badge variant={
                                      booking.status === 'approved' ? 'default' :
                                      booking.status === 'pending' ? 'secondary' :
                                      booking.status === 'rejected' ? 'destructive' : 'outline'
                                    } className="ml-2 flex-shrink-0">
                                      {booking.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tomorrow's Bookings */}
                          {tomorrowBookings.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                Besok
                              </h4>
                              <div className="space-y-2">
                                {tomorrowBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {booking.rooms?.name}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {booking.profiles?.full_name} • {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Badge variant={
                                      booking.status === 'approved' ? 'default' :
                                      booking.status === 'pending' ? 'secondary' :
                                      booking.status === 'rejected' ? 'destructive' : 'outline'
                                    } className="ml-2 flex-shrink-0">
                                      {booking.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Show count if more than 10 items */}
                          {upcomingBookings.length >= 10 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                              Menampilkan 10 dari {upcomingBookings.length} reservasi mendatang
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}