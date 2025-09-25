'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBookingStats, useBookings, useNotificationStats } from '@/lib/api'
import { Download, FileText, BarChart3, Users, Clock, TrendingUp, FileImage, FileSpreadsheet } from 'lucide-react'
import { format, subMonths, isWithinInterval } from 'date-fns'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

// Types for enhanced analytics
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

interface FacilitiesAnalytics {
  facility: string
  usageCount: number
  roomCount: number
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

interface RoomUtilization {
  roomId: string
  roomName: string
  totalCapacity: number
  totalBookings: number
  utilizationRate: number
  averageDuration: number
}

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useBookingStats()
  const { data: bookings, isLoading: bookingsLoading } = useBookings()
  const { data: notificationStats, isLoading: notificationLoading } = useNotificationStats()
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subMonths(new Date(), 3),
    to: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('3months')
  const [selectedChartView, setSelectedChartView] = useState('overview')
  const [hoveredData, setHoveredData] = useState<unknown>(null)

  // Calculate enhanced analytics
  const enhancedAnalytics = useMemo(() => {
    if (!bookings || !stats) return null

    // Filter bookings by date range
    const filteredBookings = bookings.filter(booking => {
      if (!dateRange.from || !dateRange.to) return true
      return isWithinInterval(new Date(booking.created_at), {
        start: dateRange.from,
        end: dateRange.to
      })
    })

    // User Analytics
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
        .map(user => ({
          name: user.name,
          email: user.email,
          institution: user.institution,
          bookingCount: user.bookings.length,
          approvedCount: user.bookings.filter(b => b.status === 'approved').length
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 10)
    }

    // Institution Analytics
    const institutionStats = new Map<string, { institution: string; bookingCount: number; userCount: number }>()
    Array.from(userStats.values()).forEach(user => {
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
    const institutionAnalytics = Array.from(institutionStats.values())
      .sort((a, b) => b.bookingCount - a.bookingCount)

    // Time Analytics
    const hourStats = new Map<number, number>()
    const dayStats = new Map<string, number>()
    let totalDuration = 0

    filteredBookings.forEach(booking => {
      const startTime = new Date(booking.start_time)
      const endTime = new Date(booking.end_time)

      // Hour statistics
      const hour = startTime.getHours()
      hourStats.set(hour, (hourStats.get(hour) || 0) + 1)

      // Day statistics
      const day = startTime.toLocaleDateString('id-ID', { weekday: 'long' })
      dayStats.set(day, (dayStats.get(day) || 0) + 1)

      // Duration calculation
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // hours
      totalDuration += duration
    })

    const timeAnalytics: TimeAnalytics = {
      peakHours: Array.from(hourStats.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      peakDays: Array.from(dayStats.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count),
      averageDuration: filteredBookings.length > 0 ? totalDuration / filteredBookings.length : 0
    }

    // Facilities Analytics
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

    // Room Utilization
    const roomUtilization: RoomUtilization[] = stats.roomStats.map(roomStat => {
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
        utilizationRate: roomStat.booking_count > 0 ? (totalDuration / (24 * 30)) * 100 : 0, // Monthly utilization rate
        averageDuration: roomBookings.length > 0 ? totalDuration / roomBookings.length : 0
      }
    })

    return {
      userAnalytics,
      timeAnalytics,
      roomUtilization,
      institutionAnalytics,
      facilitiesAnalytics,
      filteredBookings
    }
  }, [bookings, stats, dateRange, notificationStats])

  // Prepare chart data
  const basicStatsChartData = useMemo(() => {
    if (!stats || !enhancedAnalytics) return []
    return [
      {
        name: 'Reservasi',
        total: stats.totalBookings,
        approved: stats.approvedBookings,
        pending: stats.pendingBookings,
        rejected: stats.rejectedBookings
      }
    ]
  }, [stats, enhancedAnalytics])

  const userAnalyticsChartData = useMemo(() => {
    if (!enhancedAnalytics) return []
    return enhancedAnalytics.userAnalytics.topUsers.slice(0, 8).map(user => ({
      name: user.name.split(' ')[0], // First name only for chart
      bookings: user.bookingCount,
      approved: user.approvedCount
    }))
  }, [enhancedAnalytics])

  const timeAnalyticsChartData = useMemo(() => {
    if (!enhancedAnalytics) return { peakHours: [], peakDays: [] }
    return {
      peakHours: enhancedAnalytics.timeAnalytics.peakHours.map(h => ({
        hour: `${h.hour}:00`,
        bookings: h.count
      })),
      peakDays: enhancedAnalytics.timeAnalytics.peakDays.map(d => ({
        day: d.day,
        bookings: d.count
      }))
    }
  }, [enhancedAnalytics])

  const roomUtilizationChartData = useMemo(() => {
    if (!enhancedAnalytics) return []
    return enhancedAnalytics.roomUtilization.map(room => ({
      name: room.roomName,
      utilization: Math.min(room.utilizationRate, 100),
      bookings: room.totalBookings,
      avgDuration: room.averageDuration
    }))
  }, [enhancedAnalytics])

  const monthlyTrendsChartData = useMemo(() => {
    if (!stats) return []
    return stats.monthlyStats.map(month => ({
      month: month.month,
      bookings: month.count
    }))
  }, [stats])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const now = new Date()
    switch (period) {
      case '1month':
        setDateRange({ from: subMonths(now, 1), to: now })
        break
      case '3months':
        setDateRange({ from: subMonths(now, 3), to: now })
        break
      case '6months':
        setDateRange({ from: subMonths(now, 6), to: now })
        break
      case '1year':
        setDateRange({ from: subMonths(now, 12), to: now })
        break
    }
  }

  const exportToCSV = () => {
    if (!enhancedAnalytics) return

    const csvData = [
      ['Laporan Analytics Perpustakaan Aceh'],
      ['Periode:', format(dateRange.from || new Date(), 'dd/MM/yyyy'), 'sampai', format(dateRange.to || new Date(), 'dd/MM/yyyy')],
      [''],
      ['=== STATISTIK UMUM ==='],
      ['Total Reservasi', stats?.totalBookings || 0],
      ['Disetujui', stats?.approvedBookings || 0],
      ['Menunggu', stats?.pendingBookings || 0],
      ['Ditolak', stats?.rejectedBookings || 0],
      ['Dibatalkan', stats?.cancelledBookings || 0],
      ['Selesai', stats?.completedBookings || 0],
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
    if (!enhancedAnalytics) return

    // Helper function to capture chart as image
    const captureChart = async (chartId: string): Promise<string | null> => {
      try {
        const element = document.getElementById(chartId)
        if (!element) return null

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        return canvas.toDataURL('image/png')
      } catch (error) {
        console.error(`Failed to capture chart ${chartId}:`, error)
        return null
      }
    }

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    let yPosition = 20

    // Helper function to add text with line breaks
    const addText = (text: string, x: number, y: number, options?: { align?: string; maxWidth?: number }) => {
      const maxWidth = options?.maxWidth || pageWidth - 40
      const splitText = pdf.splitTextToSize(text, maxWidth)
      pdf.text(splitText, x, y, options)
      return y + (splitText.length * 7)
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 30) {
        pdf.addPage()
        // Add header to new page
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'italic')
        pdf.text(`Laporan Analytics Perpustakaan Aceh - ${format(new Date(), 'dd/MM/yyyy')}`, 20, 15)
        pdf.setFont('helvetica', 'normal')
        yPosition = 25
      }
    }

    // Helper function to add a section header with background
    const addSectionHeader = (title: string, sectionNumber?: string) => {
      checkNewPage(25)
      pdf.setFillColor(240, 240, 240)
      pdf.rect(15, yPosition - 5, pageWidth - 30, 15, 'F')
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      const headerText = sectionNumber ? `${sectionNumber}. ${title}` : title
      pdf.text(headerText, 20, yPosition + 5)
      yPosition += 20
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
    }

    // Title with background
    pdf.setFillColor(0, 102, 204)
    pdf.rect(0, 0, pageWidth, 40, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(22)
    pdf.setFont('helvetica', 'bold')
    pdf.text('LAPORAN ANALYTICS PERPUSTAKAAN ACEH', pageWidth/2, 20, { align: 'center' })
    pdf.setTextColor(0, 0, 0)
    yPosition = 50

    // Period and generated info
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    const periodText = `${format(dateRange.from || new Date(), 'dd/MM/yyyy')} - ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`
    yPosition = addText(`Periode: ${periodText}`, 20, yPosition)
    const generatedText = `Dibuat: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
    yPosition = addText(generatedText, pageWidth - 20, yPosition, { align: 'right' })
    yPosition += 15

    // Table of Contents
    addSectionHeader('DAFTAR ISI')
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText('1. Statistik Umum', 30, yPosition)
    yPosition = addText('2. User Analytics', 30, yPosition)
    yPosition = addText('3. Institution Analytics', 30, yPosition)
    yPosition = addText('4. Facilities Analytics', 30, yPosition)
    yPosition = addText('5. Time Analytics', 30, yPosition)
    yPosition = addText('6. Room Utilization', 30, yPosition)
    yPosition = addText('7. Monthly Trends', 30, yPosition)
    yPosition = addText('8. User Activity Chart', 30, yPosition)
    yPosition = addText('9. Peak Hours Heatmap', 30, yPosition)
    yPosition = addText('10. Booking Status Chart', 30, yPosition)
    yPosition = addText('11. Notification Statistics', 30, yPosition)
    yPosition += 15

    // Executive Summary
    addSectionHeader('RINGKASAN EKSEKUTIF')
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Reservasi: ${stats?.totalBookings || 0}`, 30, yPosition)
    yPosition = addText(`Tingkat Persetujuan: ${stats?.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%`, 30, yPosition)
    yPosition = addText(`Total Pengguna Aktif: ${enhancedAnalytics.userAnalytics.totalUsers}`, 30, yPosition)
    yPosition = addText(`Rata-rata Durasi Booking: ${enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} jam`, 30, yPosition)
    yPosition = addText(`Institusi Terdaftar: ${enhancedAnalytics.institutionAnalytics.length}`, 30, yPosition)
    yPosition += 10

    // General Statistics
    addSectionHeader('STATISTIK UMUM', '1')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Reservasi: ${stats?.totalBookings || 0}`, 30, yPosition)
    yPosition = addText(`Disetujui: ${stats?.approvedBookings || 0}`, 30, yPosition)
    yPosition = addText(`Menunggu: ${stats?.pendingBookings || 0}`, 30, yPosition)
    yPosition = addText(`Ditolak: ${stats?.rejectedBookings || 0}`, 30, yPosition)
    yPosition = addText(`Dibatalkan: ${stats?.cancelledBookings || 0}`, 30, yPosition)
    yPosition = addText(`Selesai: ${stats?.completedBookings || 0}`, 30, yPosition)
    yPosition = addText(`Tingkat Persetujuan: ${stats?.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%`, 30, yPosition)
    yPosition += 15

    // Simple status distribution chart
    checkNewPage(80)
    yPosition = addText('Distribusi Status Reservasi:', 30, yPosition)
    yPosition += 5

    const chartWidth = 120
    const chartHeight = 40
    const maxValue = Math.max(stats?.approvedBookings || 0, stats?.pendingBookings || 0, stats?.rejectedBookings || 0, stats?.cancelledBookings || 0, stats?.completedBookings || 0)

    // Draw chart background
    pdf.setFillColor(245, 245, 245)
    pdf.rect(30, yPosition, chartWidth, chartHeight, 'F')

    // Draw bars
    const barWidth = chartWidth / 5
    const statuses = [
      { label: 'Approved', value: stats?.approvedBookings || 0, color: [16, 185, 129] },
      { label: 'Pending', value: stats?.pendingBookings || 0, color: [245, 158, 11] },
      { label: 'Rejected', value: stats?.rejectedBookings || 0, color: [239, 68, 68] },
      { label: 'Cancelled', value: stats?.cancelledBookings || 0, color: [107, 114, 128] },
      { label: 'Completed', value: stats?.completedBookings || 0, color: [59, 130, 246] }
    ]

    statuses.forEach((status, index) => {
      const barHeight = maxValue > 0 ? (status.value / maxValue) * (chartHeight - 10) : 0
      const x = 30 + (index * barWidth) + 2
      const y = yPosition + chartHeight - barHeight - 5

      pdf.setFillColor(status.color[0], status.color[1], status.color[2])
      pdf.rect(x, y, barWidth - 4, barHeight, 'F')

      // Label
      pdf.setFontSize(8)
      pdf.setTextColor(0, 0, 0)
      pdf.text(status.label, x + (barWidth - 4) / 2, yPosition + chartHeight + 8, { align: 'center' })
      pdf.text(status.value.toString(), x + (barWidth - 4) / 2, y - 2, { align: 'center' })
    })

    yPosition += chartHeight + 20

    // User Analytics
    addSectionHeader('USER ANALYTICS', '2')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Users: ${enhancedAnalytics.userAnalytics.totalUsers}`, 30, yPosition)
    yPosition = addText(`Active Users: ${enhancedAnalytics.userAnalytics.activeUsers}`, 30, yPosition)
    yPosition += 10

    // Top Users
    yPosition = addText('Top 5 Pengguna Teraktif:', 30, yPosition)
    enhancedAnalytics.userAnalytics.topUsers.slice(0, 5).forEach((user, index) => {
      const userText = `${index + 1}. ${user.name} (${user.email}, ${user.institution || 'Unknown'}) - ${user.bookingCount} booking, ${user.approvedCount} disetujui`
      yPosition = addText(userText, 40, yPosition)
    })
    yPosition += 10

    // Institution Analytics
    addSectionHeader('INSTITUTION ANALYTICS', '3')
    enhancedAnalytics.institutionAnalytics.slice(0, 5).forEach((inst) => {
      const instText = `${inst.institution}: ${inst.bookingCount} bookings, ${inst.userCount} users`
      yPosition = addText(instText, 30, yPosition)
    })
    yPosition += 15

    // Simple institution chart
    if (enhancedAnalytics.institutionAnalytics.length > 0) {
      checkNewPage(60)
      yPosition = addText('Top 5 Institusi:', 30, yPosition)
      yPosition += 5

      const chartWidth = 120
      const chartHeight = 30
      const maxValue = Math.max(...enhancedAnalytics.institutionAnalytics.slice(0, 5).map(inst => inst.bookingCount))

      // Draw chart background
      pdf.setFillColor(245, 245, 245)
      pdf.rect(30, yPosition, chartWidth, chartHeight, 'F')

      enhancedAnalytics.institutionAnalytics.slice(0, 5).forEach((inst, index) => {
        const barHeight = maxValue > 0 ? (inst.bookingCount / maxValue) * (chartHeight - 10) : 0
        const x = 30 + (index * 24) + 1
        const y = yPosition + chartHeight - barHeight - 5

        pdf.setFillColor(59, 130, 246)
        pdf.rect(x, y, 22, barHeight, 'F')

        // Label
        pdf.setFontSize(7)
        pdf.setTextColor(0, 0, 0)
        pdf.text(inst.institution.substring(0, 8), x + 11, yPosition + chartHeight + 6, { align: 'center' })
        pdf.text(inst.bookingCount.toString(), x + 11, y - 2, { align: 'center' })
      })

      yPosition += chartHeight + 15
    }

    // Facilities Analytics
    addSectionHeader('FACILITIES ANALYTICS', '4')
    enhancedAnalytics.facilitiesAnalytics.slice(0, 8).forEach((fac) => {
      const facText = `${fac.facility}: ${fac.usageCount} usages`
      yPosition = addText(facText, 30, yPosition)
    })
    yPosition += 10

    // Time Analytics
    addSectionHeader('TIME ANALYTICS', '5')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Average Duration: ${enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)} hours`, 30, yPosition)
    yPosition += 5

    yPosition = addText('Peak Hours:', 30, yPosition)
    enhancedAnalytics.timeAnalytics.peakHours.forEach((hour) => {
      const hourText = `  Jam ${hour.hour}:00 - ${hour.count} booking`
      yPosition = addText(hourText, 40, yPosition)
    })
    yPosition += 5

    yPosition = addText('Peak Days:', 30, yPosition)
    enhancedAnalytics.timeAnalytics.peakDays.forEach((day) => {
      const dayText = `  ${day.day} - ${day.count} booking`
      yPosition = addText(dayText, 40, yPosition)
    })
    yPosition += 10

    // Room Utilization
    addSectionHeader('ROOM UTILIZATION', '6')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    enhancedAnalytics.roomUtilization.forEach((room) => {
      const roomText = `${room.roomName}: ${room.totalBookings} bookings, capacity ${room.totalCapacity}, ${room.utilizationRate.toFixed(1)}% utilization, ${room.averageDuration.toFixed(1)}h avg duration`
      yPosition = addText(roomText, 30, yPosition)
    })
    yPosition += 10

    // Add Room Utilization Chart
    checkNewPage(120)
    yPosition = addText('Room Utilization Chart:', 30, yPosition)
    yPosition += 5
    const roomChartImage = await captureChart('room-utilization-chart')
    if (roomChartImage) {
      pdf.addImage(roomChartImage, 'PNG', 20, yPosition, 170, 80)
      yPosition += 90
    }

    // Monthly Trends
    addSectionHeader('MONTHLY TRENDS', '7')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText('Monthly booking trends over the selected period:', 30, yPosition)
    yPosition += 10

    // Add Monthly Trends Chart
    checkNewPage(120)
    const monthlyChartImage = await captureChart('monthly-trends-chart')
    if (monthlyChartImage) {
      pdf.addImage(monthlyChartImage, 'PNG', 20, yPosition, 170, 80)
      yPosition += 90
    }

    // User Activity Chart
    addSectionHeader('USER ACTIVITY CHART', '8')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText('Top users activity visualization:', 30, yPosition)
    yPosition += 10

    // Add User Activity Chart
    checkNewPage(120)
    const userChartImage = await captureChart('top-users-chart')
    if (userChartImage) {
      pdf.addImage(userChartImage, 'PNG', 20, yPosition, 170, 100)
      yPosition += 110
    }

    // Peak Hours Heatmap
    addSectionHeader('PEAK HOURS HEATMAP', '9')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText('Peak hours visualization (heatmap style):', 30, yPosition)
    yPosition += 10

    // Create a simple heatmap representation
    checkNewPage(100)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const maxBookings = Math.max(...enhancedAnalytics.timeAnalytics.peakHours.map(h => h.count))

    hours.forEach((hour, index) => {
      const hourData = enhancedAnalytics.timeAnalytics.peakHours.find(h => h.hour === hour)
      const count = hourData ? hourData.count : 0
      const intensity = maxBookings > 0 ? (count / maxBookings) * 255 : 0

      // Draw heatmap cell
      const cellWidth = 7
      const cellHeight = 8
      const x = 30 + (index % 12) * cellWidth
      const y = yPosition + Math.floor(index / 12) * cellHeight

      // Color based on intensity (red to green)
      const red = Math.round(intensity)
      const green = Math.round(255 - intensity)
      const blue = 100

      pdf.setFillColor(red, green, blue)
      pdf.rect(x, y, cellWidth - 1, cellHeight - 1, 'F')

      // Label
      if (index < 12) {
        pdf.setFontSize(6)
        pdf.setTextColor(0, 0, 0)
        pdf.text(hour.toString(), x + cellWidth / 2, y + cellHeight + 3, { align: 'center' })
      }
    })

    yPosition += 60

    // Booking Status Chart
    addSectionHeader('BOOKING STATUS CHART', '10')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText('Booking status distribution visualization:', 30, yPosition)
    yPosition += 10

    // Add Booking Status Chart
    checkNewPage(120)
    const statusChartImage = await captureChart('booking-status-chart')
    if (statusChartImage) {
      pdf.addImage(statusChartImage, 'PNG', 20, yPosition, 170, 80)
      yPosition += 90
    }

    // Notification Statistics
    addSectionHeader('NOTIFICATION STATISTICS', '11')

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Notifications: ${notificationStats?.totalNotifications || 0}`, 30, yPosition)
    yPosition = addText(`Sent: ${notificationStats?.sentNotifications || 0}`, 30, yPosition)
    yPosition = addText(`Failed: ${notificationStats?.failedNotifications || 0}`, 30, yPosition)
    yPosition = addText(`Pending: ${notificationStats?.pendingNotifications || 0}`, 30, yPosition)
    yPosition = addText(`Email: ${notificationStats?.emailNotifications || 0}`, 30, yPosition)
    yPosition = addText(`WhatsApp: ${notificationStats?.whatsappNotifications || 0}`, 30, yPosition)


    // Add footer to the last page
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Laporan Analytics Perpustakaan Aceh', 20, pageHeight - 10)
    pdf.text(`Dibuat: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 30, pageHeight - 10, { align: 'right' })

    // Save the PDF
    pdf.save(`laporan-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const exportToExcel = () => {
    if (!stats || !enhancedAnalytics) return

    const workbook = XLSX.utils.book_new()

    // Summary Statistics Sheet
    const summaryData = [
      ['Laporan Analytics Perpustakaan Aceh'],
      ['Periode:', format(dateRange.from || new Date(), 'dd/MM/yyyy'), 'sampai', format(dateRange.to || new Date(), 'dd/MM/yyyy')],
      [''],
      ['=== STATISTIK UMUM ==='],
      ['Total Reservasi', stats?.totalBookings || 0],
      ['Disetujui', stats?.approvedBookings || 0],
      ['Menunggu', stats?.pendingBookings || 0],
      ['Ditolak', stats?.rejectedBookings || 0],
      ['Dibatalkan', stats?.cancelledBookings || 0],
      ['Selesai', stats?.completedBookings || 0],
      ['Tingkat Persetujuan (%)', stats?.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0],
      [''],
      ['=== USER ANALYTICS ==='],
      ['Total Users', enhancedAnalytics.userAnalytics.totalUsers],
      ['Active Users', enhancedAnalytics.userAnalytics.activeUsers],
      [''],
      ['=== TIME ANALYTICS ==='],
      ['Average Duration (hours)', enhancedAnalytics.timeAnalytics.averageDuration.toFixed(2)],
      [''],
      ['=== NOTIFICATION STATISTICS ==='],
      ['Total Notifications', notificationStats?.totalNotifications || 0],
      ['Sent', notificationStats?.sentNotifications || 0],
      ['Failed', notificationStats?.failedNotifications || 0],
      ['Pending', notificationStats?.pendingNotifications || 0],
      ['Email Notifications', notificationStats?.emailNotifications || 0],
      ['WhatsApp Notifications', notificationStats?.whatsappNotifications || 0]
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // User Analytics Sheet
    const userData = [
      ['User Analytics'],
      [''],
      ['Top Users'],
      ['Nama', 'Email', 'Institusi', 'Total Booking', 'Disetujui'],
      ...enhancedAnalytics.userAnalytics.topUsers.map(user => [
        user.name,
        user.email,
        user.institution || 'Unknown',
        user.bookingCount,
        user.approvedCount
      ])
    ]

    const userSheet = XLSX.utils.aoa_to_sheet(userData)
    XLSX.utils.book_append_sheet(workbook, userSheet, 'User Analytics')

    // Institution Analytics Sheet
    const institutionData = [
      ['Institution Analytics'],
      [''],
      ['Institusi', 'Total Booking', 'Jumlah User'],
      ...enhancedAnalytics.institutionAnalytics.map(inst => [
        inst.institution,
        inst.bookingCount,
        inst.userCount
      ])
    ]

    const institutionSheet = XLSX.utils.aoa_to_sheet(institutionData)
    XLSX.utils.book_append_sheet(workbook, institutionSheet, 'Institution Analytics')

    // Facilities Analytics Sheet
    const facilitiesData = [
      ['Facilities Analytics'],
      [''],
      ['Fasilitas', 'Jumlah Penggunaan'],
      ...enhancedAnalytics.facilitiesAnalytics.map(fac => [
        fac.facility,
        fac.usageCount
      ])
    ]

    const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData)
    XLSX.utils.book_append_sheet(workbook, facilitiesSheet, 'Facilities Analytics')

    // Time Analytics Sheet
    const timeData = [
      ['Time Analytics'],
      [''],
      ['Peak Hours'],
      ['Jam', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakHours.map(h => [h.hour, h.count]),
      [''],
      ['Peak Days'],
      ['Hari', 'Jumlah Booking'],
      ...enhancedAnalytics.timeAnalytics.peakDays.map(d => [d.day, d.count])
    ]

    const timeSheet = XLSX.utils.aoa_to_sheet(timeData)
    XLSX.utils.book_append_sheet(workbook, timeSheet, 'Time Analytics')

    // Room Utilization Sheet
    const roomData = [
      ['Room Utilization'],
      [''],
      ['Room Name', 'Total Bookings', 'Capacity', 'Utilization Rate (%)', 'Average Duration (hours)'],
      ...enhancedAnalytics.roomUtilization.map(room => [
        room.roomName,
        room.totalBookings,
        room.totalCapacity,
        parseFloat(room.utilizationRate.toFixed(2)),
        parseFloat(room.averageDuration.toFixed(2))
      ])
    ]

    const roomSheet = XLSX.utils.aoa_to_sheet(roomData)
    XLSX.utils.book_append_sheet(workbook, roomSheet, 'Room Utilization')

    // Monthly Trends Sheet
    const monthlyData = [
      ['Monthly Trends'],
      [''],
      ['Month', 'Bookings'],
      ...stats.monthlyStats.map(month => [month.month, month.count])
    ]

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Trends')

    // Detailed Bookings Sheet
    const bookingData = [
      ['Detailed Booking List'],
      [''],
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
      ])
    ]

    const bookingSheet = XLSX.utils.aoa_to_sheet(bookingData)
    XLSX.utils.book_append_sheet(workbook, bookingSheet, 'Detailed Bookings')

    // Save the Excel file
    XLSX.writeFile(workbook, `laporan-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  if (statsLoading || bookingsLoading || notificationLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!stats || !enhancedAnalytics) {
    return <div className="flex items-center justify-center p-8">Error loading statistics</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Laporan & Analytics Lengkap
              </CardTitle>
              <CardDescription>Statistik komprehensif penggunaan ruangan dan reservasi</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Bulan</SelectItem>
                  <SelectItem value="3months">3 Bulan</SelectItem>
                  <SelectItem value="6months">6 Bulan</SelectItem>
                  <SelectItem value="1year">1 Tahun</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Statistics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reservasi</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Approved: {stats.approvedBookings} | Pending: {stats.pendingBookings}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tingkat Persetujuan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalBookings > 0 ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pengguna</p>
                  <p className="text-2xl font-bold">{enhancedAnalytics.userAnalytics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata Durasi</p>
                  <p className="text-2xl font-bold">{enhancedAnalytics.timeAnalytics.averageDuration.toFixed(1)}h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              </CardContent>
            </Card>
          </div>

        {/* Booking Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Reservasi</CardTitle>
            <CardDescription>Distribusi status booking dalam periode ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="booking-status-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={basicStatsChartData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Legend />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* User Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>User Analytics</CardTitle>
          <CardDescription>Statistik pengguna dan aktivitas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Users Bar Chart */}
            <div>
              <h4 className="font-semibold mb-3">Top Pengguna Teraktif</h4>
              <div id="top-users-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={userAnalyticsChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="name" type="category" width={80} stroke="#6b7280" />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                   />
                  <Bar
                    dataKey="bookings"
                    fill="#3b82f6"
                    name="Total Booking"
                    animationBegin={0}
                    animationDuration={1200}
                   />
                  <Bar
                    dataKey="approved"
                    fill="#10b981"
                    name="Disetujui"
                    animationBegin={300}
                    animationDuration={1200}
                   />
                  </BarChart>
              </ResponsiveContainer>
            </div>
            </div>

            {/* Time Analytics Charts */}
            <div>
              <h4 className="font-semibold mb-3">Time Analytics</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Jam Sibuk</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={timeAnalyticsChartData.peakHours}>
                    <XAxis dataKey="hour" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                     />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#f59e0b"
                      fill="#fef3c7"
                      name="Bookings"
                      animationBegin={0}
                      animationDuration={1500}
                     />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Hari Sibuk</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={timeAnalyticsChartData.peakDays}>
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                     />
                    <Bar
                      dataKey="bookings"
                      fill="#8b5cf6"
                      name="Bookings"
                      animationBegin={0}
                      animationDuration={1500}
                     />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institution Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Analytics</CardTitle>
          <CardDescription>Statistik penggunaan berdasarkan institusi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enhancedAnalytics!.institutionAnalytics.slice(0, 8).map((inst, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{inst.institution}</p>
                  <p className="text-sm text-gray-600">{inst.userCount} users</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{inst.bookingCount}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facilities Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Facilities Analytics</CardTitle>
          <CardDescription>Penggunaan fasilitas ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhancedAnalytics!.facilitiesAnalytics.slice(0, 9).map((fac, index) => (
              <div key={index} className="border rounded-lg p-3 text-center">
                <h5 className="font-medium text-sm">{fac.facility}</h5>
                <p className="text-lg font-bold text-green-600">{fac.usageCount}</p>
                <p className="text-xs text-gray-600">usages</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Statistics</CardTitle>
          <CardDescription>Statistik pengiriman notifikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{notificationStats?.totalNotifications || 0}</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{notificationStats?.sentNotifications || 0}</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{notificationStats?.failedNotifications || 0}</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-2xl font-bold text-purple-600">{notificationStats?.emailNotifications || 0}</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">WhatsApp</p>
              <p className="text-2xl font-bold text-orange-600">{notificationStats?.whatsappNotifications || 0}</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{notificationStats?.pendingNotifications || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Room Utilization</CardTitle>
          <CardDescription>Tingkat penggunaan ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="room-utilization-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomUtilizationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'utilization') return [`${value}%`, 'Utilization Rate']
                  if (name === 'bookings') return [value, 'Total Bookings']
                  if (name === 'avgDuration') return [`${value}h`, 'Avg Duration']
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar
                dataKey="utilization"
                fill="#3b82f6"
                name="Utilization %"
                animationBegin={0}
                animationDuration={1200}
              />
              <Bar
                dataKey="bookings"
                fill="#10b981"
                name="Total Bookings"
                animationBegin={300}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhancedAnalytics!.roomUtilization.map((room, index) => (
              <div key={index} className="border rounded-lg p-3 text-center">
                <h5 className="font-medium text-sm">{room.roomName}</h5>
                <p className="text-xs text-gray-600">{room.totalBookings} bookings</p>
                <p className="text-xs text-blue-600">{room.utilizationRate.toFixed(1)}% utilization</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Tren bulanan reservasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="monthly-trends-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Bookings"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                animationBegin={0}
                animationDuration={2000}
               />
            </LineChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {stats!.monthlyStats.slice(0, 6).map((month, index) => (
              <div key={index} className="text-center p-2 border rounded">
                <p className="text-xs font-medium">{month.month}</p>
                <p className="text-lg font-bold text-blue-600">{month.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Status Trends Over Time</CardTitle>
          <CardDescription>Tren status booking dalam 6 bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.statusTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#10b981"
                strokeWidth={2}
                name="Approved"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Pending"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="rejected"
                stroke="#ef4444"
                strokeWidth={2}
                name="Rejected"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#6b7280"
                strokeWidth={2}
                name="Cancelled"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
