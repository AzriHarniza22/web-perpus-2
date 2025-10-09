'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'
import { useRooms, useBookings } from '@/lib/api'
import { Booking } from '@/lib/types'
import { useToastContext } from '@/components/ToastProvider'

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !user) {
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

    if (isAuthenticated && user) {
      checkAuth()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login')
      setLoading(false)
    }
  }, [isAuthenticated, user, router, authLoading])

  if (loading || authLoading) {
    return (
      <Loading variant="skeleton" aria-label="Memuat halaman analytics">
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
          {/* Sidebar */}
          <AdminSidebar onToggle={setSidebarCollapsed} />

          {/* Header */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
            role="banner"
          >
            <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0 flex-1"
              >
                <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-40 sm:w-64" />
              </motion.div>
              <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-600 dark:text-gray-300 hidden lg:block"
                >
                  <Skeleton className="h-4 w-24 sm:w-32" />
                </motion.span>
                <ThemeToggle />
                <Skeleton className="h-8 w-16 sm:w-20" />
              </div>
            </div>
          </motion.header>

          <main
            className={`transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
            role="main"
          >
            <div className="p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
              >
                <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
                <Skeleton className="h-4 sm:h-5 w-64 sm:w-96" />
              </motion.div>

              {/* Placeholder for content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="p-4 sm:p-6">
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-24 sm:h-32 w-full" />
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </Loading>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
        role="banner"
      >
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0 flex-1"
          >
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
              Analytics & Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Analisis mendalam penggunaan sistem
            </p>
          </motion.div>
          <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden lg:block text-sm"
            >
              Selamat datang, {profile?.full_name}
            </motion.span>
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
      </motion.header>

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
        role="main"
      >
        <div className="p-4 sm:p-6">

          {/* Analytics Content will be loaded client-side */}
          <AnalyticsContent />
        </div>
      </main>
    </div>
  )
}

function AnalyticsContent() {
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
    tours: rooms || [], // Use rooms data as tours for now since tours are stored as rooms
    users,
    isLoading: usersLoading || bookingsLoading || !rooms
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