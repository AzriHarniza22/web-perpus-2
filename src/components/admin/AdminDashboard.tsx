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

// Consistent animation configurations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const cardHover = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.2, ease: "easeOut" }
}

const iconHover = {
  scale: 1.1,
  transition: { duration: 0.2, ease: "easeOut" }
}

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
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`flex-shrink-0 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="px-4 py-3 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Skeleton className="h-7 w-40 mb-1" />
                <Skeleton className="h-3 w-48" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center space-x-3"
              >
                <Skeleton className="h-3 w-24 hidden md:block" />
                <ThemeToggle />
                <Skeleton className="h-8 w-16" />
              </motion.div>
            </div>
          </motion.header>

          {/* Main Content - Scrollable */}
          <main className={`flex-1 overflow-auto transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <motion.div
              className="p-4 h-full flex flex-col"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Title */}
              <motion.div
                variants={fadeInUp}
                className="flex-shrink-0 mb-3"
              >
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                variants={staggerContainer}
                className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"
              >
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="bg-card">
                      <CardContent className="p-3">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-12" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Main Grid - Flexible */}
              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.4 }}
                className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0"
              >
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
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <Skeleton className="h-16 w-full mb-2" />
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </motion.div>
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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex-shrink-0 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 z-10 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-4 lg:px-6 py-3 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Kelola ruangan dan reservasi</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center space-x-2 lg:space-x-4"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
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
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content - Scrollable area */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="p-3 lg:p-4 h-full flex flex-col">
          {/* Stats Cards - Fixed height, no grow */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
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
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card backdrop-blur-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-2.5 lg:p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] lg:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{stat.label}</p>
                        <p className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <motion.div
                        className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <stat.icon className="w-5 h-5 text-white" />
                      </motion.div>
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
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
                className="h-full flex flex-col"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col min-h-0 hover:shadow-xl transition-all duration-300">
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
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
                className="flex-1 min-h-0"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col hover:shadow-xl transition-all duration-300">
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
                      <motion.div
                        className="space-y-2"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {bookings
                          .filter(booking => booking.status === 'pending')
                          .slice(0, 4)
                          .map((booking, index) => (
                            <motion.div
                              key={booking.id}
                              variants={fadeInUp}
                              whileHover={{ scale: 1.02, x: 2 }}
                              className="p-1 lg:p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 cursor-pointer transition-all duration-200"
                            >
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
                            </motion.div>
                          ))}
                        {adminStats.pendingApprovals > 4 && (
                          <motion.p
                            variants={fadeInUp}
                            className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 text-center pt-1"
                          >
                            +{adminStats.pendingApprovals - 4} lagi
                          </motion.p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        variants={fadeInUp}
                        className="text-center py-4"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                          className="text-green-500 text-xl mb-1"
                        >
                          ✅
                        </motion.div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Semua sudah diproses
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming Reservations */}
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
                className="flex-1 min-h-0"
              >
                <Card className="bg-card backdrop-blur-sm h-full flex flex-col hover:shadow-xl transition-all duration-300">
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
                          <motion.div
                            variants={fadeInUp}
                            className="text-center py-4"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                              className="text-gray-400 text-2xl mb-1"
                            >
                              📅
                            </motion.div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Belum ada reservasi
                            </p>
                          </motion.div>
                        )
                      }

                      return (
                        <motion.div
                          className="space-y-3"
                          variants={staggerContainer}
                          initial="initial"
                          animate="animate"
                        >
                          {todayBookings.length > 0 && (
                            <motion.div variants={fadeInUp}>
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                                  className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"
                                ></motion.div>
                                Hari Ini
                              </h4>
                              <div className="space-y-1.5">
                                {todayBookings.map((booking, index) => (
                                  <motion.div
                                    key={booking.id}
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.02, x: 2 }}
                                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer transition-all duration-200"
                                  >
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
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {tomorrowBookings.length > 0 && (
                            <motion.div variants={fadeInUp}>
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
                                  className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-1.5"
                                ></motion.div>
                                Besok
                              </h4>
                              <div className="space-y-1.5">
                                {tomorrowBookings.map((booking, index) => (
                                  <motion.div
                                    key={booking.id}
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.02, x: 2 }}
                                    className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 cursor-pointer transition-all duration-200"
                                  >
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
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
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