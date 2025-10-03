'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DateRange } from 'react-day-picker'
import { format, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileImage,
  Filter,
  X,
  TrendingUp,
  Users,
  Building,
  MapPin,
  Clock,
  BarChart3
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GeneralOverviewCards } from '@/components/admin/analytics/GeneralOverviewCards'
import { MonthlyReservationsChart } from '@/components/admin/analytics/MonthlyReservationsChart'
import { DailyDistributionChart } from '@/components/admin/analytics/DailyDistributionChart'
import { PeakHoursChart } from '@/components/admin/analytics/PeakHoursChart'
import { ReservationHeatmap } from '@/components/admin/analytics/ReservationHeatmap'
import { RoomOverviewCards } from '@/components/admin/analytics/RoomOverviewCards'
import { RoomMonthlyChart } from '@/components/admin/analytics/RoomMonthlyChart'
import { GuestDistributionChart } from '@/components/admin/analytics/GuestDistributionChart'
import { RoomTimeHeatmap } from '@/components/admin/analytics/RoomTimeHeatmap'
import { AverageReservationTimeChart } from '@/components/admin/analytics/AverageReservationTimeChart'
import { AverageGuestsChart } from '@/components/admin/analytics/AverageGuestsChart'
import { TourOverviewCards } from '@/components/admin/analytics/TourOverviewCards'
import { TourMonthlyChart } from '@/components/admin/analytics/TourMonthlyChart'
import { TourGuestsCard } from '@/components/admin/analytics/TourGuestsCard'
import { TourTimeHeatmap } from '@/components/admin/analytics/TourTimeHeatmap'
import { TourAverageTimeChart } from '@/components/admin/analytics/TourAverageTimeChart'
import { TourAverageGuestsChart } from '@/components/admin/analytics/TourAverageGuestsChart'
import { UserOverviewCards } from '@/components/admin/analytics/UserOverviewCards'
import { UserRegistrationChart } from '@/components/admin/analytics/UserRegistrationChart'
import { TopInstitutionsChart } from '@/components/admin/analytics/TopInstitutionsChart'
import { TopUsersChart } from '@/components/admin/analytics/TopUsersChart'
import { InstitutionBookingsChart } from '@/components/admin/analytics/InstitutionBookingsChart'
import { UserBookingDistributionChart } from '@/components/admin/analytics/UserBookingDistributionChart'
import { ExportButton } from '@/components/admin/analytics/ExportButton'
import { exportToCSV, exportToPDF, exportToExcel, ExportData } from '@/lib/exportUtils'

interface AnalyticsDashboardProps {
  bookings: any[]
  rooms: any[]
  tours: any[]
  users: any[]
  isLoading?: boolean
}

interface DateFilter {
  range: DateRange | undefined
  quickSelect: string | null
}

export function AnalyticsDashboard({
  bookings,
  rooms,
  tours,
  users,
  isLoading = false
}: AnalyticsDashboardProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    range: undefined,
    quickSelect: null
  })
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('general')

  // Global date filter logic
  const filteredBookings = useMemo(() => {
    if (!dateFilter.range?.from || !dateFilter.range?.to) return bookings

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at)
      return isWithinInterval(bookingDate, {
        start: dateFilter.range!.from!,
        end: dateFilter.range!.to!
      })
    })
  }, [bookings, dateFilter.range])

  // Quick date filter handlers
  const handleQuickSelect = (period: string) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (period) {
      case 'this-week':
        from = new Date(now.setDate(now.getDate() - now.getDay()))
        to = new Date(from)
        to.setDate(from.getDate() + 6)
        break
      case 'this-month':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'this-year':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 11, 31)
        break
      default:
        return
    }

    setDateFilter({
      range: { from, to },
      quickSelect: period
    })
  }

  const clearDateFilter = () => {
    setDateFilter({
      range: undefined,
      quickSelect: null
    })
  }

  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!bookings.length) return

    // Prepare export data
    const exportData: ExportData = {
      bookings,
      rooms,
      tours,
      users,
      currentTab: activeTab as 'general' | 'room' | 'tour' | 'user',
      filters: {
        dateRange: dateFilter.range?.from && dateFilter.range?.to ? {
          from: dateFilter.range.from,
          to: dateFilter.range.to
        } : undefined,
        selectedRooms,
        quickSelect: dateFilter.quickSelect || undefined
      },
      metadata: {
        exportDate: new Date(),
        totalBookings: bookings.length,
        totalRooms: rooms.length,
        totalUsers: users.length
      }
    }

    try {
      switch (format) {
        case 'csv':
          await exportToCSV(exportData)
          break
        case 'pdf':
          await exportToPDF(exportData)
          break
        case 'excel':
          await exportToExcel(exportData)
          break
      }
    } catch (error) {
      console.error(`Export ${format} failed:`, error)
      throw error // Re-throw to let ExportButton handle the error state
    }
  }

  if (isLoading) {
    return <AnalyticsDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Global Filters and Export Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        {/* Global Date Filter */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Global:</span>
              </div>

              {/* Quick Date Filters */}
              <div className="flex gap-2">
                {[
                  { key: 'this-week', label: 'Minggu Ini' },
                  { key: 'this-month', label: 'Bulan Ini' },
                  { key: 'this-year', label: 'Tahun Ini' }
                ].map((period) => (
                  <Button
                    key={period.key}
                    variant={dateFilter.quickSelect === period.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect(period.key)}
                    className="text-xs"
                  >
                    {period.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="flex items-center gap-2">
                <DateRangePicker
                  date={dateFilter.range}
                  onDateChange={(range) => setDateFilter({ range, quickSelect: null })}
                  placeholder="Pilih rentang tanggal"
                  className="w-[240px]"
                />
                {dateFilter.range && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Room Filter */}
              <div className="flex items-center gap-2">
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
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Ruangan</SelectItem>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              <div className="flex flex-wrap gap-2">
                {dateFilter.range && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(dateFilter.range.from!, "dd/MM/yyyy", { locale: id })}
                    {dateFilter.range.to && ` - ${format(dateFilter.range.to, "dd/MM/yyyy", { locale: id })}`}
                  </Badge>
                )}
                {selectedRooms.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {rooms?.find((r) => r.id === selectedRooms[0])?.name || 'Ruangan Dipilih'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <ExportButton
          currentTab={activeTab as 'general' | 'room' | 'tour' | 'user'}
          filters={{
            dateRange: dateFilter.range?.from && dateFilter.range?.to ? {
              from: dateFilter.range.from,
              to: dateFilter.range.to
            } : undefined,
            selectedRooms,
            quickSelect: dateFilter.quickSelect || undefined
          }}
          onExport={handleExport}
          disabled={isLoading}
        />
      </motion.div>

      {/* Tabbed Analytics Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="room" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Room
            </TabsTrigger>
            <TabsTrigger value="tour" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Tour
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User
            </TabsTrigger>
          </TabsList>

          {/* General Analytics Tab */}
          <TabsContent value="general" className="space-y-6">
            <GeneralAnalyticsTab
              bookings={filteredBookings}
              rooms={rooms}
              tours={tours}
              users={users}
            />
          </TabsContent>

          {/* Room Analytics Tab */}
          <TabsContent value="room" className="space-y-6">
            <RoomAnalyticsTab
              bookings={filteredBookings}
              rooms={rooms}
              selectedRooms={selectedRooms}
            />
          </TabsContent>

          {/* Tour Analytics Tab */}
          <TabsContent value="tour" className="space-y-6">
            <TourAnalyticsTab
              bookings={filteredBookings}
              tours={tours}
            />
          </TabsContent>

          {/* User Analytics Tab */}
          <TabsContent value="user" className="space-y-6">
            <UserAnalyticsTab
              bookings={filteredBookings}
              users={users}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

// General Analytics Tab Component
function GeneralAnalyticsTab({ bookings, rooms, tours, users }: any) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <GeneralOverviewCards
        bookings={bookings}
        rooms={rooms}
        tours={tours}
        users={users}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyReservationsChart bookings={bookings} />
        <DailyDistributionChart bookings={bookings} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PeakHoursChart bookings={bookings} />
        <ReservationHeatmap bookings={bookings} />
      </div>
    </div>
  )
}

// Room Analytics Tab Component
function RoomAnalyticsTab({ bookings, rooms, selectedRooms }: any) {
  const [roomFilter, setRoomFilter] = useState<string>(selectedRooms.length > 0 ? selectedRooms[0] : 'all')

  // Update local filter when global filter changes
  useMemo(() => {
    if (selectedRooms.length > 0) {
      setRoomFilter(selectedRooms[0])
    } else {
      setRoomFilter('all')
    }
  }, [selectedRooms])

  return (
    <div className="space-y-6">
      {/* Room Overview Cards */}
      <RoomOverviewCards
        bookings={bookings}
        rooms={rooms}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoomMonthlyChart
          bookings={bookings}
          rooms={rooms}
        />
        <GuestDistributionChart
          bookings={bookings}
          rooms={rooms}
          selectedRoom={roomFilter}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoomTimeHeatmap
          bookings={bookings}
          rooms={rooms}
        />
        <AverageReservationTimeChart
          bookings={bookings}
          rooms={rooms}
          selectedRoom={roomFilter}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <AverageGuestsChart
          bookings={bookings}
          rooms={rooms}
          selectedRoom={roomFilter}
        />
      </div>
    </div>
  )
}

// Tour Analytics Tab Component
function TourAnalyticsTab({ bookings, tours }: any) {
  return (
    <div className="space-y-6">
      {/* Tour Overview Cards */}
      <TourOverviewCards
        bookings={bookings}
        tours={tours}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TourMonthlyChart
          bookings={bookings}
          tours={tours}
        />
        <TourGuestsCard
          bookings={bookings}
          tours={tours}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TourTimeHeatmap
          bookings={bookings}
          tours={tours}
        />
        <TourAverageTimeChart
          bookings={bookings}
          tours={tours}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <TourAverageGuestsChart
          bookings={bookings}
          tours={tours}
        />
      </div>
    </div>
  )
}

// User Analytics Tab Component
function UserAnalyticsTab({ bookings, users }: any) {
  return (
    <div className="space-y-6">
      {/* User Overview Cards */}
      <UserOverviewCards
        bookings={bookings}
        users={users}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserRegistrationChart
          bookings={bookings}
          users={users}
        />
        <TopInstitutionsChart
          bookings={bookings}
          users={users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopUsersChart
          bookings={bookings}
          users={users}
        />
        <InstitutionBookingsChart
          bookings={bookings}
          users={users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <UserBookingDistributionChart
          bookings={bookings}
          users={users}
        />
      </div>
    </div>
  )
}

// Loading Skeleton Component
function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-10 w-[240px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-[180px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full">
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}