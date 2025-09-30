'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingStats, useUserActivityTrends, usePeakHoursData, useCancellationTrends, useRoomUtilization, useRooms, useBookings, useNotificationStats, Room, Booking } from '@/lib/api'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Users, BarChart3, LogOut, Filter, CalendarIcon, X, Download, FileText, FileImage, FileSpreadsheet, Clock } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format, subMonths, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { MonthlyTrendsChart } from '@/components/admin/MonthlyTrendsChart'
import { StatusDistributionChart } from '@/components/admin/StatusDistributionChart'
import { RoomUsageChart } from '@/components/admin/RoomUsageChart'
import { UserActivityChart } from '@/components/admin/UserActivityChart'
import { PeakHoursHeatmap } from '@/components/admin/PeakHoursHeatmap'
import { CancellationTrendsChart } from '@/components/admin/CancellationTrendsChart'
import { RoomUtilizationGauge } from '@/components/admin/RoomUtilizationGauge'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

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

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  topUsers: Array<{
    name: string
    email: string
    institution?: string
    bookingCount: number
    approvedCount: number
  }>
}

interface InstitutionAnalytics {
  institution: string
  bookingCount: number
  userCount: number
}

interface TimeAnalytics {
  peakHours: Array<{
    hour: number
    count: number
  }>
  peakDays: Array<{
    day: string
    count: number
  }>
  averageDuration: number
}

interface FacilitiesAnalytics {
  facility: string
  usageCount: number
  roomCount: number
}

interface RoomUtilization {
  roomId: string
  roomName: string
  totalCapacity: number
  totalBookings: number
  utilizationRate: number
  averageDuration: number
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
      <Loading variant="skeleton">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          {/* Sidebar */}
          <AdminSidebar onToggle={setSidebarCollapsed} />

          {/* Header */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="px-6 py-4 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-600 dark:text-gray-300 hidden md:block"
                >
                  <Skeleton className="h-4 w-32" />
                </motion.span>
                <ThemeToggle />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </motion.header>

          <main className={`p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </motion.div>

            {/* Placeholder for content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
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

      <main className={`p-6 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])

  const { data: rooms } = useRooms()
  const { data: bookings } = useBookings()
  const { data: notificationStats } = useNotificationStats()

  const dateRangeParam = dateRange?.from && dateRange?.to ? {
    start: dateRange.from.toISOString(),
    end: dateRange.to.toISOString()
  } : undefined

  const { data: stats, isLoading } = useBookingStats(dateRangeParam)
  const { data: userActivity } = useUserActivityTrends(dateRangeParam)
  const { data: peakHours } = usePeakHoursData(dateRangeParam)
  const { data: cancellationTrends } = useCancellationTrends(dateRangeParam)
  const { data: roomUtilization } = useRoomUtilization(dateRangeParam)

  // Enhanced analytics calculation
  const enhancedAnalytics = useMemo(() => {
    if (!bookings || !stats) return null

    const filteredBookings = bookings.filter(booking => {
      if (!dateRange?.from || !dateRange?.to) return true
      return isWithinInterval(new Date(booking.created_at), {
        start: dateRange.from,
        end: dateRange.to
      })
    })

    const userStats = new Map<string, { name: string; email: string; institution?: string; bookings: typeof bookings }>()
    filteredBookings.forEach(booking => {
      const userId = booking.user_id
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          name: booking.profiles?.full_name || 'Unknown',
          email: booking.profiles?.email || 'Unknown',
          institution: booking.profiles?.institution || 'Unknown',
          bookings: []
        })
      }
      userStats.get(userId)!.bookings.push(booking)
    })

    const userAnalytics: UserAnalytics = {
      totalUsers: userStats.size,
      activeUsers: Array.from(userStats.values()).filter(u => u.bookings.length > 0).length,
      topUsers: Array.from(userStats.values())
        .map((user) => ({
          name: user.name,
          email: user.email,
          institution: user.institution,
          bookingCount: user.bookings.length,
          approvedCount: user.bookings.filter((b: Booking) => b.status === 'approved').length
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 10)
    }

    const institutionStats = new Map<string, InstitutionAnalytics>()
    Array.from(userStats.values()).forEach((user) => {
      const institution = user.institution || 'Unknown'
      if (!institutionStats.has(institution)) {
        institutionStats.set(institution, {
          institution,
          bookingCount: 0,
          userCount: 0
        })
      }
      institutionStats.get(institution)!.bookingCount += user.bookings.length
      institutionStats.get(institution)!.userCount += 1
    })
    const institutionAnalytics: InstitutionAnalytics[] = Array.from(institutionStats.values())
      .sort((a, b) => b.bookingCount - a.bookingCount)

    const hourStats = new Map<number, number>()
    const dayStats = new Map<string, number>()
    let totalDuration = 0

    filteredBookings.forEach(booking => {
      const startTime = new Date(booking.start_time)
      const endTime = new Date(booking.end_time)

      const hour = startTime.getHours()
      hourStats.set(hour, (hourStats.get(hour) || 0) + 1)

      const day = startTime.toLocaleDateString('id-ID', { weekday: 'long' })
      dayStats.set(day, (dayStats.get(day) || 0) + 1)

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      totalDuration += duration
    })

    const timeAnalytics = {
      peakHours: Array.from(hourStats.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      peakDays: Array.from(dayStats.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count),
      averageDuration: filteredBookings.length > 0 ? totalDuration / filteredBookings.length : 0
    }

    const facilitiesStats = new Map<string, { facility: string; usageCount: number; roomCount: number }>()
    filteredBookings.forEach(booking => {
      const facilities = booking.rooms?.facilities || []
      facilities.forEach(facility => {
        if (!facilitiesStats.has(facility)) {
          facilitiesStats.set(facility, {
            facility,
            usageCount: 0,
            roomCount: 0
          })
        }
        facilitiesStats.get(facility)!.usageCount += 1
      })
    })
    const facilitiesAnalytics = Array.from(facilitiesStats.values())
      .sort((a, b) => b.usageCount - a.usageCount)

    const roomUtilizationData = stats.roomStats.map(roomStat => {
      const roomBookings = filteredBookings.filter(b => {
        const room = bookings.find(book => book.room_id === b.room_id)
        return room?.rooms?.name === roomStat.room_name
      })

      const totalDuration = roomBookings.reduce((acc, booking) => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }, 0)

      return {
        roomId: roomStat.room_name,
        roomName: roomStat.room_name,
        totalCapacity: roomStat.capacity || 0,
        totalBookings: roomStat.booking_count,
        utilizationRate: roomStat.booking_count > 0 ? (totalDuration / (24 * 30)) * 100 : 0,
        averageDuration: roomBookings.length > 0 ? totalDuration / roomBookings.length : 0
      }
    })

    return {
      userAnalytics,
      timeAnalytics,
      roomUtilization: roomUtilizationData,
      institutionAnalytics,
      facilitiesAnalytics,
      filteredBookings
    }
  }, [bookings, stats, dateRange])

  // Export functions
  const exportToCSV = () => {
    if (!enhancedAnalytics || !stats) return

    const csvData = [
      ['Laporan Analytics Perpustakaan Aceh'],
      ['Periode:', format(dateRange?.from || new Date(), 'dd/MM/yyyy'), 'sampai', format(dateRange?.to || new Date(), 'dd/MM/yyyy')],
      [''],
      ['=== STATISTIK UMUM ==='],
      ['Total Reservasi', stats.totalBookings],
      ['Disetujui', stats.approvedBookings],
      ['Menunggu', stats.pendingBookings],
      ['Ditolak', stats.rejectedBookings],
      ['Dibatalkan', stats.cancelledBookings],
      ['Selesai', stats.completedBookings],
      [''],
      ['=== USER ANALYTICS ==='],
      ['Total Users', enhancedAnalytics.userAnalytics.totalUsers],
      ['Active Users', enhancedAnalytics.userAnalytics.activeUsers],
      [''],
      ['Top Users:'],
      ['Nama', 'Email', 'Institusi', 'Total Booking', 'Disetujui'],
      ...enhancedAnalytics.userAnalytics.topUsers.map(user => [
        user.name,
        user.email,
        user.institution || 'Unknown',
        user.bookingCount,
        user.approvedCount
      ]),
      [''],
      ['=== INSTITUTION ANALYTICS ==='],
      ['Institusi', 'Total Booking', 'Jumlah User'],
      ...enhancedAnalytics.institutionAnalytics.map(inst => [
        inst.institution,
        inst.bookingCount,
        inst.userCount
      ]),
      [''],
      ['=== FACILITIES ANALYTICS ==='],
      ['Fasilitas', 'Jumlah Penggunaan'],
      ...enhancedAnalytics.facilitiesAnalytics.map(fac => [
        fac.facility,
        fac.usageCount
      ]),
      [''],
      ['=== TIME ANALYTICS ==='],
      ['Peak Hours:'],
      ['Jam', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakHours.map(h => [h.hour, h.count]),
      [''],
      ['Peak Days:'],
      ['Hari', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakDays.map(d => [d.day, d.count]),
      [''],
      ['Average Duration (hours)', enhancedAnalytics.timeAnalytics.averageDuration],
      [''],
      ['=== ROOM UTILIZATION ==='],
      ['Room Name', 'Total Bookings', 'Capacity', 'Utilization Rate (%)', 'Average Duration (hours)'],
      ...enhancedAnalytics.roomUtilization.map(room => [
        room.roomName,
        room.totalBookings,
        room.totalCapacity,
        room.utilizationRate.toFixed(2),
        room.averageDuration.toFixed(2)
      ]),
      [''],
      ['=== DETAILED BOOKING LIST ==='],
      ['ID', 'User', 'Email', 'Institution', 'Room', 'Start Time', 'End Time', 'Status', 'Event Description', 'Notes'],
      ...enhancedAnalytics.filteredBookings.map(booking => [
        booking.id,
        booking.profiles?.full_name || 'Unknown',
        booking.profiles?.email || 'Unknown',
        booking.profiles?.institution || 'Unknown',
        booking.rooms?.name || 'Unknown',
        format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
        format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
        booking.status,
        booking.event_description || '',
        booking.notes || ''
      ]),
      [''],
      ['=== NOTIFICATION STATISTICS ==='],
      ['Total Notifications', notificationStats?.totalNotifications || 0],
      ['Sent', notificationStats?.sentNotifications || 0],
      ['Failed', notificationStats?.failedNotifications || 0],
      ['Pending', notificationStats?.pendingNotifications || 0],
      ['Email Notifications', notificationStats?.emailNotifications || 0],
      ['WhatsApp Notifications', notificationStats?.whatsappNotifications || 0]
    ]

    const csvContent = csvData.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    if (!enhancedAnalytics || !stats) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    let yPosition = 20

    const addText = (text: string, x: number, y: number, options?: { align?: string; maxWidth?: number }) => {
      const maxWidth = options?.maxWidth || pageWidth - 40
      const splitText = pdf.splitTextToSize(text, maxWidth)
      pdf.text(splitText, x, y, options)
      return y + (splitText.length * 7)
    }

    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pdf.internal.pageSize.height - 30) {
        pdf.addPage()
        yPosition = 20
      }
    }

    // Title Page
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('LAPORAN ANALYTICS', pageWidth/2, 40, { align: 'center' })
    pdf.setFontSize(20)
    pdf.text('PERPUSTAKAAN ACEH', pageWidth/2, 55, { align: 'center' })

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const periodText = `Periode: ${dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Semua'} - ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Sekarang'}`
    pdf.text(periodText, pageWidth/2, 75, { align: 'center' })
    pdf.text(`Dibuat: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth/2, 85, { align: 'center' })

    // New page for content
    pdf.addPage()
    yPosition = 20

    // Executive Summary
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('RINGKASAN EKSEKUTIF', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    const summaryItems = [
      `Total Reservasi: ${stats.totalBookings}`,
      `Tingkat Persetujuan: ${stats.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%`,
      `Total Pengguna Aktif: ${enhancedAnalytics.userAnalytics.totalUsers}`,
      `Rata-rata Durasi Booking: ${enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} jam`,
      `Institusi Terdaftar: ${enhancedAnalytics.institutionAnalytics.length}`,
      `Fasilitas Tersedia: ${enhancedAnalytics.facilitiesAnalytics.length}`
    ]

    summaryItems.forEach(item => {
      yPosition = addText(`• ${item}`, 30, yPosition)
    })
    yPosition += 15

    // Statistics Overview
    checkNewPage(60)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('STATISTIK RESERVASI', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    const statsItems = [
      `Disetujui: ${stats.approvedBookings} (${stats.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%)`,
      `Menunggu: ${stats.pendingBookings} (${stats.totalBookings ? Math.round((stats.pendingBookings / stats.totalBookings) * 100) : 0}%)`,
      `Ditolak: ${stats.rejectedBookings} (${stats.totalBookings ? Math.round((stats.rejectedBookings / stats.totalBookings) * 100) : 0}%)`,
      `Dibatalkan: ${stats.cancelledBookings} (${stats.totalBookings ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%)`,
      `Selesai: ${stats.completedBookings} (${stats.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%)`
    ]

    statsItems.forEach(item => {
      yPosition = addText(item, 30, yPosition)
    })
    yPosition += 15

    // User Analytics
    checkNewPage(80)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ANALISIS PENGGUNA', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    yPosition = addText(`Total Pengguna: ${enhancedAnalytics.userAnalytics.totalUsers}`, 30, yPosition)
    yPosition = addText(`Pengguna Aktif: ${enhancedAnalytics.userAnalytics.activeUsers}`, 30, yPosition)
    yPosition += 10

    yPosition = addText('Top 5 Pengguna Teraktif:', 30, yPosition)
    enhancedAnalytics.userAnalytics.topUsers.slice(0, 5).forEach((user, index) => {
      const userText = `${index + 1}. ${user.name} - ${user.bookingCount} booking (${user.approvedCount} disetujui)`
      yPosition = addText(userText, 40, yPosition)
    })
    yPosition += 15

    // Institution Analytics
    checkNewPage(60)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ANALISIS INSTITUSI', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    enhancedAnalytics.institutionAnalytics.slice(0, 5).forEach((inst) => {
      const instText = `${inst.institution}: ${inst.bookingCount} bookings, ${inst.userCount} users`
      yPosition = addText(instText, 30, yPosition)
    })
    yPosition += 15

    // Time Analytics
    checkNewPage(60)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ANALISIS WAKTU', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    yPosition = addText(`Rata-rata Durasi: ${enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} jam`, 30, yPosition)
    yPosition += 10

    yPosition = addText('Jam Sibuk:', 30, yPosition)
    enhancedAnalytics.timeAnalytics.peakHours.slice(0, 3).forEach((hour) => {
      const hourText = `Jam ${hour.hour}:00 - ${hour.count} booking`
      yPosition = addText(hourText, 40, yPosition)
    })
    yPosition += 10

    yPosition = addText('Hari Sibuk:', 30, yPosition)
    enhancedAnalytics.timeAnalytics.peakDays.slice(0, 3).forEach((day) => {
      const dayText = `${day.day} - ${day.count} booking`
      yPosition = addText(dayText, 40, yPosition)
    })
    yPosition += 15

    // Room Utilization
    checkNewPage(80)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ANALISIS PENGGUNAAN RUANGAN', 20, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    yPosition += 10

    enhancedAnalytics.roomUtilization.slice(0, 5).forEach((room) => {
      const roomText = `${room.roomName}: ${room.totalBookings} bookings, ${room.utilizationRate.toFixed(1)}% utilisasi`
      yPosition = addText(roomText, 30, yPosition)
    })
    yPosition += 15

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Laporan Analytics Perpustakaan Aceh', 20, pdf.internal.pageSize.height - 10)
    pdf.text(`Dibuat: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 30, pdf.internal.pageSize.height - 10, { align: 'right' })

    pdf.save(`laporan-analytics-lengkap-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const exportToExcel = () => {
    if (!stats || !enhancedAnalytics) return

    const workbook = XLSX.utils.book_new()

    // Summary Statistics Sheet
    const summaryData = [
      ['LAPORAN ANALYTICS PERPUSTAKAAN ACEH'],
      [''],
      ['Informasi Laporan'],
      ['Dibuat pada:', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Periode:', dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Semua', 'sampai', dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Sekarang'],
      [''],
      ['=== RINGKASAN EKSEKUTIF ==='],
      ['Total Reservasi', stats.totalBookings],
      ['Tingkat Persetujuan', stats.totalBookings ? `${Math.round((stats.approvedBookings / stats.totalBookings) * 100)}%` : '0%'],
      ['Total Pengguna Aktif', enhancedAnalytics.userAnalytics.totalUsers],
      ['Rata-rata Durasi Booking', `${enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} jam`],
      ['Institusi Terdaftar', enhancedAnalytics.institutionAnalytics.length],
      [''],
      ['=== STATISTIK DETAIL ==='],
      ['Status', 'Jumlah', 'Persentase'],
      ['Disetujui', stats.approvedBookings, stats.totalBookings ? `${Math.round((stats.approvedBookings / stats.totalBookings) * 100)}%` : '0%'],
      ['Menunggu', stats.pendingBookings, stats.totalBookings ? `${Math.round((stats.pendingBookings / stats.totalBookings) * 100)}%` : '0%'],
      ['Ditolak', stats.rejectedBookings, stats.totalBookings ? `${Math.round((stats.rejectedBookings / stats.totalBookings) * 100)}%` : '0%'],
      ['Dibatalkan', stats.cancelledBookings, stats.totalBookings ? `${Math.round((stats.cancelledBookings / stats.totalBookings) * 100)}%` : '0%'],
      ['Selesai', stats.completedBookings, stats.totalBookings ? `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%` : '0%'],
      [''],
      ['=== STATISTIK NOTIFIKASI ==='],
      ['Total Notifikasi', notificationStats?.totalNotifications || 0],
      ['Terkirim', notificationStats?.sentNotifications || 0],
      ['Gagal', notificationStats?.failedNotifications || 0],
      ['Menunggu', notificationStats?.pendingNotifications || 0],
      ['Email', notificationStats?.emailNotifications || 0],
      ['WhatsApp', notificationStats?.whatsappNotifications || 0]
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

    // User Analytics Sheet
    const userData = [
      ['ANALISIS PENGGUNA'],
      [''],
      ['Statistik Pengguna'],
      ['Total Pengguna', enhancedAnalytics.userAnalytics.totalUsers],
      ['Pengguna Aktif', enhancedAnalytics.userAnalytics.activeUsers],
      [''],
      ['Top 10 Pengguna Teraktif'],
      ['No', 'Nama', 'Email', 'Institusi', 'Total Booking', 'Disetujui', 'Tingkat Sukses'],
      ...enhancedAnalytics.userAnalytics.topUsers.map((user, index) => [
        index + 1,
        user.name,
        user.email,
        user.institution || 'Unknown',
        user.bookingCount,
        user.approvedCount,
        user.bookingCount > 0 ? `${Math.round((user.approvedCount / user.bookingCount) * 100)}%` : '0%'
      ])
    ]

    const userSheet = XLSX.utils.aoa_to_sheet(userData)
    XLSX.utils.book_append_sheet(workbook, userSheet, 'Pengguna')

    // Institution Analytics Sheet
    const institutionData = [
      ['ANALISIS INSTITUSI'],
      [''],
      ['Institusi', 'Total Booking', 'Jumlah User', 'Rata-rata per User'],
      ...enhancedAnalytics.institutionAnalytics.map(inst => [
        inst.institution,
        inst.bookingCount,
        inst.userCount,
        inst.userCount > 0 ? (inst.bookingCount / inst.userCount).toFixed(1) : '0'
      ])
    ]

    const institutionSheet = XLSX.utils.aoa_to_sheet(institutionData)
    XLSX.utils.book_append_sheet(workbook, institutionSheet, 'Institusi')

    // Facilities Analytics Sheet
    const facilitiesData = [
      ['ANALISIS FASILITAS'],
      [''],
      ['Fasilitas', 'Jumlah Penggunaan', 'Ranking'],
      ...enhancedAnalytics.facilitiesAnalytics.map((fac, index) => [
        fac.facility,
        fac.usageCount,
        `${index + 1}`
      ])
    ]

    const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData)
    XLSX.utils.book_append_sheet(workbook, facilitiesSheet, 'Fasilitas')

    // Time Analytics Sheet
    const timeData = [
      ['ANALISIS WAKTU'],
      [''],
      ['Statistik Waktu'],
      ['Rata-rata Durasi (jam)', enhancedAnalytics.timeAnalytics.averageDuration.toFixed(2)],
      [''],
      ['Jam Sibuk (Top 5)'],
      ['Jam', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakHours.map(h => [`${h.hour}:00`, h.count]),
      [''],
      ['Hari Sibuk'],
      ['Hari', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakDays.map(d => [d.day, d.count])
    ]

    const timeSheet = XLSX.utils.aoa_to_sheet(timeData)
    XLSX.utils.book_append_sheet(workbook, timeSheet, 'Waktu')

    // Room Utilization Sheet
    const roomData = [
      ['ANALISIS PENGGUNAAN RUANGAN'],
      [''],
      ['Room Name', 'Total Bookings', 'Kapasitas', 'Tingkat Utilisasi (%)', 'Rata-rata Durasi (jam)', 'Efisiensi'],
      ...enhancedAnalytics.roomUtilization.map(room => [
        room.roomName,
        room.totalBookings,
        room.totalCapacity,
        `${room.utilizationRate.toFixed(1)}%`,
        room.averageDuration.toFixed(1),
        room.totalCapacity > 0 ? `${((room.totalBookings / room.totalCapacity) * 100).toFixed(1)}%` : '0%'
      ])
    ]

    const roomSheet = XLSX.utils.aoa_to_sheet(roomData)
    XLSX.utils.book_append_sheet(workbook, roomSheet, 'Ruangan')

    // Monthly Trends Sheet
    const monthlyData = [
      ['TREND BULANAN'],
      [''],
      ['Bulan', 'Jumlah Booking'],
      ...stats.monthlyStats.map(month => [month.month, month.count])
    ]

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Trend Bulanan')

    // Detailed Bookings Sheet
    const bookingData = [
      ['DATA BOOKING DETAIL'],
      [''],
      ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
      ...enhancedAnalytics.filteredBookings.map(booking => [
        booking.id,
        booking.profiles?.full_name || 'Unknown',
        booking.profiles?.email || 'Unknown',
        booking.profiles?.institution || 'Unknown',
        booking.rooms?.name || 'Unknown',
        format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
        format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
        booking.status,
        booking.event_description || '',
        booking.notes || ''
      ])
    ]

    const bookingSheet = XLSX.utils.aoa_to_sheet(bookingData)
    XLSX.utils.book_append_sheet(workbook, bookingSheet, 'Data Booking')

    XLSX.writeFile(workbook, `laporan-analytics-lengkap-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  if (isLoading) {
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
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
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
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                        <Skeleton className="w-4 h-4 rounded-full mr-3" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-8" />
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
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
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
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">{isLoading ? 'Memuat data...' : 'Tidak ada data untuk ditampilkan'}</p>
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
      {/* Export Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex justify-end gap-2 mb-4"
      >
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <FileImage className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button onClick={exportToExcel} variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: id })
                        )
                      ) : (
                        <span>Pilih rentang tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Room Selector */}
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <Select
                  value={selectedRooms.length > 0 ? selectedRooms[0] : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedRooms([])
                    } else {
                      setSelectedRooms([value])
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Ruangan</SelectItem>
                    {rooms?.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
                {selectedRooms.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRooms([])}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2 ml-auto">
                {dateRange && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tanggal: {format(dateRange.from!, "dd/MM/yyyy", { locale: id })}
                    {dateRange.to && ` - ${format(dateRange.to, "dd/MM/yyyy", { locale: id })}`}
                  </Badge>
                )}
                {selectedRooms.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Ruangan: {rooms?.find((r: Room) => r.id === selectedRooms[0])?.name || 'Dipilih'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Reservasi', value: stats.totalBookings, icon: FileText, color: 'from-blue-500 to-cyan-400' },
          { label: 'Disetujui', value: stats.approvedBookings, icon: Users, color: 'from-green-500 to-emerald-400' },
          { label: 'Menunggu', value: stats.pendingBookings, icon: TrendingUp, color: 'from-yellow-500 to-orange-400' },
          { label: 'Ditolak', value: stats.rejectedBookings, icon: BarChart3, color: 'from-red-500 to-pink-400' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Monthly Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MonthlyTrendsChart data={stats.monthlyStats.map(item => ({ month: item.month.split(' ')[0], count: item.count }))} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatusDistributionChart
            data={[
              { name: 'Disetujui', value: stats.approvedBookings, color: '#10B981' },
              { name: 'Menunggu', value: stats.pendingBookings, color: '#F59E0B' },
              { name: 'Ditolak', value: stats.rejectedBookings, color: '#EF4444' },
              { name: 'Dibatalkan', value: stats.cancelledBookings, color: '#6B7280' },
              { name: 'Selesai', value: stats.completedBookings, color: '#3B82F6' }
            ]}
          />
        </motion.div>

        {/* Room Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RoomUsageChart data={stats.roomStats.map(item => ({
            room: item.room_name,
            bookings: item.booking_count,
            capacity: item.capacity
          }))} />
        </motion.div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        {userActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <UserActivityChart data={userActivity} />
          </motion.div>
        )}

        {/* Peak Hours Heatmap */}
        {peakHours && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <PeakHoursHeatmap data={peakHours} />
          </motion.div>
        )}

        {/* Cancellation Trends Chart */}
        {cancellationTrends && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <CancellationTrendsChart data={cancellationTrends} />
          </motion.div>
        )}

        {/* Room Utilization Gauges */}
        {roomUtilization && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <RoomUtilizationGauge data={roomUtilization} />
          </motion.div>
        )}
      </div>

      {/* Time Analytics */}
      {enhancedAnalytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Time Analytics</CardTitle>
              <CardDescription>Analisis waktu penggunaan ruangan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <div>
                  <h4 className="font-semibold mb-3">Jam Sibuk</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={enhancedAnalytics.timeAnalytics.peakHours.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="hour" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        name="Jumlah Booking"
                        animationBegin={0}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Peak Days */}
                <div>
                  <h4 className="font-semibold mb-3">Hari Sibuk</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={enhancedAnalytics.timeAnalytics.peakDays}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#10b981"
                        name="Jumlah Booking"
                        animationBegin={0}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Duration */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rata-rata Durasi Booking</p>
                    <p className="text-2xl font-bold text-blue-600">{enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} jam</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}