'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminApprovalsSkeleton } from '@/components/ui/skeletons'
import { ApprovalsContentSkeleton } from '@/components/ui/skeletons'
import { Clock, TrendingUp, CheckCircle, XCircle, Users, Building, BookOpen, LogOut } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import BookingApprovals from '@/components/admin/BookingApprovals'
import { useBookings, useRooms } from '@/lib/api'
import { ApprovalsOverviewCards } from '@/components/admin/analytics/ApprovalsOverviewCards'

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

function ApprovalsContent() {
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings()
  const { data: rooms } = useRooms()

  if (bookingsLoading) {
    return <ApprovalsContentSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <ApprovalsOverviewCards
          bookings={bookingsData?.bookings || []}
          rooms={rooms || []}
          isLoading={bookingsLoading}
        />
      </motion.div>

      {/* Enhanced Booking Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <BookingApprovals />
      </motion.div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                Dashboard Persetujuan
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                Kelola semua permintaan reservasi ruangan dan tour
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
              <span className="text-gray-600 dark:text-gray-300 hidden lg:block text-sm">
                {loading ? 'Loading...' : `Selamat datang, ${profile?.full_name}`}
              </span>
              <ThemeToggle />
              <form action="/auth/signout" method="post">
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="hidden sm:flex"
                  aria-label="Keluar dari sistem"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  Keluar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="sm:hidden p-2"
                  aria-label="Keluar dari sistem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
        role="main"
      >
        <div className="p-4 sm:p-6">

          {/* Page Header */}
          <div className="mb-0">
          </div>

          {/* Approvals Content */}
          <ApprovalsContent />
        </div>
      </main>
    </div>
  )
}
