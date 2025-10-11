'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loading } from '@/components/ui/loading'
import { History, User as UserIcon, BookOpen, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react'
import { useBookings, useRooms, BookingWithRelations } from '@/lib/api'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'


export default function DashboardPage() {
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const { data: bookingsData } = useBookings({})
  const bookings = bookingsData?.bookings || []

  const stats = useMemo(() => {
    if (!isAuthenticated || !user) {
      return {
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        totalHours: 0
      }
    }
    const userBookings = bookings.filter(booking => booking.user_id === user.id)
    const now = new Date()

    const totalBookings = userBookings.length
    const upcomingBookingsFiltered = userBookings.filter(booking =>
      new Date(booking.start_time) > now && booking.status === 'approved'
    )
    const upcomingBookings = upcomingBookingsFiltered.length
    const completedBookings = userBookings.filter(booking =>
      booking.status === 'completed'
    ).length

    // Calculate total hours from all bookings
    const totalHours = userBookings.reduce((total, booking) => {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)

    return {
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalHours: Math.round(totalHours)
    }
  }, [isAuthenticated, user, bookings])

  const upcomingBookingsList = useMemo(() => {
    if (!isAuthenticated || !user) return []
    const userBookings = bookings.filter(booking => booking.user_id === user.id)
    const now = new Date()
    return userBookings.filter(booking =>
      new Date(booking.start_time) > now && booking.status === 'approved'
    )
  }, [isAuthenticated, user, bookings])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleSignOut = useCallback(async () => {
    console.log('Dashboard: handleSignOut called')
    await logout()
    console.log('Dashboard: logout completed, pushing to /')
    router.push('/')
  }, [logout, router])

  if (isLoading) {
    return (
      <Loading variant="skeleton">
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-64 w-full" />
              </Card>
              <Card className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-64 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </Loading>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

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

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: BookOpen,
              title: 'Pesan Ruangan',
              description: 'Pilih dan pesan ruangan yang tersedia untuk kebutuhan Anda',
              href: '/book',
              buttonText: 'Mulai Booking',
              bgColor: 'bg-blue-500',
              variant: 'default' as const
            },
            {
              icon: History,
              title: 'Riwayat Reservasi',
              description: 'Lihat semua reservasi yang telah Anda buat',
              href: '/history',
              buttonText: 'Lihat Riwayat',
              bgColor: 'bg-green-500',
              variant: 'default' as const
            },
            {
              icon: UserIcon,
              title: 'Kelola Profil',
              description: 'Update informasi profil dan preferensi Anda',
              href: '/profile',
              buttonText: 'Kelola Profil',
              bgColor: 'bg-purple-500',
              variant: 'default' as const
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.1 }}
            >
              <Card className="bg-card hover:shadow-xl hover:-translate-y-1 hover:scale-105 group transition-all duration-75 ease-out">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-75 ease-out`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={card.href}>
                    <Button variant={card.variant} className="w-full rounded-lg">
                      <card.icon className="w-4 h-4 mr-2 text-current" />
                      {card.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
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
                  {upcomingBookingsList.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{booking.rooms?.name}</p>
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
                  {upcomingBookingsList.length > 3 && (
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
        </motion.div>
      </main>
    </div>
  )
}