'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import InteractiveCalendar from '../app/InteractiveCalendar'

interface DashboardLayoutProps {
  user: any
  profile: any
  myReservations: any[]
  allBookings: any[]
}

export default function DashboardLayout({ user, profile, myReservations, allBookings }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  const stats = useMemo(() => {
    const now = new Date()
    const totalBookings = myReservations.length
    const upcomingReservations = myReservations.filter(
      (r: any) => new Date(r.start_time) >= now
    )
    const pastReservations = myReservations.filter(
      (r: any) => new Date(r.start_time) < now
    )
    const upcomingBookings = upcomingReservations.length
    const completedBookings = pastReservations.length

    // Calculate total hours from all bookings
    const totalHours = myReservations.reduce((total, reservation) => {
      const start = new Date(reservation.start_time)
      const end = new Date(reservation.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)

    return {
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalHours: Math.round(totalHours)
    }
  }, [myReservations])

  const upcomingBookingsList = useMemo(() => {
    const now = new Date()
    return myReservations.filter(reservation =>
      new Date(reservation.start_time) > now && reservation.status === 'approved'
    )
  }, [myReservations])

  const transformedBookings = useMemo(() => {
    return allBookings.map(booking => ({
      ...booking,
      rooms: booking.room,
      start_time: booking.start_time,
      end_time: booking.end_time
    }))
  }, [allBookings])

  const handleSignOut = useCallback(() => {
    router.push('/auth/signout')
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Kelola reservasi ruangan Anda dengan mudah"
        user={user}
        onSignOut={handleSignOut}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`px-6 pb-8 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: BookOpen, label: 'Total Reservasi', value: stats.totalBookings, bgColor: 'bg-blue-500' },
            { icon: Clock, label: 'Reservasi Mendatang', value: stats.upcomingBookings, bgColor: 'bg-purple-500' },
            { icon: CheckCircle, label: 'Reservasi Selesai', value: stats.completedBookings, bgColor: 'bg-green-500' },
            { icon: TrendingUp, label: 'Total Jam', value: stats.totalHours, bgColor: 'bg-orange-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              <Card className="bg-card hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer group h-32 transition-all duration-75 ease-out">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-1">{stat.label}</p>
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 flex-shrink-0 transition-transform duration-75 ease-out`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar and Upcoming Reservations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Interactive Calendar */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                  Kalender Reservasi
                </CardTitle>
                <CardDescription>
                  Lihat semua booking yang tersedia dan sudah dipesan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InteractiveCalendar bookings={transformedBookings} layout="horizontal" />
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Reservations */}
          <div className="space-y-4">
            <Card className="bg-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-gray-600" />
                  Reservasi Mendatang
                </CardTitle>
                <CardDescription>
                  Reservasi yang telah disetujui dan akan datang
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookingsList.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookingsList.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.room?.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(booking.start_time).toLocaleDateString('id-ID')} {' '}
                              {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {' '}
                              {new Date(booking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                            Disetujui
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingBookingsList.length > 5 && (
                      <div className="text-center pt-4">
                        <Link href="/history">
                          <Button variant="outline" size="sm">
                            Lihat Semua Reservasi
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-primary dark:text-primary-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Belum ada reservasi aktif
                    </p>
                    <Link href="/book">
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        <Sparkles className="w-4 h-4 mr-2 text-white" />
                        Buat Reservasi Pertama Anda
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

      </main>
    </div>
  )
}