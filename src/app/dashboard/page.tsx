'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, History, LogOut, User as UserIcon, BookOpen, TrendingUp, Clock, CheckCircle, Sparkles } from 'lucide-react'
import { useBookings, useRooms } from '@/lib/api'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalHours: 0
  })
  const router = useRouter()
  const { data: bookings = [] } = useBookings()
  const { data: rooms = [] } = useRooms()

  // Calculate real stats from user's bookings
  useEffect(() => {
    if (user && bookings.length > 0) {
      const userBookings = bookings.filter(booking => booking.user_id === user.id)
      const now = new Date()

      const totalBookings = userBookings.length
      const upcomingBookings = userBookings.filter(booking =>
        new Date(booking.start_time) > now && booking.status === 'approved'
      ).length
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
    }
  }, [user, bookings])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      setLoading(false)

      if (!currentUser) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
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
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Dashboard
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden md:block"
            >
              Selamat datang, {user.email?.split('@')[0]}
            </motion.span>
            <ThemeToggle />
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Pengguna
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kelola reservasi ruangan Anda dengan mudah
          </p>
        </motion.div>

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
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
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
              color: 'from-blue-500 to-cyan-400'
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
              href: '#',
              buttonText: 'Kelola Profil',
              color: 'from-purple-500 to-pink-400',
              variant: 'outline' as const,
              disabled: true
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
                  {card.disabled ? (
                    <Button variant={card.variant} className="w-full" disabled>
                      <card.icon className="w-4 h-4 mr-2" />
                      {card.buttonText}
                    </Button>
                  ) : (
                    <Link href={card.href}>
                      <Button variant={card.variant} className="w-full">
                        <card.icon className="w-4 h-4 mr-2" />
                        {card.buttonText}
                      </Button>
                    </Link>
                  )}
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
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>
                Reservasi dan aktivitas terbaru Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </motion.div>
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
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}