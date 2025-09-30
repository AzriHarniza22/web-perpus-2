'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loading } from '@/components/ui/loading'
import { Calendar, History, LogOut, User as UserIcon, BookOpen, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react'
import { useBookings, useRooms, BookingWithRelations } from '@/lib/api'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  facilities: string[] | null;
  photos: string[] | null;
  layout: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalHours: 0
  })
  const [upcomingBookingsList, setUpcomingBookingsList] = useState<BookingWithRelations[]>([])
  const router = useRouter()
  const { data: bookings = [] } = useBookings()
  const { data: rooms = [] } = useRooms()

  // Calculate real stats from user's bookings
  useEffect(() => {
    if (isAuthenticated && user && bookings.length > 0) {
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

      setStats({
        totalBookings,
        upcomingBookings,
        completedBookings,
        totalHours: Math.round(totalHours)
      })
      setUpcomingBookingsList(upcomingBookingsFiltered)
    }
  }, [isAuthenticated, user, bookings])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleSignOut = async () => {
    console.log('Dashboard: handleSignOut called')
    await logout()
    console.log('Dashboard: logout completed, pushing to /')
    router.push('/')
  }

  if (isLoading) {
    return (
      <Loading variant="skeleton">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
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

      <main className={`px-6 py-8 transition-all duration-300 ${
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
            { icon: BookOpen, label: 'Total Reservasi', value: stats.totalBookings, color: 'from-blue-500 to-cyan-400' },
            { icon: Clock, label: 'Reservasi Mendatang', value: stats.upcomingBookings, color: 'from-purple-500 to-pink-400' },
            { icon: CheckCircle, label: 'Reservasi Selesai', value: stats.completedBookings, color: 'from-green-500 to-emerald-400' },
            { icon: TrendingUp, label: 'Total Jam', value: stats.totalHours, color: 'from-orange-500 to-red-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-1">{stat.label}</p>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
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
              color: 'from-blue-500 to-cyan-400',
              variant: 'default' as const
            },
            {
              icon: History,
              title: 'Riwayat Reservasi',
              description: 'Lihat semua reservasi yang telah Anda buat',
              href: '/history',
              buttonText: 'Lihat Riwayat',
              color: 'from-green-500 to-emerald-400',
              variant: 'outline' as const
            },
            {
              icon: UserIcon,
              title: 'Kelola Profil',
              description: 'Update informasi profil dan preferensi Anda',
              href: '/profile',
              buttonText: 'Kelola Profil',
              color: 'from-purple-500 to-pink-400',
              variant: 'outline' as const
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all group">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={card.href}>
                    <Button variant={card.variant} className="w-full">
                      <card.icon className="w-4 h-4 mr-2" />
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
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
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
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
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
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Belum ada reservasi aktif
                  </p>
                  <Link href="/book">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Sparkles className="w-4 h-4 mr-2" />
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