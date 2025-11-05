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
import { UnifiedPageHeader } from '@/components/ui/unified-page-header'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  profile_photo: string | null;
  role: 'admin';
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
        title="Riwayat Reservasi"
        description="Tatap semua reservasi ruangan dan tour secara terintegrasi"
        user={transformedProfile}
        profile={profile}
        isAdmin={true}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className={`pt-24 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
        role="main"
      >
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
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
        </div>
      </main>
    </div>
  )
}
