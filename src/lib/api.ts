import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import useAuthStore from './authStore'

export interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
  description?: string
  photos?: string[]
  layout?: string
  is_active: boolean
}

export interface Booking {
  id: string
  user_id: string
  room_id: string
  start_time: string
  end_time: string
  status: string
  event_description?: string
  guest_count?: number
  proposal_file?: string
  notes?: string
  letter?: string
  created_at: string
  updated_at?: string
}

export interface BookingWithRelations extends Booking {
  profiles: {
    full_name: string
    email: string
    institution?: string
    role?: string
    profile_photo?: string
  }
  rooms: {
    name: string
    capacity?: number
    facilities?: string[]
  }
  guest_count?: number
}

export interface Profile {
  id: string
  email: string
  full_name: string
  institution?: string
  phone?: string
  role?: string
}

export interface Notification {
  id: string
  booking_id: string
  type: string
  recipient: string
  message: string
  status: string
  sent_at?: string
  created_at: string
}

export interface UserActivityBooking {
  user_id: string
  created_at: string
}

export interface ProfileActivity {
  created_at: string
}

export interface PeakHoursBooking {
  start_time: string
}

export interface CancellationBooking {
  status: string
  created_at: string
}

export interface RoomUtilizationRoom {
  id: string
  name: string
  capacity: number
}

export interface RoomUtilizationBooking {
  room_id: string
  start_time: string
  end_time: string
  status: string
}

// Fetch all bookings with profiles and rooms
export const useBookings = (filters?: {
  status?: string[]
  dateRange?: { start: string; end: string }
  roomIds?: string[]
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isTour?: boolean
}) => {
  const {
    status,
    dateRange,
    roomIds,
    search,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
    isTour
  } = filters || {}

  return useQuery<BookingWithRelations[]>({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query

      // Use regular bookings table for all bookings
      query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            institution,
            role,
            profile_photo
          ),
          rooms:room_id (
            name,
            capacity,
            facilities
          )
        `, { count: 'exact' })

      // Apply status filter
      if (status && status.length > 0) {
        query = query.in('status', status)
      }

      // Apply date range filter (on created_at)
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      // Apply room filter
      if (roomIds && roomIds.length > 0) {
        query = query.in('room_id', roomIds)
      }

      // Apply search filter
      if (search && search.trim()) {
        const searchTerm = search.trim()
        query = query.or(`event_description.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

// Fetch all bookings for calendar display (approved and pending, today and future only)
export const useCalendarBookings = () => {
  return useQuery<BookingWithRelations[]>({
    queryKey: ['calendarBookings'],
    queryFn: async () => {
      // Get current timestamp for filtering
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms:room_id (
            name
          )
        `)
        .in('status', ['approved', 'pending'])
        .gte('start_time', now)
        .order('start_time', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}

// Fetch bookings for a specific room
export const useRoomBookings = (roomId: string) => {
  return useQuery({
    queryKey: ['bookings', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('room_id', roomId)
        .order('start_time')

      if (error) throw error
      return data || []
    },
    enabled: !!roomId,
  })
}

// Update booking status
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update booking status')
      }

      const result = await response.json()
      return result.booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// Create booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id' | 'created_at' | 'user_id'>) => {
      console.log('Booking data:', bookingData)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)

      if (!response.ok) {
        const error = JSON.parse(responseText)
        throw new Error(error.error || 'Failed to create booking')
      }

      const result = JSON.parse(responseText)
      return result.booking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// Fetch all rooms
export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    },
  })
}

// Create or update room
export const useUpsertRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (roomData: Partial<Room> & { id?: string }) => {
      if (roomData.id) {
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', roomData.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

// Delete room
export const useDeleteRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

// Toggle room active status
export const useToggleRoomActive = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: !is_active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

// Fetch booking stats for reports
export const useBookingStats = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['bookingStats', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('status, created_at, room_id, start_time, end_time')

      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }

      const { data: bookingStats } = await query

      if (!bookingStats) return null

      type BookingStat = {
        status: string
        created_at: string
        room_id: string
        start_time: string
        end_time: string
      }

      type RoomStat = {
        id: string
        name: string
        capacity: number
      }

      const stats = bookingStats as BookingStat[]
      const totalBookings = stats.length
      const approvedBookings = stats.filter((b) => b.status === 'approved').length
      const pendingBookings = stats.filter((b) => b.status === 'pending').length
      const rejectedBookings = stats.filter((b) => b.status === 'rejected').length
      const cancelledBookings = stats.filter((b) => b.status === 'cancelled').length
      const completedBookings = stats.filter((b) => b.status === 'completed').length

      // Room stats with capacity
      const roomCount: { [key: string]: number } = {}
      const roomCapacity: { [key: string]: number } = {}
      const { data: rooms } = await supabase.from('rooms').select('id, name, capacity')
      const roomData = rooms as RoomStat[] | null
      stats.forEach((booking) => {
        const room = roomData?.find((r) => r.id === booking.room_id)
        const roomName = room?.name
        if (roomName) {
          roomCount[roomName] = (roomCount[roomName] || 0) + 1
          roomCapacity[roomName] = room.capacity
        }
      })
      const roomStats = Object.entries(roomCount).map(([room_name, booking_count]) => ({
        room_name,
        booking_count,
        capacity: roomCapacity[room_name] || 0
      }))

      // Monthly stats (last 12 months)
      const monthlyCount: { [key: string]: number } = {}
      const currentDate = new Date()
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
        monthlyCount[monthName] = 0
      }
      stats.forEach((booking) => {
        const date = new Date(booking.created_at)
        const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
        monthlyCount[monthName] = (monthlyCount[monthName] || 0) + 1
      })
      const monthlyStats = Object.entries(monthlyCount).map(([month, count]) => ({ month, count }))

      // Status distribution over time (last 6 months)
      const statusOverTime: { [key: string]: { [status: string]: number } } = {}
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
        statusOverTime[monthName] = { approved: 0, pending: 0, rejected: 0, cancelled: 0, completed: 0 }
      }
      stats.forEach((booking) => {
        const date = new Date(booking.created_at)
        const monthName = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
        if (statusOverTime[monthName]) {
          statusOverTime[monthName][booking.status as keyof typeof statusOverTime[string]] =
            (statusOverTime[monthName][booking.status as keyof typeof statusOverTime[string]] || 0) + 1
        }
      })
      const statusTrends = Object.entries(statusOverTime).map(([month, statuses]) => ({ month, ...statuses }))

      return {
        totalBookings,
        approvedBookings,
        pendingBookings,
        rejectedBookings,
        cancelledBookings,
        completedBookings,
        roomStats,
        monthlyStats,
        statusTrends,
      }
    },
  })
}

// Fetch user activity trends
export const useUserActivityTrends = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['userActivityTrends', dateRange],
    queryFn: async () => {
      // Fetch bookings within date range
      let bookingQuery = supabase
        .from('bookings')
        .select('user_id, created_at')

      if (dateRange) {
        bookingQuery = bookingQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }

      const { data: bookings } = await bookingQuery

      // Fetch profiles (registrations) within date range
      let profileQuery = supabase
        .from('profiles')
        .select('created_at')

      if (dateRange) {
        profileQuery = profileQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }

      const { data: profiles } = await profileQuery

      if (!bookings || !profiles) return []

      const typedBookings = bookings as UserActivityBooking[]
      const typedProfiles = profiles as ProfileActivity[]

      // Group by date
      const activityMap: { [date: string]: { activeUsers: Set<string>, bookings: number, newRegistrations: number } } = {}

      // Process bookings
      typedBookings.forEach(booking => {
        const date = new Date(booking.created_at).toISOString().split('T')[0]
        if (!activityMap[date]) {
          activityMap[date] = { activeUsers: new Set(), bookings: 0, newRegistrations: 0 }
        }
        activityMap[date].activeUsers.add(booking.user_id)
        activityMap[date].bookings++
      })

      // Process registrations
      typedProfiles.forEach(profile => {
        const date = new Date(profile.created_at).toISOString().split('T')[0]
        if (!activityMap[date]) {
          activityMap[date] = { activeUsers: new Set(), bookings: 0, newRegistrations: 0 }
        }
        activityMap[date].newRegistrations++
      })

      // Convert to array
      const trends = Object.entries(activityMap).map(([date, data]) => ({
        date,
        activeUsers: data.activeUsers.size,
        bookings: data.bookings,
        newRegistrations: data.newRegistrations
      })).sort((a, b) => a.date.localeCompare(b.date))

      return trends
    },
  })
}

// Fetch peak hours heatmap data
export const usePeakHoursData = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['peakHoursData', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('start_time')

      if (dateRange) {
        query = query.gte('start_time', dateRange.start).lte('start_time', dateRange.end)
      }

      const { data: bookings } = await query

      if (!bookings) return []

      const typedBookings = bookings as PeakHoursBooking[]

      // Group by day of week and hour
      const heatmap: { [day: number]: { [hour: number]: number } } = {}

      typedBookings.forEach(booking => {
        const date = new Date(booking.start_time)
        const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
        const hour = date.getHours()

        if (!heatmap[day]) heatmap[day] = {}
        heatmap[day][hour] = (heatmap[day][hour] || 0) + 1
      })

      // Convert to array format for heatmap
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const data = days.map((dayName, dayIndex) => ({
        day: dayName,
        hours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: heatmap[dayIndex]?.[hour] || 0
        }))
      }))

      return data
    },
  })
}

// Fetch cancellation trends over time
export const useCancellationTrends = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['cancellationTrends', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('status, created_at')

      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }

      const { data: bookings } = await query

      if (!bookings) return []

      const typedBookings = bookings as CancellationBooking[]

      // Group by month
      const trendsMap: { [month: string]: { cancellations: number, totalBookings: number } } = {}

      typedBookings.forEach(booking => {
        const date = new Date(booking.created_at)
        const month = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

        if (!trendsMap[month]) {
          trendsMap[month] = { cancellations: 0, totalBookings: 0 }
        }
        trendsMap[month].totalBookings++
        if (booking.status === 'cancelled') {
          trendsMap[month].cancellations++
        }
      })

      const trends = Object.entries(trendsMap).map(([month, data]) => ({
        month,
        cancellations: data.cancellations,
        totalBookings: data.totalBookings,
        cancellationRate: data.totalBookings > 0 ? (data.cancellations / data.totalBookings) * 100 : 0
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

      return trends
    },
  })
}

// Fetch room utilization gauges
export const useRoomUtilization = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['roomUtilization', dateRange],
    queryFn: async () => {
      // Fetch rooms
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, name, capacity')

      // Fetch bookings within date range
      let bookingQuery = supabase
        .from('bookings')
        .select('room_id, start_time, end_time, status')

      if (dateRange) {
        bookingQuery = bookingQuery.gte('start_time', dateRange.start).lte('end_time', dateRange.end)
      }

      const { data: bookings } = await bookingQuery

      if (!rooms || !bookings) return []

      const typedRooms = rooms as RoomUtilizationRoom[]
      const typedBookings = bookings as RoomUtilizationBooking[]

      // Calculate utilization for each room
      const utilization = typedRooms.map(room => {
        const roomBookings = typedBookings.filter(b => b.room_id === room.id && b.status === 'approved')
        const totalBookedHours = roomBookings.reduce((sum: number, booking) => {
          const start = new Date(booking.start_time)
          const end = new Date(booking.end_time)
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }, 0)

        // Calculate total available hours in the period
        const startDate = dateRange ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days if no range
        const endDate = dateRange ? new Date(dateRange.end) : new Date()
        const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

        const utilizationPercentage = totalHours > 0 ? (totalBookedHours / totalHours) * 100 : 0

        return {
          roomId: room.id,
          roomName: room.name,
          capacity: room.capacity,
          utilizationPercentage: Math.min(utilizationPercentage, 100) // Cap at 100%
        }
      })

      return utilization
    },
  })
}

// Fetch notification stats for reports
export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notificationStats'],
    queryFn: async () => {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('type, status, sent_at, created_at')

      if (!notifications) return null

      const notificationStats = notifications as Notification[]
      const totalNotifications = notificationStats.length
      const sentNotifications = notificationStats.filter((n) => n.status === 'sent').length
      const failedNotifications = notificationStats.filter((n) => n.status === 'failed').length
      const pendingNotifications = notificationStats.filter((n) => n.status === 'pending').length

      const emailNotifications = notificationStats.filter((n) => n.type === 'email').length
      const whatsappNotifications = notificationStats.filter((n) => n.type === 'whatsapp').length

      // Monthly notification stats
      const monthlyNotifications: { [key: string]: number } = {}
      const currentDate = new Date()
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
        monthlyNotifications[monthName] = 0
      }
      notificationStats.forEach((notification) => {
        const date = new Date(notification.created_at)
        const monthName = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
        monthlyNotifications[monthName] = (monthlyNotifications[monthName] || 0) + 1
      })
      const monthlyNotificationStats = Object.entries(monthlyNotifications).map(([month, count]) => ({ month, count }))

      return {
        totalNotifications,
        sentNotifications,
        failedNotifications,
        pendingNotifications,
        emailNotifications,
        whatsappNotifications,
        monthlyNotificationStats,
      }
    },
  })
}
