/**
 * Room Analytics Utilities
 * Common data aggregation functions for room-specific analytics
 */

export interface RoomBooking {
  id: string
  room_id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected'
  guest_count?: number
  event_description?: string
  notes?: string
  created_at: string
  is_tour?: boolean
  rooms?: {
    id: string
    name: string
    capacity: number
  }
  profiles?: {
    full_name?: string
    email?: string
    institution?: string
  }
}

export interface RoomData {
  id: string
  name: string
  capacity: number
}

export interface RoomAnalytics {
  totalBookings: number
  approvedBookings: number
  pendingBookings: number
  rejectedBookings: number
  totalGuests: number
  averageDuration: number
  utilizationRate: number
  peakHour: string
}

/**
 * Filter bookings to exclude tour bookings (is_tour=false)
 */
export function filterBookingsByRoom(bookings: RoomBooking[], roomId: string | null): RoomBooking[] {
  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  if (!roomId || roomId === 'all') return roomBookings
  return roomBookings.filter(booking => booking.room_id === roomId)
}

/**
 * Calculate room analytics from bookings
 */
export function calculateRoomAnalytics(bookings: RoomBooking[], rooms: RoomData[]): Map<string, RoomAnalytics> {
  const analyticsMap = new Map<string, RoomAnalytics>()

  // Initialize with all rooms
  rooms.forEach(room => {
    analyticsMap.set(room.id, {
      totalBookings: 0,
      approvedBookings: 0,
      pendingBookings: 0,
      rejectedBookings: 0,
      totalGuests: 0,
      averageDuration: 0,
      utilizationRate: 0,
      peakHour: '0'
    })
  })

  // Process bookings
  bookings.forEach(booking => {
    const roomId = booking.room_id
    const analytics = analyticsMap.get(roomId)

    if (!analytics) return

    // Update booking counts
    analytics.totalBookings += 1

    switch (booking.status) {
      case 'approved':
        analytics.approvedBookings += 1
        break
      case 'pending':
        analytics.pendingBookings += 1
        break
      case 'rejected':
        analytics.rejectedBookings += 1
        break
    }

    // Update guest count
    analytics.totalGuests += booking.guest_count || 0
  })

  // Calculate derived metrics for each room
  analyticsMap.forEach((analytics, roomId) => {
    const roomBookings = bookings.filter(b => b.room_id === roomId)
    const room = rooms.find(r => r.id === roomId)

    // Calculate average duration
    const totalDuration = roomBookings.reduce((sum, booking) => {
      if (booking.start_time && booking.end_time) {
        const start = new Date(booking.start_time).getTime()
        const end = new Date(booking.end_time).getTime()
        const duration = (end - start) / (1000 * 60 * 60) // Convert to hours
        return sum + (duration > 0 && duration <= 24 ? duration : 0)
      }
      return sum
    }, 0)

    analytics.averageDuration = roomBookings.length > 0
      ? Math.round((totalDuration / roomBookings.length) * 10) / 10
      : 0

    // Calculate utilization rate
    analytics.utilizationRate = room && room.capacity > 0
      ? Math.round((analytics.totalBookings / room.capacity) * 100)
      : 0

    // Calculate peak hour
    const hourCounts = new Map<number, number>()
    roomBookings.forEach(booking => {
      if (booking.start_time) {
        const hour = new Date(booking.start_time).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    })

    let peakHour = 0
    let maxCount = 0
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count
        peakHour = hour
      }
    })

    analytics.peakHour = `${peakHour}:00`
  })

  return analyticsMap
}

/**
 * Get monthly booking data for a specific room
 */
export function getMonthlyRoomData(bookings: RoomBooking[]) {
  const monthlyData = new Map<string, { total: number; approved: number; pending: number; rejected: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    const date = new Date(booking.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total: 0, approved: 0, pending: 0, rejected: 0 })
    }

    const data = monthlyData.get(monthKey)!
    data.total += 1

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
  })

  return monthlyData
}

/**
 * Get daily booking data for a specific room
 */
export function getDailyRoomData(bookings: RoomBooking[]) {
  const dailyData = new Map<string, { total: number; approved: number; pending: number; rejected: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    const date = new Date(booking.created_at)
    const dayKey = date.toISOString().split('T')[0]

    if (!dailyData.has(dayKey)) {
      dailyData.set(dayKey, { total: 0, approved: 0, pending: 0, rejected: 0 })
    }

    const data = dailyData.get(dayKey)!
    data.total += 1

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
  })

  return dailyData
}

/**
 * Get guest distribution by room
 */
export function getGuestDistributionByRoom(bookings: RoomBooking[]) {
  const roomGuestData = new Map<string, { name: string; totalGuests: number; bookingCount: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    const roomId = booking.room_id
    const roomName = booking.rooms?.name || 'Unknown Room'
    const guestCount = booking.guest_count || 0

    if (!roomGuestData.has(roomId)) {
      roomGuestData.set(roomId, { name: roomName, totalGuests: 0, bookingCount: 0 })
    }

    const data = roomGuestData.get(roomId)!
    data.totalGuests += guestCount
    data.bookingCount += 1
  })

  return Array.from(roomGuestData.values())
    .filter(room => room.bookingCount > 0)
    .map(room => ({
      ...room,
      averageGuests: Math.round((room.totalGuests / room.bookingCount) * 10) / 10
    }))
    .sort((a, b) => b.averageGuests - a.averageGuests)
    .slice(0, 10)
}

/**
 * Get time heatmap data for rooms
 */
export function getRoomTimeHeatmapData(bookings: RoomBooking[]) {
  const timeData = new Map<string, { hour: number; day: string; count: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    if (booking.start_time) {
      const date = new Date(booking.start_time)
      const hour = date.getHours()
      const dayOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()]

      const key = `${hour}-${dayOfWeek}`

      if (!timeData.has(key)) {
        timeData.set(key, { hour, day: dayOfWeek, count: 0 })
      }

      timeData.get(key)!.count += 1
    }
  })

  const data = Array.from(timeData.values())

  // Calculate intensity (0-100)
  const maxCount = Math.max(...data.map(d => d.count), 1)
  return data.map(d => ({
    ...d,
    intensity: Math.round((d.count / maxCount) * 100)
  }))
}

/**
 * Get average reservation duration by room
 */
export function getAverageReservationDurationByRoom(bookings: RoomBooking[]) {
  const roomDurationData = new Map<string, { name: string; totalDuration: number; bookingCount: number; capacity: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    const roomId = booking.room_id
    const roomName = booking.rooms?.name || 'Unknown Room'

    if (!roomDurationData.has(roomId)) {
      roomDurationData.set(roomId, {
        name: roomName,
        totalDuration: 0,
        bookingCount: 0,
        capacity: booking.rooms?.capacity || 0
      })
    }

    const data = roomDurationData.get(roomId)!

    // Calculate duration in hours
    if (booking.start_time && booking.end_time) {
      const start = new Date(booking.start_time).getTime()
      const end = new Date(booking.end_time).getTime()
      const duration = (end - start) / (1000 * 60 * 60) // Convert to hours

      if (duration > 0 && duration <= 24) { // Filter out invalid durations
        data.totalDuration += duration
        data.bookingCount += 1
      }
    }
  })

  return Array.from(roomDurationData.values())
    .filter(room => room.bookingCount > 0)
    .map(room => ({
      ...room,
      averageDuration: Math.round((room.totalDuration / room.bookingCount) * 10) / 10,
      utilizationRate: room.capacity > 0 ? Math.round((room.totalDuration / (room.bookingCount * room.capacity)) * 100) : 0
    }))
    .sort((a, b) => b.averageDuration - a.averageDuration)
    .slice(0, 10)
}

/**
 * Get average guests by room
 */
export function getAverageGuestsByRoom(bookings: RoomBooking[]) {
  const roomGuestData = new Map<string, { name: string; totalGuests: number; bookingCount: number; capacity: number }>()

  // Filter out tour bookings, keeping only room bookings (is_tour=false or undefined)
  const roomBookings = bookings.filter(booking => booking.is_tour !== true)

  roomBookings.forEach(booking => {
    const roomId = booking.room_id
    const roomName = booking.rooms?.name || 'Unknown Room'
    const guestCount = booking.guest_count || 0

    if (!roomGuestData.has(roomId)) {
      roomGuestData.set(roomId, {
        name: roomName,
        totalGuests: 0,
        bookingCount: 0,
        capacity: booking.rooms?.capacity || 0
      })
    }

    const data = roomGuestData.get(roomId)!
    data.totalGuests += guestCount
    data.bookingCount += 1
  })

  return Array.from(roomGuestData.values())
    .filter(room => room.bookingCount > 0)
    .map(room => ({
      ...room,
      averageGuests: Math.round((room.totalGuests / room.bookingCount) * 10) / 10,
      utilizationRate: room.capacity > 0 ? Math.round((room.totalGuests / (room.bookingCount * room.capacity)) * 100) : 0
    }))
    .sort((a, b) => b.averageGuests - a.averageGuests)
    .slice(0, 10)
}

/**
 * Export room analytics data for CSV/PDF
 */
export function exportRoomAnalyticsData(
  bookings: RoomBooking[],
  rooms: RoomData[],
  selectedRoom?: string | null
) {
  const filteredBookings = filterBookingsByRoom(bookings, selectedRoom || null)
  const analyticsMap = calculateRoomAnalytics(filteredBookings, rooms)

  return {
    bookings: filteredBookings,
    analytics: Array.from(analyticsMap.entries()).map(([roomId, analytics]) => ({
      roomId,
      roomName: rooms.find(r => r.id === roomId)?.name || 'Unknown',
      ...analytics
    })),
    summary: {
      totalRooms: rooms.length,
      totalBookings: filteredBookings.length,
      averageUtilization: rooms.length > 0
        ? Math.round(Array.from(analyticsMap.values()).reduce((sum, a) => sum + a.utilizationRate, 0) / rooms.length)
        : 0
    }
  }
}