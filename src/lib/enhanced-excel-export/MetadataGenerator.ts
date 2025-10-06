import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking, Room, Tour, User } from '@/lib/types'
import { EnhancedExportData, EnhancedExportOptions } from './EnhancedExcelExportService'

export interface ComprehensiveMetadata {
  // Basic export information
  exportInfo: {
    exportDate: Date
    exportTimestamp: string
    exportedBy?: string
    exportVersion: string
    applicationName: string
  }

  // Data context
  dataContext: {
    currentTab: string
    totalRecords: number
    dateRange?: {
      from: Date
      to: Date
      days: number
      formatted: string
    }
    filters: {
      selectedRooms?: string[]
      quickSelect?: string
      roomCount?: number
    }
  }

  // Data summary
  dataSummary: {
    bookings: {
      total: number
      byStatus: Record<string, number>
      byRoom: Record<string, number>
      byTour: Record<string, number>
      averageGuests: number
      averageDuration: number
    }
    rooms: {
      total: number
      active: number
      totalCapacity: number
      averageCapacity: number
    }
    tours: {
      total: number
      active: number
      totalCapacity: number
      averageCapacity: number
    }
    users: {
      total: number
      active: number
      newInPeriod: number
      topInstitutions: Array<{
        name: string
        count: number
        percentage: number
      }>
    }
  }

  // Export configuration
  exportConfiguration: {
    includeCharts: boolean
    includeRawData: boolean
    includeStatisticalSummaries: boolean
    includeTrendAnalysis: boolean
    performanceOptimizations: boolean
    fileFormat: string
    features: string[]
  }

  // System information
  systemInfo: {
    generatedAt: string
    timezone: string
    locale: string
    dataFreshness: {
      oldestRecord?: string
      newestRecord?: string
      averageAge: number
    }
  }

  // Quality metrics
  qualityMetrics: {
    dataCompleteness: {
      bookingsWithProfiles: number
      bookingsWithRooms: number
      bookingsWithTours: number
      usersWithCompleteInfo: number
    }
    dataQuality: {
      missingValues: Record<string, number>
      invalidValues: Record<string, number>
      duplicateRecords: number
    }
  }
}

export class MetadataGenerator {

  /**
   * Generate comprehensive metadata for the export
   */
  generateMetadata(data: EnhancedExportData, options: EnhancedExportOptions = {}): ComprehensiveMetadata {
    const {
      includeCharts = true,
      includeRawData = true,
      includeStatisticalSummaries = true,
      includeTrendAnalysis = true,
      performanceOptimizations = true
    } = options

    // Generate basic export information
    const exportInfo = this.generateExportInfo()

    // Generate data context
    const dataContext = this.generateDataContext(data)

    // Generate data summary
    const dataSummary = this.generateDataSummary(data)

    // Generate export configuration
    const exportConfiguration = this.generateExportConfiguration(options)

    // Generate system information
    const systemInfo = this.generateSystemInfo(data)

    // Generate quality metrics
    const qualityMetrics = this.generateQualityMetrics(data)

    return {
      exportInfo,
      dataContext,
      dataSummary,
      exportConfiguration,
      systemInfo,
      qualityMetrics
    }
  }

  /**
   * Generate basic export information
   */
  private generateExportInfo(): ComprehensiveMetadata['exportInfo'] {
    return {
      exportDate: new Date(),
      exportTimestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      exportVersion: '2.0.0',
      applicationName: 'Library Reservation System Analytics'
    }
  }

  /**
   * Generate data context information
   */
  private generateDataContext(data: EnhancedExportData): ComprehensiveMetadata['dataContext'] {
    const { bookings, currentTab, filters } = data

    // Calculate date range from filters or data
    let dateRange: ComprehensiveMetadata['dataContext']['dateRange'] | undefined
    if (filters.dateRange) {
      const days = Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      dateRange = {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        days,
        formatted: `${format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id })} - ${format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })}`
      }
    }

    // Count room filters
    const roomCount = filters.selectedRooms?.length || 0

    return {
      currentTab,
      totalRecords: bookings.length,
      dateRange,
      filters: {
        selectedRooms: filters.selectedRooms,
        quickSelect: filters.quickSelect,
        roomCount
      }
    }
  }

  /**
   * Generate comprehensive data summary
   */
  private generateDataSummary(data: EnhancedExportData): ComprehensiveMetadata['dataSummary'] {
    const { bookings, rooms, tours, users } = data

    // Extended booking type for joined data access
    type ExtendedBooking = Booking & {
      profiles?: User
      rooms?: Room
      tours?: Tour
    }

    const extendedBookings = bookings as ExtendedBooking[]

    // Booking summary
    const bookingsByStatus = extendedBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bookingsByRoom = extendedBookings.reduce((acc, booking) => {
      const roomName = booking.rooms?.name || 'Unknown'
      acc[roomName] = (acc[roomName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bookingsByTour = extendedBookings.reduce((acc, booking) => {
      const tourName = booking.tours?.name || 'Unknown'
      acc[tourName] = (acc[tourName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalGuests = extendedBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    const averageGuests = extendedBookings.length > 0 ? totalGuests / extendedBookings.length : 0

    // Calculate average duration (simplified)
    const averageDuration = this.calculateAverageBookingDuration(extendedBookings)

    // Room summary
    const activeRooms = rooms.filter(room => room.is_active).length
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)
    const averageCapacity = rooms.length > 0 ? totalCapacity / rooms.length : 0

    // Tour summary
    const activeTours = tours.filter(tour => tour.is_active).length
    const totalTourCapacity = tours.reduce((sum, tour) => sum + (tour.capacity || 0), 0)
    const averageTourCapacity = tours.length > 0 ? totalTourCapacity / tours.length : 0

    // User summary
    const activeUsers = users.filter(user => {
      return extendedBookings.some(booking => booking.user_id === user.id)
    }).length

    // Calculate new users in period (simplified - would need actual date filtering)
    const newInPeriod = users.length // Placeholder - would need proper date filtering

    // Top institutions
    const institutionCounts = extendedBookings.reduce((acc, booking) => {
      const institution = booking.profiles?.institution || 'Unknown'
      acc[institution] = (acc[institution] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBookings = extendedBookings.length
    const topInstitutions = Object.entries(institutionCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      bookings: {
        total: extendedBookings.length,
        byStatus: bookingsByStatus,
        byRoom: bookingsByRoom,
        byTour: bookingsByTour,
        averageGuests: Math.round(averageGuests * 100) / 100,
        averageDuration: Math.round(averageDuration * 100) / 100
      },
      rooms: {
        total: rooms.length,
        active: activeRooms,
        totalCapacity,
        averageCapacity: Math.round(averageCapacity * 100) / 100
      },
      tours: {
        total: tours.length,
        active: activeTours,
        totalCapacity: totalTourCapacity,
        averageCapacity: Math.round(averageTourCapacity * 100) / 100
      },
      users: {
        total: users.length,
        active: activeUsers,
        newInPeriod,
        topInstitutions
      }
    }
  }

  /**
   * Generate export configuration metadata
   */
  private generateExportConfiguration(options: EnhancedExportOptions): ComprehensiveMetadata['exportConfiguration'] {
    const features: string[] = []

    if (options.includeCharts) features.push('Charts')
    if (options.includeRawData) features.push('Raw Data')
    if (options.includeStatisticalSummaries) features.push('Statistical Summaries')
    if (options.includeTrendAnalysis) features.push('Trend Analysis')
    if (options.performanceOptimizations) features.push('Performance Optimized')

    return {
      includeCharts: options.includeCharts || false,
      includeRawData: options.includeRawData || false,
      includeStatisticalSummaries: options.includeStatisticalSummaries || false,
      includeTrendAnalysis: options.includeTrendAnalysis || false,
      performanceOptimizations: options.performanceOptimizations || false,
      fileFormat: 'Excel (XLSX)',
      features
    }
  }

  /**
   * Generate system information
   */
  private generateSystemInfo(data: EnhancedExportData): ComprehensiveMetadata['systemInfo'] {
    const { bookings } = data

    // Calculate data freshness
    const dates = bookings
      .map(b => new Date(b.created_at))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    let dataFreshness: ComprehensiveMetadata['systemInfo']['dataFreshness'] = {
      averageAge: 0
    }

    if (dates.length > 0) {
      const oldest = dates[0]
      const newest = dates[dates.length - 1]
      const now = new Date()
      const totalAge = dates.reduce((sum, date) => sum + (now.getTime() - date.getTime()), 0)
      const averageAge = totalAge / dates.length

      dataFreshness = {
        oldestRecord: format(oldest, 'yyyy-MM-dd HH:mm:ss'),
        newestRecord: format(newest, 'yyyy-MM-dd HH:mm:ss'),
        averageAge: Math.round(averageAge / (1000 * 60 * 60 * 24)) // Convert to days
      }
    }

    return {
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'id-ID',
      dataFreshness
    }
  }

  /**
   * Generate data quality metrics
   */
  private generateQualityMetrics(data: EnhancedExportData): ComprehensiveMetadata['qualityMetrics'] {
    const { bookings, users } = data

    // Extended booking type for joined data access
    type ExtendedBooking = Booking & {
      profiles?: User
      rooms?: Room
      tours?: Tour
    }

    const extendedBookings = bookings as ExtendedBooking[]

    // Data completeness
    const bookingsWithProfiles = extendedBookings.filter(b => b.profiles).length
    const bookingsWithRooms = extendedBookings.filter(b => b.rooms).length
    const bookingsWithTours = extendedBookings.filter(b => b.tours).length

    const usersWithCompleteInfo = users.filter(user =>
      user.full_name && user.institution && user.phone
    ).length

    // Data quality issues
    const missingValues = this.countMissingValues(extendedBookings)
    const invalidValues = this.countInvalidValues(extendedBookings)
    const duplicateRecords = this.countDuplicateRecords(extendedBookings)

    return {
      dataCompleteness: {
        bookingsWithProfiles: bookings.length > 0 ? (bookingsWithProfiles / bookings.length) * 100 : 0,
        bookingsWithRooms: bookings.length > 0 ? (bookingsWithRooms / bookings.length) * 100 : 0,
        bookingsWithTours: bookings.length > 0 ? (bookingsWithTours / bookings.length) * 100 : 0,
        usersWithCompleteInfo: users.length > 0 ? (usersWithCompleteInfo / users.length) * 100 : 0
      },
      dataQuality: {
        missingValues,
        invalidValues,
        duplicateRecords
      }
    }
  }

  /**
   * Calculate average booking duration
   */
  private calculateAverageBookingDuration(bookings: Array<Booking & { rooms?: Room; tours?: Tour }>): number {
    const durations = bookings
      .filter(booking => booking.start_time && booking.end_time)
      .map(booking => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert to hours
      })

    return durations.length > 0 ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0
  }

  /**
   * Count missing values in the dataset
   */
  private countMissingValues(bookings: Array<Booking & { profiles?: User; rooms?: Room; tours?: Tour }>): Record<string, number> {
    const counts: Record<string, number> = {}

    bookings.forEach(booking => {
      if (!booking.event_description) counts.eventDescription = (counts.eventDescription || 0) + 1
      if (!booking.guest_count) counts.guestCount = (counts.guestCount || 0) + 1
      if (!booking.notes) counts.notes = (counts.notes || 0) + 1
      if (!booking.profiles?.full_name) counts.userName = (counts.userName || 0) + 1
      if (!booking.profiles?.institution) counts.institution = (counts.institution || 0) + 1
      if (!booking.rooms?.name) counts.roomName = (counts.roomName || 0) + 1
    })

    return counts
  }

  /**
   * Count invalid values in the dataset
   */
  private countInvalidValues(bookings: Array<Booking & { profiles?: User; rooms?: Room; tours?: Tour }>): Record<string, number> {
    const counts: Record<string, number> = {}

    bookings.forEach(booking => {
      if (booking.guest_count !== null && (booking.guest_count < 0 || booking.guest_count > 1000)) {
        counts.invalidGuestCount = (counts.invalidGuestCount || 0) + 1
      }
      if (booking.start_time && booking.end_time) {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        if (start >= end) {
          counts.invalidDateRange = (counts.invalidDateRange || 0) + 1
        }
      }
    })

    return counts
  }

  /**
   * Count duplicate records (simplified implementation)
   */
  private countDuplicateRecords(bookings: Array<Booking & { profiles?: User; rooms?: Room; tours?: Tour }>): number {
    const seen = new Set<string>()
    let duplicates = 0

    bookings.forEach(booking => {
      // Create a simple hash of key fields
      const key = `${booking.user_id}-${booking.room_id}-${booking.start_time}-${booking.end_time}`
      if (seen.has(key)) {
        duplicates++
      } else {
        seen.add(key)
      }
    })

    return duplicates
  }

  /**
   * Generate metadata summary for Excel sheet
   */
  generateMetadataSummary(metadata: ComprehensiveMetadata): string[][] {
    const summary: string[][] = []

    // Export Information
    summary.push(['=== EXPORT INFORMATION ==='])
    summary.push(['Export Date', metadata.exportInfo.exportTimestamp])
    summary.push(['Application', metadata.exportInfo.applicationName])
    summary.push(['Version', metadata.exportInfo.exportVersion])
    summary.push([''])

    // Data Context
    summary.push(['=== DATA CONTEXT ==='])
    summary.push(['Current Tab', metadata.dataContext.currentTab])
    summary.push(['Total Records', String(metadata.dataContext.totalRecords)])
    if (metadata.dataContext.dateRange) {
      summary.push(['Date Range', metadata.dataContext.dateRange.formatted])
      summary.push(['Days Covered', String(metadata.dataContext.dateRange.days)])
    }
    if (metadata.dataContext.filters.roomCount && metadata.dataContext.filters.roomCount > 0) {
      summary.push(['Rooms Filtered', String(metadata.dataContext.filters.roomCount)])
    }
    summary.push([''])

    // Data Summary
    summary.push(['=== DATA SUMMARY ==='])
    summary.push(['Total Bookings', String(metadata.dataSummary.bookings.total)])
    summary.push(['Total Rooms', String(metadata.dataSummary.rooms.total)])
    summary.push(['Total Tours', String(metadata.dataSummary.tours.total)])
    summary.push(['Total Users', String(metadata.dataSummary.users.total)])
    summary.push([''])

    // Status Distribution
    summary.push(['=== BOOKING STATUS DISTRIBUTION ==='])
    Object.entries(metadata.dataSummary.bookings.byStatus).forEach(([status, count]) => {
      summary.push([status, String(count)])
    })
    summary.push([''])

    // Top Institutions
    if (metadata.dataSummary.users.topInstitutions.length > 0) {
      summary.push(['=== TOP INSTITUTIONS ==='])
      metadata.dataSummary.users.topInstitutions.slice(0, 5).forEach(inst => {
        summary.push([inst.name, `${inst.count} (${Math.round(inst.percentage)}%)`])
      })
      summary.push([''])
    }

    // Export Features
    summary.push(['=== EXPORT FEATURES ==='])
    metadata.exportConfiguration.features.forEach(feature => {
      summary.push([feature, '✓'])
    })
    summary.push([''])

    // Data Quality
    summary.push(['=== DATA QUALITY ==='])
    summary.push(['Data Completeness', `${Math.round((metadata.qualityMetrics.dataCompleteness.bookingsWithProfiles + metadata.qualityMetrics.dataCompleteness.bookingsWithRooms) / 2)}%`])
    summary.push(['Duplicate Records', String(metadata.qualityMetrics.dataQuality.duplicateRecords)])

    return summary
  }
}