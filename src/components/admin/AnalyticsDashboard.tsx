'use client'

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
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
  BookOpen,
  Check,
  ChevronDown,
  Loader2
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
import { UserOverviewCards } from '@/components/admin/analytics/UserOverviewCards'
import { UserRegistrationChart } from '@/components/admin/analytics/UserRegistrationChart'
import { TopInstitutionsChart } from '@/components/admin/analytics/TopInstitutionsChart'
import { TopUsersChart } from '@/components/admin/analytics/TopUsersChart'
import { InstitutionBookingsChart } from '@/components/admin/analytics/InstitutionBookingsChart'
import { UserBookingDistributionChart } from '@/components/admin/analytics/UserBookingDistributionChart'
import { ExportButton } from '@/components/admin/analytics/ExportButton'
import { ChartDataProvider, useChartData } from '@/components/admin/analytics/ChartDataContext'
import { useFilterState } from '@/hooks/useFilterState'
import { exportToCSV, exportToPDF, exportToExcel, exportToEnhancedExcel, ExportData, ExtendedExportOptions } from '@/lib/exportUtils'
import { Booking, Room, Tour, User } from '@/lib/types'

interface AnalyticsDashboardProps {
  bookings: Booking[]
  rooms: Room[]
  tours: Tour[]
  users: User[]
  isLoading?: boolean
  onExportStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error', format?: string) => void
}

interface DateFilter {
  range: DateRange | undefined
  quickSelect: string | null
}

interface GeneralAnalyticsTabProps {
  bookings: Booking[]
  rooms: Room[]
  tours: Tour[]
  users: User[]
}

interface RoomAnalyticsTabProps {
  bookings: Booking[]
  rooms: Room[]
  selectedRooms: string[]
}

interface TourAnalyticsTabProps {
  bookings: Booking[]
  tours: Tour[]
}

interface UserAnalyticsTabProps {
  bookings: Booking[]
  users: User[]
}

function AnalyticsDashboardContent({
  bookings,
  rooms,
  tours,
  users,
  isLoading = false,
  onExportStatusChange
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('general')

  // Enhanced filter state management with URL persistence
  const {
    filterState,
    hasActiveFilters,
    activeFilterCount,
    setQuickSelect,
    setDateRange,
    setSelectedRooms,
    setSearchQuery,
    clearAllFilters,
    validation
  } = useFilterState({
    debounceMs: 300,
    validateOnChange: true,
    persistToUrl: true
  })

  // Global date filter logic
  const filteredBookings = useMemo(() => {
    if (!filterState.dateRange?.from || !filterState.dateRange?.to) return bookings

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at)
      return isWithinInterval(bookingDate, {
        start: filterState.dateRange!.from!,
        end: filterState.dateRange!.to!
      })
    })
  }, [bookings, filterState.dateRange])

  // Quick date filter handlers - Optimized with useCallback
  const handleQuickSelect = useCallback((period: string) => {
    setQuickSelect(period)
  }, [setQuickSelect])

  const clearDateFilter = useCallback(() => {
    setDateRange(undefined)
    setQuickSelect(null)
  }, [setDateRange, setQuickSelect])

  // clearAllFilters is now provided by useFilterState hook

  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf' | 'excel', selectedCharts?: string[]) => {
    onExportStatusChange?.('loading', format)

    try {
      // Use current filters for export
      const exportDateRange = filterState.dateRange?.from && filterState.dateRange?.to ? {
        from: filterState.dateRange.from,
        to: filterState.dateRange.to
      } : undefined

      let exportBookings = bookings
      const exportRooms = rooms
      const exportUsers = users

      // Filter current bookings based on export date range
      if (exportDateRange?.from && exportDateRange?.to) {
        exportBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.created_at)
          return isWithinInterval(bookingDate, {
            start: exportDateRange.from!,
            end: exportDateRange.to!
          })
        })
      }

      // Prepare export data
      const exportData: ExportData = {
        bookings: exportBookings,
        rooms: exportRooms,
        tours, // tours are derived from rooms
        users: exportUsers,
        currentTab: activeTab as 'general' | 'room' | 'tour' | 'user',
        filters: {
          dateRange: exportDateRange?.from && exportDateRange?.to ? {
            from: exportDateRange.from,
            to: exportDateRange.to
          } : undefined,
          selectedRooms: filterState.selectedRooms,
          quickSelect: filterState.quickSelect || undefined
        },
        metadata: {
          exportDate: new Date(),
          totalBookings: exportBookings.length,
          totalRooms: exportRooms.length,
          totalUsers: exportUsers.length
        }
      }

      // Collect chart data for enhanced export
      const allChartData = await collectChartData()

      // Filter chart data by selected charts if provided
      const chartData = selectedCharts && selectedCharts.length > 0
        ? Object.keys(allChartData)
            .filter(key => selectedCharts.includes(key))
            .reduce((filtered, key) => {
              filtered[key] = allChartData[key]
              return filtered
            }, {} as typeof allChartData)
        : allChartData

      switch (format) {
        case 'csv':
          await exportToCSV(exportData, {
            includeCharts: true,
            includeRawData: true,
            dateFormat: 'dd/MM/yyyy',
            includeMetadata: true
          })
          break
        case 'pdf':
          await exportToPDF(exportData, {
            includeCharts: true,
            includeRawData: true,
            dateFormat: 'dd/MM/yyyy',
            includeMetadata: true
          })
          break
        case 'excel':
          // Use enhanced Excel export with chart data
          await exportToEnhancedExcel(
            exportData,
            {
              includeCharts: true,
              includeRawData: true,
              includeStatisticalSummaries: true,
              includeTrendAnalysis: true,
              performanceOptimizations: true,
              dateFormat: 'dd/MM/yyyy',
              includeMetadata: true,
              onProgress: (progress, status) => {
                console.log(`Export progress: ${progress}% - ${status}`)
              }
            },
            chartData
          )
          break
      }

      onExportStatusChange?.('success', format)
    } catch (error) {
      console.error(`Export ${format} failed:`, error)
      onExportStatusChange?.('error', format)
      throw error // Re-throw to let ExportButton handle the error state
    }
  }

  // Chart data collection using context
  const { chartDataMap, registerChartData, clearChartData, getChartData } = useChartData()

  // Collect chart data from all chart components
  const collectChartData = useCallback(async (): Promise<{
    [chartKey: string]: {
      title: string
      data: any
      type: string
      viewMode?: string
    }
  }> => {
    // Return the collected chart data
    return getChartData()
  }, [getChartData])

  // Clear chart data when filters change - moved before early return to follow Rules of Hooks
  useEffect(() => {
    clearChartData()
  }, [filterState.dateRange, filterState.selectedRooms, clearChartData])

  if (isLoading) {
    return <AnalyticsDashboardSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Global Filters and Export Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        role="region"
        aria-label="Analytics filters and export controls"
      >
        {/* Enhanced Global Filters */}
        <Card className="bg-card backdrop-blur-sm border-2">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary dark:text-primary-foreground" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300" id="global-filters-label">Filter Global:</span>
              </div>

              {/* Enhanced Quick Date Filters */}
              <div className="flex gap-1.5" role="group" aria-labelledby="global-filters-label">
                {[
                  { key: 'this-week', label: 'Minggu Ini', active: filterState.quickSelect === 'this-week' },
                  { key: 'this-month', label: 'Bulan Ini', active: filterState.quickSelect === 'this-month' },
                  { key: 'this-year', label: 'Tahun Ini', active: filterState.quickSelect === 'this-year' }
                ].map((period) => (
                  <Button
                    key={period.key}
                    variant={period.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect(period.key)}
                    className={cn(
                      "text-xs font-medium transition-all duration-200",
                      period.active
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    aria-pressed={period.active}
                    aria-label={`${period.active ? 'Active: ' : ''}Filter periode ${period.label}`}
                  >
                    {period.active && <Check className="w-3 h-3 mr-1" aria-hidden="true" />}
                    {period.label}
                  </Button>
                ))}
              </div>

              {/* Enhanced Custom Date Range */}
              <div className="flex items-center gap-2">
                <DateRangePicker
                  date={filterState.dateRange}
                  onDateChange={(range) => setDateRange(range)}
                  placeholder="Pilih rentang tanggal"
                  className="w-[220px]"
                />
                {filterState.dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Clear date filter"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              {/* Enhanced Multi-Room Filter - Only show on room tab */}
              {activeTab === 'room' && (
                <div className="flex items-center gap-2">
                  <Select
                    value={filterState.selectedRooms.length > 0 ? filterState.selectedRooms.join(',') : 'all'}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedRooms([])
                      } else if (value.startsWith('room-')) {
                        const roomId = value.replace('room-', '')
                        if (filterState.selectedRooms.includes(roomId)) {
                          setSelectedRooms(filterState.selectedRooms.filter((id: string) => id !== roomId))
                        } else {
                          setSelectedRooms([...filterState.selectedRooms, roomId])
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih ruangan">
                        {filterState.selectedRooms.length === 0
                          ? "Semua Ruangan"
                          : `${filterState.selectedRooms.length} ruangan dipilih`
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Ruangan</SelectItem>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={`room-${room.id}`}>
                          <div className="flex items-center gap-2">
                            {filterState.selectedRooms.includes(room.id) && <Check className="w-3 h-3" />}
                            {room.name}
                          </div>
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Enhanced Active Filters Display */}
              <div className="flex flex-wrap gap-2 ml-2">
                {filterState.dateRange && (
                  <Badge
                    variant="default"
                    className="flex items-center gap-1.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                  >
                    <CalendarIcon className="w-3 h-3" />
                    <span className="font-medium">
                      {format(filterState.dateRange.from!, "dd/MM/yyyy", { locale: id })}
                      {filterState.dateRange.to && ` - ${format(filterState.dateRange.to, "dd/MM/yyyy", { locale: id })}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-4 w-4 p-0 ml-1 hover:bg-primary/20 dark:hover:bg-primary/30"
                      aria-label="Remove date filter"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filterState.selectedRooms.length > 0 && (
                  <Badge
                    variant="default"
                    className="flex items-center gap-1.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    <Building className="w-3 h-3" />
                    <span className="font-medium">
                      {filterState.selectedRooms.length === 1
                        ? rooms?.find((r) => r.id === filterState.selectedRooms[0])?.name
                        : `${filterState.selectedRooms.length} ruangan`
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRooms([])}
                      className="h-4 w-4 p-0 ml-1 hover:bg-green-200 dark:hover:bg-green-800"
                      aria-label="Remove room filter"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {(filterState.dateRange || filterState.selectedRooms.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label="Clear all filters"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <ExportButton
          currentTab={activeTab as 'general' | 'room' | 'tour' | 'user'}
          filters={{
            dateRange: filterState.dateRange?.from && filterState.dateRange?.to ? {
              from: filterState.dateRange.from,
              to: filterState.dateRange.to
            } : undefined,
            selectedRooms: filterState.selectedRooms,
            quickSelect: filterState.quickSelect || undefined
          }}
          chartData={chartDataMap}
          onExport={handleExport}
          disabled={isLoading}
        />
      </motion.div>

      {/* Enhanced Tabbed Analytics Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        role="region"
        aria-label="Analytics dashboard content"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4">
            <TabsList
              className="grid w-full grid-cols-4 h-12 bg-gray-50 dark:bg-gray-800/50 p-1"
              role="tablist"
              aria-label="Analytics categories"
            >
              <TabsTrigger
                value="general"
                className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                aria-label="General analytics tab"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger
                value="room"
                className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                aria-label="Room analytics tab"
              >
                <Building className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Room</span>
              </TabsTrigger>
              <TabsTrigger
                value="tour"
                className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                aria-label="Tour analytics tab"
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Tour</span>
              </TabsTrigger>
              <TabsTrigger
                value="user"
                className="flex items-center gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                aria-label="User analytics tab"
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">User</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Analytics Tab */}
          <TabsContent value="general" className="space-y-4 mt-2" role="tabpanel" aria-labelledby="general-tab">
            <div aria-label="General analytics content">
              <GeneralAnalyticsTab
                bookings={filteredBookings}
                rooms={rooms}
                tours={tours}
                users={users}
              />
            </div>
          </TabsContent>

          {/* Room Analytics Tab */}
          <TabsContent value="room" className="space-y-4 mt-2" role="tabpanel" aria-labelledby="room-tab">
            <div aria-label="Room analytics content">
              <RoomAnalyticsTab
                bookings={filteredBookings}
                rooms={rooms}
                selectedRooms={filterState.selectedRooms}
              />
            </div>
          </TabsContent>

          {/* Tour Analytics Tab */}
          <TabsContent value="tour" className="space-y-4 mt-2" role="tabpanel" aria-labelledby="tour-tab">
            <div aria-label="Tour analytics content">
              <TourAnalyticsTab
                bookings={filteredBookings}
                tours={tours}
              />
            </div>
          </TabsContent>

          {/* User Analytics Tab */}
          <TabsContent value="user" className="space-y-4 mt-2" role="tabpanel" aria-labelledby="user-tab">
            <div aria-label="User analytics content">
              <UserAnalyticsTab
                bookings={filteredBookings}
                users={users}
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export function AnalyticsDashboard({
  bookings,
  rooms,
  tours,
  users,
  isLoading = false,
  onExportStatusChange
}: AnalyticsDashboardProps) {
  return (
    <ChartDataProvider>
      <AnalyticsDashboardContent
        bookings={bookings}
        rooms={rooms}
        tours={tours}
        users={users}
        isLoading={isLoading}
        onExportStatusChange={onExportStatusChange}
      />
    </ChartDataProvider>
  )
}

// General Analytics Tab Component
const GeneralAnalyticsTab = memo<GeneralAnalyticsTabProps>(({ bookings, rooms, tours, users }) => {
  const [chartLoadingStates, setChartLoadingStates] = useState<Record<string, boolean>>({
    monthly: false,
    daily: false,
    peak: false,
    heatmap: false
  })

  const handleChartLoad = useCallback((chartKey: string, loading: boolean) => {
    setChartLoadingStates(prev => ({ ...prev, [chartKey]: loading }))
  }, [])

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <GeneralOverviewCards
        bookings={bookings}
        rooms={rooms}
        tours={tours}
        users={users}
      />

      {/* Charts Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyReservationsChart
          bookings={bookings}
          isLoading={chartLoadingStates.monthly}
        />
        <DailyDistributionChart
          bookings={bookings}
          isLoading={chartLoadingStates.daily}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PeakHoursChart
          bookings={bookings}
          isLoading={chartLoadingStates.peak}
        />
        <ReservationHeatmap
          bookings={bookings}
          isLoading={chartLoadingStates.heatmap}
        />
      </div>
    </div>
  )
})

// Room Analytics Tab Component
const RoomAnalyticsTab = memo<RoomAnalyticsTabProps>(({ bookings, rooms, selectedRooms }) => {
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
    <div className="space-y-4">
      {/* Room Overview Cards */}
      <RoomOverviewCards
        bookings={bookings}
        rooms={rooms}
      />

      {/* Charts Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 gap-4">
        <AverageGuestsChart
          bookings={bookings}
          rooms={rooms}
          selectedRoom={roomFilter}
        />
      </div>
    </div>
  )
})

// Tour Analytics Tab Component
const TourAnalyticsTab = memo<TourAnalyticsTabProps>(({ bookings, tours }) => {
  return (
    <div className="space-y-4">
      {/* Tour Overview Cards */}
      <TourOverviewCards
        bookings={bookings}
        tours={tours}
      />

      {/* Charts Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TourMonthlyChart
          bookings={bookings}
          tours={tours}
        />
        <TourGuestsCard
          bookings={bookings}
          tours={tours}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TourTimeHeatmap
          bookings={bookings}
          tours={tours}
        />
        <TourAverageTimeChart
          bookings={bookings}
          tours={tours}
        />
      </div>
    </div>
  )
})

// User Analytics Tab Component
const UserAnalyticsTab = memo<UserAnalyticsTabProps>(({ bookings, users }) => {
  return (
    <div className="space-y-4">
      {/* User Overview Cards */}
      <UserOverviewCards
        bookings={bookings}
        users={users}
      />

      {/* Charts Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <UserRegistrationChart
          bookings={bookings}
          users={users}
        />
        <TopUsersChart
          bookings={bookings}
          users={users}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TopInstitutionsChart
          bookings={bookings}
          users={users}
        />
        <InstitutionBookingsChart
          bookings={bookings}
          users={users}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <UserBookingDistributionChart
          bookings={bookings}
          users={users}
        />
      </div>
    </div>
  )
})

// Enhanced Loading Skeleton Component
function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Enhanced Filter Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Card className="bg-card backdrop-blur-sm border-2">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>

              <div className="h-10 w-[220px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

              <div className="flex gap-2">
                <div className="h-6 w-24 bg-primary/10 dark:bg-primary/20 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Enhanced Tabs Skeleton */}
      <div className="w-full">
        <div className="mb-4">
          <div className="h-12 w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Enhanced Content Skeleton */}
        <div className="space-y-4">
          {/* Overview Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card backdrop-blur-sm">
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

          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-card backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ height: '256px' }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Chart Skeleton */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-card backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ height: '256px' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}