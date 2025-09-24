'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import useAuthStore from '@/lib/authStore'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingStats } from '@/lib/api'
import { TrendingUp, Users, Calendar, BarChart3, LogOut } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'

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

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    checkAuth()
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="ml-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800"
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analisis mendalam penggunaan sistem</p>
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

      <main className="ml-64 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Analisis mendalam penggunaan sistem reservasi ruangan
          </p>
        </motion.div>

        {/* Analytics Content will be loaded client-side */}
        <AnalyticsContent />
      </main>
    </div>
  )
}

function AnalyticsContent() {
  const { data: stats, isLoading } = useBookingStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
      </Card>
    )
  }

  // Prepare chart data
  const monthlyData = stats.monthlyStats.map(item => ({
    month: item.month.split(' ')[0], // Short month name
    bookings: item.count
  }))

  const statusData = [
    { name: 'Disetujui', value: stats.approvedBookings, color: '#10B981' },
    { name: 'Menunggu', value: stats.pendingBookings, color: '#F59E0B' },
    { name: 'Ditolak', value: stats.rejectedBookings, color: '#EF4444' },
    { name: 'Dibatalkan', value: stats.cancelledBookings, color: '#6B7280' },
    { name: 'Selesai', value: stats.completedBookings, color: '#3B82F6' }
  ]

  const roomData = stats.roomStats.map(item => ({
    room: item.room_name,
    bookings: item.booking_count,
    capacity: item.capacity
  }))

  return (
    <div className="space-y-8">
      {/* Monthly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Tren Reservasi Bulanan
            </CardTitle>
            <CardDescription>
              Jumlah reservasi per bulan dalam 12 bulan terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Bulan</th>
                    <th className="text-right py-2">Reservasi</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.month}</td>
                      <td className="text-right py-2 font-medium">{item.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Distribusi Status Reservasi</CardTitle>
              <CardDescription>
                Persentase booking berdasarkan status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Penggunaan Ruangan</CardTitle>
              <CardDescription>
                Jumlah booking per ruangan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Ruangan</th>
                      <th className="text-right py-2">Reservasi</th>
                      <th className="text-right py-2">Kapasitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.room}</td>
                        <td className="text-right py-2 font-medium">{item.bookings}</td>
                        <td className="text-right py-2 text-gray-500">{item.capacity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Reservasi', value: stats.totalBookings, icon: Calendar, color: 'from-blue-500 to-cyan-400' },
          { label: 'Disetujui', value: stats.approvedBookings, icon: Users, color: 'from-green-500 to-emerald-400' },
          { label: 'Menunggu', value: stats.pendingBookings, icon: TrendingUp, color: 'from-yellow-500 to-orange-400' },
          { label: 'Ditolak', value: stats.rejectedBookings, icon: BarChart3, color: 'from-red-500 to-pink-400' }
        ].map((stat, index) => (
          <Card key={stat.label} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}