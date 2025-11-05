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
import { UnifiedPageHeader } from '@/components/ui/unified-page-header'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  profile_photo: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

function ApprovalsContent() {
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings()
  const { data: rooms } = useRooms()

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

  // Transform profile to User type for UnifiedPageHeader
  const transformedProfile = profile ? {
    id: profile.id,
    email: profile.email,
    app_metadata: {},
    user_metadata: {
      full_name: profile.full_name || null,
      role: profile.role || 'admin'
    },
    aud: 'authenticated',
    created_at: profile.created_at,
  } : null

  if (!profile && !loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar - Real component, not skeleton */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header - Real component, not skeleton */}
      <UnifiedPageHeader
        title="Dashboard Persetujuan"
        description="Kelola semua permintaan reservasi ruangan dan tour"
        user={transformedProfile}
        profile={profile}
        isAdmin={true}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`pt-24 transition-all duration-300 ${
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
