'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AnalyticsContentSkeleton } from '@/components/ui/skeletons'
import { LogOut, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { useRooms, useBookings } from '@/lib/api'
import { Booking } from '@/lib/types'
import { useToastContext } from '@/components/ToastProvider'
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


export default function AnalyticsPage() {
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

  if (!profile && !loading && !authLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar - Real component, not skeleton */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header - Real component, not skeleton */}
      <UnifiedPageHeader
        title="Analytics & Reports"
        description="Analisis mendalam penggunaan sistem"
        user={user}
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
        <div className="p-4 sm:p-6">
          <AnalyticsContent />
        </div>
      </main>
    </div>
  )
}

function AnalyticsContent() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { data: rooms } = useRooms()
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useBookings()
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [exportStatus, setExportStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', format?: string }>({ status: 'idle' })
  const toast = useToastContext()

  const bookings = (bookingsData?.bookings || []) as Booking[]

  // Debug logging
  console.log('Analytics Debug:', {
    rooms: rooms?.length || 0,
    bookings: bookings?.length || 0,
    bookingsData,
    bookingsLoading,
    bookingsError,
    users: users.length
  })

  // Debug: Log booking statuses to understand the data
  if (bookings && bookings.length > 0) {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('DEBUG: Booking status distribution:', statusCounts)
    console.log('DEBUG: Sample booking statuses:', bookings.slice(0, 5).map(b => ({ id: b.id, status: b.status })))
  } else {
    console.log('DEBUG: No bookings found or bookings array is empty')
  }

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching users:', error)
        } else {
          console.log('Users fetched:', data?.length || 0)
          setUsers(data || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle export status changes
  const handleExportStatusChange = (status: 'idle' | 'loading' | 'success' | 'error', format?: string) => {
    setExportStatus({ status, format })

    if (status === 'loading' && format) {
      toast.info(`Memulai ekspor ${format.toUpperCase()}`, 'Proses ekspor sedang berlangsung...')
    } else if (status === 'success' && format) {
      toast.success(`Ekspor ${format.toUpperCase()} berhasil!`, 'File telah diunduh ke perangkat Anda.')
    } else if (status === 'error' && format) {
      toast.error(`Ekspor ${format.toUpperCase()} gagal`, 'Terjadi kesalahan saat mengeskpor data. Silakan coba lagi.')
    }

    // Reset status after a delay
    if (status !== 'idle') {
      setTimeout(() => setExportStatus({ status: 'idle' }), 3000)
    }
  }

  // Prepare data for the AnalyticsDashboard component
  const dashboardData = {
    bookings,
    rooms: rooms || [],
    tours: [], // TODO: Implement proper tours data fetching
    users,
    isLoading: usersLoading || !rooms
  }

  return (
    <div className="relative">
      {/* Export Progress Indicator */}
      {exportStatus.status === 'loading' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-40 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg p-4 shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-primary dark:text-primary-foreground">
                Mengekspor {exportStatus.format?.toUpperCase()}...
              </p>
              <p className="text-xs text-primary/80 dark:text-primary-foreground/80">
                Mohon tunggu sebentar
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <AnalyticsDashboard {...dashboardData} onExportStatusChange={handleExportStatusChange} />
    </div>
  )
}