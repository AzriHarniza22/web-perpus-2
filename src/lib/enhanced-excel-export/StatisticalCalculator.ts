import { format, differenceInDays, differenceInHours } from 'date-fns'
import { Booking, Room, Tour, User } from '@/lib/types'
import { EnhancedExportData } from './EnhancedExcelExportService'

// Extended booking type that includes joined data
type ExtendedBooking = Booking & {
  profiles?: User
  rooms?: Room
  tours?: Tour
}

export interface StatisticalSummary {
  overview: {
    totalBookings: number
    totalUsers: number
    totalRooms: number
    totalTours: number
    dateRange: {
      days: number
      startDate: Date
      endDate: Date
    }
  }
  bookingMetrics: {
    averageGuestsPerBooking: number
    averageDurationHours: number
    peakBookingHour: number
    peakBookingDay: string
    cancellationRate: number
    statusDistribution: Record<string, number>
  }
  userMetrics: {
    newUsersInPeriod: number
    activeUsers: number
    averageBookingsPerUser: number
    topInstitutions: Array<{
      name: string
      count: number
      percentage: number
    }>
  }
  roomMetrics: {
    utilizationRate: number
    averageUtilizationByRoom: Record<string, number>
    mostPopularRoom: string
    leastPopularRoom: string
    mostPopularRoomName: string
    leastPopularRoomName: string
    peakUsageHours: Record<string, number[]>
  }
  tourMetrics: {
    averageParticipantsPerTour: number
    mostPopularTour: string
    tourConversionRate: number
    averageTourDuration: number
  }
  timeBasedMetrics: {
    dailyAverage: number
    weeklyAverage: number
    monthlyAverage: number
    growthRate: number
    seasonalTrends: Record<string, number>
  }
}

export interface TrendAnalysis {
  bookingTrends: {
    daily: Array<{ date: string; count: number; movingAverage: number }>
    weekly: Array<{ week: string; count: number; trend: 'up' | 'down' | 'stable' }>
    monthly: Array<{ month: string; count: number; growth: number }>
  }
  userGrowth: {
    daily: Array<{ date: string; newUsers: number; cumulative: number }>
    retentionRate: number
    churnRate: number
  }
  roomUtilization: {
    daily: Array<{ date: string; utilization: number; capacity: number }>
    trends: Array<{ roomName: string; trend: 'increasing' | 'decreasing' | 'stable'; change: number }>
  }
}

export class StatisticalCalculator {

  /**
   * Calculate comprehensive statistical summaries
   */
  calculateSummaries(data: EnhancedExportData): StatisticalSummary {
    const { bookings, rooms, tours, users, filters } = data

    // Determine date range
    const dateRange = this.determineDateRange(bookings, filters.dateRange)

    // Calculate overview metrics
    const overview = this.calculateOverviewMetrics(bookings, rooms, tours, users, dateRange)

    // Calculate booking-specific metrics
    const bookingMetrics = this.calculateBookingMetrics(bookings, dateRange)

    // Calculate user-specific metrics
    const userMetrics = this.calculateUserMetrics(bookings, users, dateRange)

    // Calculate room-specific metrics
    const roomMetrics = this.calculateRoomMetrics(bookings, rooms, dateRange)

    // Calculate tour-specific metrics
    const tourMetrics = this.calculateTourMetrics(bookings, tours, dateRange)

    // Calculate time-based metrics
    const timeBasedMetrics = this.calculateTimeBasedMetrics(bookings, dateRange)

    return {
      overview,
      bookingMetrics,
      userMetrics,
      roomMetrics,
      tourMetrics,
      timeBasedMetrics
    }
  }

  /**
   * Calculate trend analysis
   */
  calculateTrendAnalysis(data: EnhancedExportData): TrendAnalysis {
    const { bookings, rooms, users, filters } = data

    return {
      bookingTrends: this.calculateBookingTrends(bookings, filters.dateRange),
      userGrowth: this.calculateUserGrowthTrends(bookings, users, filters.dateRange),
      roomUtilization: this.calculateRoomUtilizationTrends(bookings, rooms, filters.dateRange)
    }
  }

  /**
   * Determine the effective date range for calculations
   */
  private determineDateRange(bookings: Booking[], filterRange?: { from: Date; to: Date }) {
    if (filterRange) {
      return {
        startDate: filterRange.from,
        endDate: filterRange.to,
        days: differenceInDays(filterRange.to, filterRange.from) + 1
      }
    }

    // Auto-determine from booking data
    const dates = bookings.map(b => new Date(b.created_at)).sort((a, b) => a.getTime() - b.getTime())
    if (dates.length === 0) {
      const now = new Date()
      return {
        startDate: now,
        endDate: now,
        days: 1
      }
    }

    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      days: differenceInDays(dates[dates.length - 1], dates[0]) + 1
    }
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverviewMetrics(
    bookings: ExtendedBooking[],
    rooms: Room[],
    tours: Tour[],
    users: User[],
    dateRange: { startDate: Date; endDate: Date; days: number }
  ) {
    const totalBookings = bookings.length
    const totalUsers = users.length
    const totalRooms = rooms.length
    const totalTours = tours.length

    return {
      totalBookings,
      totalUsers,
      totalRooms,
      totalTours,
      dateRange
    }
  }

  /**
   * Calculate booking-specific metrics
   */
  private calculateBookingMetrics(bookings: Booking[], dateRange: { startDate: Date; endDate: Date; days: number }) {
    const totalGuests = bookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    const averageGuestsPerBooking = bookings.length > 0 ? totalGuests / bookings.length : 0

    // Calculate average duration
    const totalDuration = bookings.reduce((sum, booking) => {
      if (booking.start_time && booking.end_time) {
        return sum + differenceInHours(new Date(booking.end_time), new Date(booking.start_time))
      }
      return sum
    }, 0)
    const averageDurationHours = bookings.length > 0 ? totalDuration / bookings.length : 0

    // Find peak booking hour
    const hourCounts = bookings.reduce((acc, booking) => {
      if (booking.start_time) {
        const hour = new Date(booking.start_time).getHours()
        acc[hour] = (acc[hour] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)

    const peakBookingHour = Object.entries(hourCounts).reduce((max, [hour, count]) =>
      count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 }
    ).hour

    // Find peak booking day
    const dayCounts = bookings.reduce((acc, booking) => {
      if (booking.created_at) {
        const day = format(new Date(booking.created_at), 'EEEE')
        acc[day] = (acc[day] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const peakBookingDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
      count > max.count ? { day, count } : max, { day: 'Monday', count: 0 }
    ).day

    // Calculate cancellation rate
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
    const cancellationRate = bookings.length > 0 ? (cancelledBookings / bookings.length) * 100 : 0

    // Status distribution
    const statusDistribution = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      averageGuestsPerBooking: Math.round(averageGuestsPerBooking * 100) / 100,
      averageDurationHours: Math.round(averageDurationHours * 100) / 100,
      peakBookingHour,
      peakBookingDay,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      statusDistribution
    }
  }

  /**
   * Calculate user-specific metrics
   */
  private calculateUserMetrics(
    bookings: ExtendedBooking[],
    users: User[],
    dateRange: { startDate: Date; endDate: Date; days: number }
  ) {
    // New users in period
    const newUsersInPeriod = users.filter(user => {
      if (!user.created_at) return false
      const userDate = new Date(user.created_at)
      return userDate >= dateRange.startDate && userDate <= dateRange.endDate
    }).length

    // Active users (users with bookings in period)
    const activeUserIds = new Set(bookings.map(b => b.user_id))
    const activeUsers = users.filter(u => activeUserIds.has(u.id)).length

    // Average bookings per user
    const averageBookingsPerUser = activeUsers > 0 ? bookings.length / activeUsers : 0

    // Top institutions
    const institutionCounts = bookings.reduce((acc, booking) => {
      const institution = booking.profiles?.institution || 'Unknown'
      acc[institution] = (acc[institution] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBookings = bookings.length
    const topInstitutions = Object.entries(institutionCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      newUsersInPeriod,
      activeUsers,
      averageBookingsPerUser: Math.round(averageBookingsPerUser * 100) / 100,
      topInstitutions
    }
  }

  /**
   * Calculate room-specific metrics
   */
  private calculateRoomMetrics(
    bookings: Booking[],
    rooms: Room[],
    dateRange: { startDate: Date; endDate: Date; days: number }
  ) {
    // Overall utilization rate
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)
    const totalGuests = bookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    const utilizationRate = totalCapacity > 0 ? (totalGuests / totalCapacity) * 100 : 0

    // Average utilization by room (using room names instead of IDs)
    const averageUtilizationByRoom = rooms.reduce((acc, room) => {
      const roomBookings = bookings.filter(b => b.room_id === room.id)
      const roomGuests = roomBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
      acc[room.name || 'Unknown Room'] = room.capacity && room.capacity > 0 ? (roomGuests / room.capacity) * 100 : 0
      return acc
    }, {} as Record<string, number>)

    // Most and least popular rooms (using room names)
    const roomBookingCounts = bookings.reduce((acc, booking) => {
      acc[booking.room_id] = (acc[booking.room_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostPopularRoomId = Object.entries(roomBookingCounts).reduce((max, [roomId, count]) =>
      count > max.count ? { roomId, count } : max, { roomId: '', count: 0 }
    ).roomId

    const leastPopularRoomId = Object.entries(roomBookingCounts).reduce((min, [roomId, count]) =>
      count < min.count || min.count === 0 ? { roomId, count } : min, { roomId: '', count: 0 }
    ).roomId

    // Get room names for popular rooms
    const mostPopularRoomName = rooms.find(room => room.id === mostPopularRoomId)?.name || 'N/A'
    const leastPopularRoomName = rooms.find(room => room.id === leastPopularRoomId)?.name || 'N/A'

    // Peak usage hours by room
    const peakUsageHours = rooms.reduce((acc, room) => {
      const roomBookings = bookings.filter(b => b.room_id === room.id)
      const hourCounts = roomBookings.reduce((hourAcc, booking) => {
        if (booking.start_time) {
          const hour = new Date(booking.start_time).getHours()
          hourAcc[hour] = (hourAcc[hour] || 0) + 1
        }
        return hourAcc
      }, {} as Record<number, number>)

      const peakHours = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour))

      acc[room.id] = peakHours
      return acc
    }, {} as Record<string, number[]>)

    return {
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageUtilizationByRoom,
      mostPopularRoom: mostPopularRoomId,
      leastPopularRoom: leastPopularRoomId,
      mostPopularRoomName,
      leastPopularRoomName,
      peakUsageHours
    }
  }

  /**
   * Calculate tour-specific metrics
   */
  private calculateTourMetrics(
    bookings: ExtendedBooking[],
    tours: Tour[],
    dateRange: { startDate: Date; endDate: Date; days: number }
  ) {
    const tourBookings = bookings.filter(b => b.tours)

    if (tourBookings.length === 0) {
      return {
        averageParticipantsPerTour: 0,
        mostPopularTour: 'N/A',
        tourConversionRate: 0,
        averageTourDuration: 0
      }
    }

    const totalParticipants = tourBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    const averageParticipantsPerTour = totalParticipants / tourBookings.length

    // Most popular tour
    const tourBookingCounts = tourBookings.reduce((acc, booking) => {
      const tourName = booking.tours?.name || 'Unknown'
      acc[tourName] = (acc[tourName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostPopularTour = Object.entries(tourBookingCounts).reduce((max, [tourName, count]) =>
      count > max.count ? { tourName, count } : max, { tourName: '', count: 0 }
    ).tourName

    // Tour conversion rate (bookings with tours / total bookings)
    const tourConversionRate = bookings.length > 0 ? (tourBookings.length / bookings.length) * 100 : 0

    // Average tour duration
    const totalTourDuration = tourBookings.reduce((sum, booking) => {
      if (booking.start_time && booking.end_time) {
        return sum + differenceInHours(new Date(booking.end_time), new Date(booking.start_time))
      }
      return sum
    }, 0)
    const averageTourDuration = tourBookings.length > 0 ? totalTourDuration / tourBookings.length : 0

    return {
      averageParticipantsPerTour: Math.round(averageParticipantsPerTour * 100) / 100,
      mostPopularTour,
      tourConversionRate: Math.round(tourConversionRate * 100) / 100,
      averageTourDuration: Math.round(averageTourDuration * 100) / 100
    }
  }

  /**
   * Calculate time-based metrics
   */
  private calculateTimeBasedMetrics(bookings: ExtendedBooking[], dateRange: { startDate: Date; endDate: Date; days: number }) {
    const dailyAverage = dateRange.days > 0 ? bookings.length / dateRange.days : 0

    // Group bookings by week
    const weeklyBookings = this.groupBookingsByWeek(bookings)
    const weeklyAverage = weeklyBookings.length > 0 ? bookings.length / weeklyBookings.length : 0

    // Group bookings by month
    const monthlyBookings = this.groupBookingsByMonth(bookings)
    const monthlyAverage = monthlyBookings.length > 0 ? bookings.length / monthlyBookings.length : 0

    // Calculate growth rate (comparing first half vs second half of period)
    const midPoint = new Date((dateRange.startDate.getTime() + dateRange.endDate.getTime()) / 2)
    const firstHalf = bookings.filter(b => new Date(b.created_at) < midPoint).length
    const secondHalf = bookings.filter(b => new Date(b.created_at) >= midPoint).length
    const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

    // Seasonal trends (simplified)
    const seasonalTrends = this.calculateSeasonalTrends(bookings)

    return {
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      weeklyAverage: Math.round(weeklyAverage * 100) / 100,
      monthlyAverage: Math.round(monthlyAverage * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      seasonalTrends
    }
  }

  /**
   * Helper method to group bookings by week
   */
  private groupBookingsByWeek(bookings: ExtendedBooking[]): Array<{ week: string; count: number }> {
    const weekGroups = bookings.reduce((acc, booking) => {
      const date = new Date(booking.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = format(weekStart, 'yyyy-MM-dd')

      if (!acc[weekKey]) {
        acc[weekKey] = 0
      }
      acc[weekKey]++

      return acc
    }, {} as Record<string, number>)

    return Object.entries(weekGroups).map(([week, count]) => ({ week, count }))
  }

  /**
   * Helper method to group bookings by month
   */
  private groupBookingsByMonth(bookings: ExtendedBooking[]): Array<{ month: string; count: number }> {
    const monthGroups = bookings.reduce((acc, booking) => {
      const monthKey = format(new Date(booking.created_at), 'yyyy-MM')

      if (!acc[monthKey]) {
        acc[monthKey] = 0
      }
      acc[monthKey]++

      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthGroups).map(([month, count]) => ({ month, count }))
  }

  /**
   * Calculate seasonal trends
   */
  private calculateSeasonalTrends(bookings: ExtendedBooking[]): Record<string, number> {
    const monthlyTotals = bookings.reduce((acc, booking) => {
      const month = format(new Date(booking.created_at), 'MMMM')
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBookings = bookings.length
    const seasonalTrends: Record<string, number> = {}

    Object.entries(monthlyTotals).forEach(([month, count]) => {
      seasonalTrends[month] = totalBookings > 0 ? (count / totalBookings) * 100 : 0
    })

    return seasonalTrends
  }

  /**
   * Calculate booking trends over time
   */
  private calculateBookingTrends(bookings: Booking[], dateRange?: { from: Date; to: Date }) {
    // Daily trends
    const dailyBookings = this.groupBookingsByDay(bookings)
    const dailyTrends = dailyBookings.map(({ date, count }) => ({
      date,
      count,
      movingAverage: this.calculateMovingAverage(dailyBookings, date, 7)
    }))

    // Weekly trends
    const weeklyBookings = this.groupBookingsByWeek(bookings)
    const weeklyTrends = weeklyBookings.map(({ week, count }, index) => {
      const previousCount = index > 0 ? weeklyBookings[index - 1].count : count
      const trend: 'up' | 'down' | 'stable' =
        count > previousCount ? 'up' : count < previousCount ? 'down' : 'stable'

      return { week, count, trend }
    })

    // Monthly trends
    const monthlyBookings = this.groupBookingsByMonth(bookings)
    const monthlyTrends = monthlyBookings.map(({ month, count }, index) => {
      const previousCount = index > 0 ? monthlyBookings[index - 1].count : count
      const growth = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0

      return { month, count, growth }
    })

    return {
      daily: dailyTrends,
      weekly: weeklyTrends,
      monthly: monthlyTrends
    }
  }

  /**
   * Calculate user growth trends
   */
  private calculateUserGrowthTrends(bookings: Booking[], users: User[], dateRange?: { from: Date; to: Date }) {
    const dailyNewUsers = this.groupNewUsersByDay(users)
    const cumulativeUsers = this.calculateCumulativeUsers(dailyNewUsers)

    // Calculate retention and churn rates (simplified)
    const activeUsers = new Set(bookings.map(b => b.user_id)).size
    const totalUsers = users.length
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    const churnRate = 100 - retentionRate

    return {
      daily: cumulativeUsers,
      retentionRate: Math.round(retentionRate * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100
    }
  }

  /**
   * Calculate room utilization trends
   */
  private calculateRoomUtilizationTrends(bookings: Booking[], rooms: Room[], dateRange?: { from: Date; to: Date }) {
    const dailyUtilization = this.calculateDailyRoomUtilization(bookings, rooms)

    // Calculate trends for each room
    const roomTrends = rooms.map(room => {
      const roomBookings = bookings.filter(b => b.room_id === room.id)
      const firstHalf = roomBookings.filter(b => {
        if (!dateRange) return false
        const midPoint = new Date((dateRange.from.getTime() + dateRange.to.getTime()) / 2)
        return new Date(b.created_at) < midPoint
      }).length

      const secondHalf = roomBookings.filter(b => {
        if (!dateRange) return false
        const midPoint = new Date((dateRange.from.getTime() + dateRange.to.getTime()) / 2)
        return new Date(b.created_at) >= midPoint
      }).length

      const change = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (Math.abs(change) > 5) {
        trend = change > 0 ? 'increasing' : 'decreasing'
      }

      return {
        roomName: room.name || 'Unknown Room',
        trend,
        change: Math.round(change * 100) / 100
      }
    })

    return {
      daily: dailyUtilization,
      trends: roomTrends
    }
  }


  /**
   * Helper methods for trend calculations
   */
  private groupBookingsByDay(bookings: ExtendedBooking[]): Array<{ date: string; count: number }> {
    const dayGroups = bookings.reduce((acc, booking) => {
      const dateKey = format(new Date(booking.created_at), 'yyyy-MM-dd')
      acc[dateKey] = (acc[dateKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(dayGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
  }

  private calculateMovingAverage(
    data: Array<{ date: string; count: number }>,
    currentDate: string,
    window: number
  ): number {
    const currentIndex = data.findIndex(d => d.date === currentDate)
    if (currentIndex === -1) return 0

    const start = Math.max(0, currentIndex - window + 1)
    const subset = data.slice(start, currentIndex + 1)
    return subset.reduce((sum, d) => sum + d.count, 0) / subset.length
  }

  private groupNewUsersByDay(users: User[]): Array<{ date: string; newUsers: number }> {
    const dayGroups = users.reduce((acc, user) => {
      if (user.created_at) {
        const dateKey = format(new Date(user.created_at), 'yyyy-MM-dd')
        acc[dateKey] = (acc[dateKey] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(dayGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, newUsers]) => ({ date, newUsers }))
  }

  private calculateCumulativeUsers(dailyNewUsers: Array<{ date: string; newUsers: number }>): Array<{ date: string; newUsers: number; cumulative: number }> {
    let cumulative = 0
    return dailyNewUsers.map(({ date, newUsers }) => {
      cumulative += newUsers
      return { date, newUsers, cumulative }
    })
  }

  private calculateDailyRoomUtilization(bookings: ExtendedBooking[], rooms: Room[]): Array<{ date: string; utilization: number; capacity: number }> {
    const dayGroups = bookings.reduce((acc, booking) => {
      const dateKey = format(new Date(booking.created_at), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = { guests: 0, capacity: 0 }
      }

      acc[dateKey].guests += booking.guest_count || 0
      if (booking.rooms?.capacity) {
        acc[dateKey].capacity += booking.rooms.capacity
      }

      return acc
    }, {} as Record<string, { guests: number; capacity: number }>)

    return Object.entries(dayGroups).map(([date, { guests, capacity }]) => ({
      date,
      utilization: capacity > 0 ? (guests / capacity) * 100 : 0,
      capacity
    }))
  }

}