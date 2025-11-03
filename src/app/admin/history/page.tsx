'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { AdminHistorySkeleton } from '@/components/ui/skeletons'
import { HistoryContentSkeleton } from '@/components/ui/skeletons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import UnifiedBookingManagement from '@/components/admin/UnifiedBookingManagement'
import { HistoryOverviewCards } from '@/components/admin/analytics/HistoryOverviewCards'
import { useBookings, useRooms } from '@/lib/api'

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

// Unified booking management approach

export default function AdminHistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings()
  const { data: rooms = [] } = useRooms()

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

    if (user) {
      checkAuth()
    } else if (!authLoading && !user) {
      router.push('/login')
      setLoading(false)
    }
  }, [user, router, authLoading])

  if (!profile && !loading) {
    return null
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} loading={loading || authLoading} />

      {/* Header */}
      <div
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={loading ? { opacity: 1 } : { opacity: 0 }}
            animate={loading ? { opacity: 1 } : { opacity: 1 }}
            className="min-w-0 flex-1"
          >
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              Riwayat Reservasi
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Tatap semua reservasi ruangan dan tour secara terintegrasi
            </p>
          </motion.div>
          <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
            <motion.span
              initial={loading ? { opacity: 1 } : { opacity: 0 }}
              animate={loading ? { opacity: 1 } : { opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden lg:block text-sm"
            >
              {loading ? 'Loading...' : `Selamat datang, ${profile?.full_name}`}
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
      </div>

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
        role="main"
      >
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {bookingsLoading ? (
            <HistoryContentSkeleton />
          ) : (
            <>
              {/* History Overview Cards */}
              <HistoryOverviewCards
                bookings={bookingsData?.bookings || []}
                rooms={rooms}
                isLoading={bookingsLoading}
              />

              {/* Unified Booking Management */}
              <UnifiedBookingManagement readonly={true} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
