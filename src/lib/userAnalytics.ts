'use client'

import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  topInstitutions: InstitutionData[]
  topUsers: UserData[]
  userRegistrationTrend: RegistrationTrend[]
  bookingDistribution: BookingDistribution[]
  institutionStats: InstitutionStats[]
}

export interface InstitutionData {
  name: string
  userCount: number
  bookingCount: number
  approvedBookingCount: number
  color: string
}

export interface UserData {
  id: string
  name: string
  email: string
  institution: string
  avatar?: string
  bookingCount: number
  approvedBookingCount: number
  lastBookingDate?: string
  registrationDate: string
}

export interface RegistrationTrend {
  period: string
  total: number
  approved: number
  pending: number
  rejected: number
}

export interface BookingDistribution {
  range: string
  count: number
  percentage: number
}

export interface InstitutionStats {
  institution: string
  totalBookings: number
  approvedBookings: number
  totalUsers: number
  avgBookingsPerUser: number
}

/**
 * Aggregate user analytics data from bookings and users
 */
export function aggregateUserAnalytics(
  bookings: any[],
  users: any[],
  dateFilter?: { from?: Date; to?: Date }
): UserAnalytics {
  // Apply date filter if provided
  const filteredBookings = dateFilter?.from && dateFilter?.to
    ? bookings.filter(booking => {
        const bookingDate = parseISO(booking.created_at)
        return isWithinInterval(bookingDate, { start: dateFilter.from!, end: dateFilter.to! })
      })
    : bookings

  // Create user lookup map
  const userMap = new Map(users.map(user => [user.id, user]))

  // Aggregate user booking data
  const userBookingData = new Map()

  filteredBookings.forEach(booking => {
    const userId = booking.user_id
    if (!userBookingData.has(userId)) {
      const user = userMap.get(userId)
      userBookingData.set(userId, {
        id: userId,
        name: user?.full_name || 'Unknown',
        email: user?.email || 'Unknown',
        institution: user?.institution || 'Unknown',
        avatar: user?.profile_photo,
        bookingCount: 0,
        approvedBookingCount: 0,
        lastBookingDate: booking.created_at,
        registrationDate: user?.created_at || booking.created_at
      })
    }

    const userData = userBookingData.get(userId)
    userData.bookingCount += 1

    if (booking.status === 'approved') {
      userData.approvedBookingCount += 1
    }

    // Update last booking date
    if (new Date(booking.created_at) > new Date(userData.lastBookingDate)) {
      userData.lastBookingDate = booking.created_at
    }
  })

  // Convert to array and sort by booking count
  const topUsers = Array.from(userBookingData.values())
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 50) // Top 50 users

  // Aggregate institution data
  const institutionMap = new Map()

  topUsers.forEach(user => {
    const institution = user.institution || 'Unknown'
    if (!institutionMap.has(institution)) {
      institutionMap.set(institution, {
        name: institution,
        userCount: 0,
        bookingCount: 0,
        approvedBookingCount: 0,
        color: getInstitutionColor(institution)
      })
    }

    const instData = institutionMap.get(institution)
    instData.userCount += 1
    instData.bookingCount += user.bookingCount
    instData.approvedBookingCount += user.approvedBookingCount
  })

  const topInstitutions = Array.from(institutionMap.values())
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 20) // Top 20 institutions

  // Calculate user registration trends
  const userRegistrationTrend = calculateUserRegistrationTrend(users, filteredBookings)

  // Calculate booking distribution
  const bookingDistribution = calculateBookingDistribution(topUsers)

  // Calculate institution statistics
  const institutionStats = calculateInstitutionStats(institutionMap, topUsers)

  return {
    totalUsers: users.length,
    activeUsers: userBookingData.size,
    newUsersThisMonth: calculateNewUsersThisMonth(users),
    topInstitutions,
    topUsers,
    userRegistrationTrend,
    bookingDistribution,
    institutionStats
  }
}

/**
 * Calculate user registration trends by month
 */
function calculateUserRegistrationTrend(users: any[], bookings: any[]): RegistrationTrend[] {
  const monthlyData = new Map()

  // Process user registrations
  users.forEach(user => {
    const date = parseISO(user.created_at)
    const monthKey = format(date, 'yyyy-MM')

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      })
    }

    monthlyData.get(monthKey).total += 1
  })

  // Process booking statuses for each month
  bookings.forEach(booking => {
    const date = parseISO(booking.created_at)
    const monthKey = format(date, 'yyyy-MM')

    if (monthlyData.has(monthKey)) {
      const data = monthlyData.get(monthKey)
      switch (booking.status) {
        case 'approved':
          data.approved += 1
          break
        case 'pending':
          data.pending += 1
          break
        case 'rejected':
          data.rejected += 1
          break
      }
    }
  })

  return Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      period: format(parseISO(month + '-01'), 'MMM yyyy'),
      ...data
    }))
}

/**
 * Calculate booking distribution (histogram)
 */
function calculateBookingDistribution(users: UserData[]): BookingDistribution[] {
  const bookingCounts = users.map(user => user.bookingCount)
  const maxBookings = Math.max(...bookingCounts, 1)

  // Create ranges (0, 1-5, 6-10, 11-20, 21-50, 50+)
  const ranges = [
    { min: 0, max: 0, label: '0 bookings' },
    { min: 1, max: 5, label: '1-5 bookings' },
    { min: 6, max: 10, label: '6-10 bookings' },
    { min: 11, max: 20, label: '11-20 bookings' },
    { min: 21, max: 50, label: '21-50 bookings' },
    { min: 51, max: Infinity, label: '50+ bookings' }
  ]

  const distribution = ranges.map(range => {
    const count = users.filter(user =>
      user.bookingCount >= range.min && user.bookingCount <= range.max
    ).length

    return {
      range: range.label,
      count,
      percentage: users.length > 0 ? Math.round((count / users.length) * 100) : 0
    }
  })

  return distribution
}

/**
 * Calculate institution statistics
 */
function calculateInstitutionStats(
  institutionMap: Map<string, any>,
  users: UserData[]
): InstitutionStats[] {
  return Array.from(institutionMap.entries()).map(([name, data]) => {
    const institutionUsers = users.filter(user => user.institution === name)
    const avgBookingsPerUser = institutionUsers.length > 0
      ? institutionUsers.reduce((sum, user) => sum + user.bookingCount, 0) / institutionUsers.length
      : 0

    return {
      institution: name,
      totalBookings: data.bookingCount,
      approvedBookings: data.approvedBookingCount,
      totalUsers: data.userCount,
      avgBookingsPerUser: Math.round(avgBookingsPerUser * 10) / 10
    }
  }).sort((a, b) => b.totalBookings - a.totalBookings)
}

/**
 * Calculate new users this month
 */
function calculateNewUsersThisMonth(users: any[]): number {
  const now = new Date()
  const startOfThisMonth = startOfMonth(now)
  const endOfThisMonth = endOfMonth(now)

  return users.filter(user => {
    const registrationDate = parseISO(user.created_at)
    return isWithinInterval(registrationDate, { start: startOfThisMonth, end: endOfThisMonth })
  }).length
}

/**
 * Get color for institution (for charts)
 */
function getInstitutionColor(institution: string): string {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(168, 85, 247, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(234, 179, 8, 0.8)',    // Yellow
    'rgba(124, 58, 237, 0.8)',   // Violet
    'rgba(244, 63, 94, 0.8)',    // Rose
  ]

  // Simple hash function to get consistent color for same institution
  let hash = 0
  for (let i = 0; i < institution.length; i++) {
    hash = ((hash << 5) - hash + institution.charCodeAt(i)) & 0xffffffff
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Get user avatar initials
 */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Format user registration data for daily view
 */
export function getDailyUserRegistrations(
  users: any[],
  bookings: any[],
  dateFilter?: { from?: Date; to?: Date }
): { labels: string[], datasets: any[] } {
  const filteredUsers = dateFilter?.from && dateFilter?.to
    ? users.filter(user => {
        const regDate = parseISO(user.created_at)
        return isWithinInterval(regDate, { start: dateFilter.from!, end: dateFilter.to! })
      })
    : users

  const dailyData = new Map()

  filteredUsers.forEach(user => {
    const date = parseISO(user.created_at)
    const dayKey = format(date, 'yyyy-MM-dd')

    if (!dailyData.has(dayKey)) {
      dailyData.set(dayKey, {
        total: 0,
        withBookings: 0
      })
    }

    dailyData.get(dayKey).total += 1
  })

  // Add booking data for users who registered and made bookings on the same day
  bookings.forEach(booking => {
    const bookingDate = parseISO(booking.created_at)
    const userRegDate = users.find(u => u.id === booking.user_id)?.created_at
    if (userRegDate) {
      const regDate = parseISO(userRegDate)
      const dayKey = format(regDate, 'yyyy-MM-dd')

      if (format(bookingDate, 'yyyy-MM-dd') === dayKey && dailyData.has(dayKey)) {
        dailyData.get(dayKey).withBookings += 1
      }
    }
  })

  const sortedDays = Array.from(dailyData.keys()).sort()

  return {
    labels: sortedDays.map(day => format(parseISO(day), 'dd/MM')),
    datasets: [
      {
        label: 'Total Registrations',
        data: sortedDays.map(day => dailyData.get(day).total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'With Bookings',
        data: sortedDays.map(day => dailyData.get(day).withBookings),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4
      }
    ]
  }
}