'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBookingStats, useBookings } from '@/lib/api'
import { Download, FileText, BarChart3, Users, Clock, TrendingUp, FileImage } from 'lucide-react'
import { format, subMonths, isWithinInterval } from 'date-fns'
import jsPDF from 'jspdf'

// Types for enhanced analytics
interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  topUsers: Array<{
    name: string
    email: string
    bookingCount: number
    approvedCount: number
  }>
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
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subMonths(new Date(), 3),
    to: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('3months')

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
    const userStats = new Map<string, { name: string; email: string; bookings: typeof bookings }>()
    filteredBookings.forEach(booking => {
      const userId = booking.user_id
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          name: booking.profiles?.full_name || 'Unknown',
          email: booking.profiles?.email || 'Unknown',
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
          bookingCount: user.bookings.length,
          approvedCount: user.bookings.filter(b => b.status === 'approved').length
        }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 10)
    }

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
        totalCapacity: 0, // Would need to fetch from rooms table
        totalBookings: roomStat.booking_count,
        utilizationRate: roomStat.booking_count > 0 ? (totalDuration / (24 * 30)) * 100 : 0, // Monthly utilization rate
        averageDuration: roomBookings.length > 0 ? totalDuration / roomBookings.length : 0
      }
    })

    return {
      userAnalytics,
      timeAnalytics,
      roomUtilization,
      filteredBookings
    }
  }, [bookings, stats, dateRange])

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
      [''],
      ['=== USER ANALYTICS ==='],
      ['Total Users', enhancedAnalytics.userAnalytics.totalUsers],
      ['Active Users', enhancedAnalytics.userAnalytics.activeUsers],
      [''],
      ['Top Users:'],
      ['Nama', 'Email', 'Total Booking', 'Disetujui'],
      ...enhancedAnalytics.userAnalytics.topUsers.map(user => [
        user.name,
        user.email,
        user.bookingCount,
        user.approvedCount
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
      ['Room Name', 'Total Bookings', 'Utilization Rate (%)', 'Average Duration (hours)'],
      ...enhancedAnalytics.roomUtilization.map(room => [
        room.roomName,
        room.totalBookings,
        room.utilizationRate.toFixed(2),
        room.averageDuration.toFixed(2)
      ])
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

  const exportToPDF = () => {
    if (!enhancedAnalytics) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    let yPosition = 20

    // Helper function to add text with line breaks
    const addText = (text: string, x: number, y: number, options?: { align?: string }) => {
      const splitText = pdf.splitTextToSize(text, pageWidth - 40)
      pdf.text(splitText, x, y, options)
      return y + (splitText.length * 6)
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 20) {
        pdf.addPage()
        yPosition = 20
      }
    }

    // Title
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('LAPORAN ANALYTICS PERPUSTAKAAN ACEH', 20, yPosition, { align: 'center' })
    yPosition += 10

    // Period
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const periodText = `Periode: ${format(dateRange.from || new Date(), 'dd/MM/yyyy')} - ${format(dateRange.to || new Date(), 'dd/MM/yyyy')}`
    yPosition = addText(periodText, 20, yPosition, { align: 'center' })
    yPosition += 10

    // Generated date
    const generatedText = `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
    yPosition = addText(generatedText, 20, yPosition, { align: 'center' })
    yPosition += 20

    // General Statistics
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('STATISTIK UMUM', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Reservasi: ${stats?.totalBookings || 0}`, 30, yPosition)
    yPosition = addText(`Disetujui: ${stats?.approvedBookings || 0}`, 30, yPosition)
    yPosition = addText(`Menunggu: ${stats?.pendingBookings || 0}`, 30, yPosition)
    yPosition = addText(`Ditolak: ${stats?.rejectedBookings || 0}`, 30, yPosition)
    yPosition = addText(`Tingkat Persetujuan: ${stats?.totalBookings ? Math.round((stats.approvedBookings / stats.totalBookings) * 100) : 0}%`, 30, yPosition)
    yPosition += 10

    // User Analytics
    checkNewPage(50)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('USER ANALYTICS', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    yPosition = addText(`Total Users: ${enhancedAnalytics.userAnalytics.totalUsers}`, 30, yPosition)
    yPosition = addText(`Active Users: ${enhancedAnalytics.userAnalytics.activeUsers}`, 30, yPosition)
    yPosition += 10

    // Top Users
    yPosition = addText('Top 5 Pengguna Teraktif:', 30, yPosition)
    enhancedAnalytics.userAnalytics.topUsers.slice(0, 5).forEach((user, index) => {
      const userText = `${index + 1}. ${user.name} (${user.email}) - ${user.bookingCount} booking, ${user.approvedCount} disetujui`
      yPosition = addText(userText, 40, yPosition)
    })
    yPosition += 10

    // Time Analytics
    checkNewPage(50)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('TIME ANALYTICS', 20, yPosition)
    yPosition += 10

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
    checkNewPage(50)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    yPosition = addText('ROOM UTILIZATION', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    enhancedAnalytics.roomUtilization.forEach((room) => {
      const roomText = `${room.roomName}: ${room.totalBookings} bookings, ${room.utilizationRate.toFixed(1)}% utilization, ${room.averageDuration.toFixed(1)}h avg duration`
      yPosition = addText(roomText, 30, yPosition)
    })

    // Save the PDF
    pdf.save(`laporan-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  if (statsLoading || bookingsLoading) {
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reservasi</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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

        <Card>
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

      {/* User Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>User Analytics</CardTitle>
          <CardDescription>Statistik pengguna dan aktivitas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Top 5 Pengguna Teraktif</h4>
              <div className="space-y-2">
                {enhancedAnalytics.userAnalytics.topUsers.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{user.bookingCount} booking</p>
                      <p className="text-sm text-green-600">{user.approvedCount} disetujui</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Time Analytics</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Jam Sibuk</p>
                  {enhancedAnalytics.timeAnalytics.peakHours.map((hour, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>Jam {hour.hour}:00</span>
                      <span>{hour.count} booking</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Hari Sibuk</p>
                  {enhancedAnalytics.timeAnalytics.peakDays.map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{day.day}</span>
                      <span>{day.count} booking</span>
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="space-y-4">
            {enhancedAnalytics.roomUtilization.map((room, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{room.roomName}</h4>
                  <span className="text-sm text-gray-600">
                    {room.totalBookings} booking
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(room.utilizationRate, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Utilization: {room.utilizationRate.toFixed(1)}%</span>
                  <span>Avg Duration: {room.averageDuration.toFixed(1)}h</span>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.monthlyStats.slice(0, 6).map((month, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <p className="font-semibold">{month.month}</p>
                <p className="text-2xl font-bold text-blue-600">{month.count}</p>
                <p className="text-sm text-gray-600">reservasi</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
