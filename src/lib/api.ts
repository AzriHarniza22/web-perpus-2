import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
  description: string | null
  photos: string[] | null
  layout: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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
  is_tour?: boolean
  created_at: string
  updated_at?: string
  contact_name?: string | null
  contact_institution?: string | null
}

export interface BookingWithRelations extends Booking {
  profiles: {
    full_name: string
    email: string
    institution?: string
    phone?: string
    role?: string
    profile_photo?: string
  }
  rooms: {
    name: string
    capacity?: number
    facilities?: string[]
  }
  guest_count?: number
  contact_name?: string | null
  contact_institution?: string | null
}

export interface CursorPaginationResponse<T> {
  data: T[]
  totalCount: number
  nextCursor?: string
  prevCursor?: string
  hasNext: boolean
  hasPrev: boolean
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
  cursor?: string
  cursorDirection?: 'next' | 'prev'
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
    cursor,
    cursorDirection,
    isTour
  } = filters || {}

  return useQuery<{
    bookings: BookingWithRelations[]
    totalCount: number
    currentPage: number
    totalPages: number
    nextCursor?: string
    prevCursor?: string
    hasNext: boolean
    hasPrev: boolean
  }>({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams()
      if (status && status.length > 0) params.set('status', status.join(','))
      if (dateRange) {
        params.set('dateRangeStart', dateRange.start)
        params.set('dateRangeEnd', dateRange.end)
      }
      if (roomIds && roomIds.length > 0) params.set('roomIds', roomIds.join(','))
      if (search && search.trim()) params.set('search', search.trim())
      if (isTour !== undefined) params.set('isTour', isTour.toString())
      if (cursor) {
        params.set('cursor', cursor)
        params.set('cursorDirection', cursorDirection || 'next')
      } else {
        params.set('page', page.toString())
      }
      params.set('limit', limit.toString())
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const response = await fetch(`/api/bookings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', { status: response.status, text: errorText })
        console.log('Request URL:', `/api/bookings?${params.toString()}`)
        console.log('Request credentials:', 'include')
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.error || 'Failed to fetch bookings')
        } catch (parseError) {
          throw new Error(`API Error ${response.status}: ${errorText}`)
        }
      }

      const result = await response.json()
      console.log('API Response:', result)
      return {
        bookings: result.bookings || [],
        totalCount: result.totalCount || 0,
        currentPage: result.currentPage || 1,
        totalPages: result.totalPages || 1,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasNext: result.hasNext || false,
        hasPrev: result.hasPrev || false
      }
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
    onSuccess: (updatedBooking) => {
      // Selective invalidation: only invalidate queries that depend on booking status
      queryClient.invalidateQueries({
        queryKey: ['bookings'],
        refetchType: 'active', // Only refetch active queries
      })

      // Update specific booking in cache if we have the data
      if (updatedBooking) {
        queryClient.setQueryData(['bookings'], (oldData: any) => {
          if (!oldData?.bookings) return oldData
          return {
            ...oldData,
            bookings: oldData.bookings.map((booking: any) =>
              booking.id === updatedBooking.id ? { ...booking, ...updatedBooking } : booking
            )
          }
        })
      }

      // Invalidate related analytics queries that depend on booking status
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
      queryClient.invalidateQueries({ queryKey: ['calendarBookings'] })
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
    onSuccess: (newBooking) => {
      // Selective invalidation: only invalidate active booking queries
      queryClient.invalidateQueries({
        queryKey: ['bookings'],
        refetchType: 'active',
      })

      // Optimistically add the new booking to the cache
      if (newBooking) {
        queryClient.setQueryData(['bookings'], (oldData: any) => {
          if (!oldData?.bookings) return oldData
          return {
            ...oldData,
            bookings: [newBooking, ...oldData.bookings],
            totalCount: (oldData.totalCount || 0) + 1
          }
        })

        // Also update calendar bookings if it's a future booking
        const bookingDate = new Date(newBooking.start_time)
        const now = new Date()
        if (bookingDate >= now) {
          queryClient.invalidateQueries({ queryKey: ['calendarBookings'] })
        }
      }

      // Invalidate stats that depend on booking counts
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
    },
  })
}

// Fetch all rooms
export const useRooms = (filters?: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  cursor?: string
  cursorDirection?: 'next' | 'prev'
}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'name',
    sortOrder = 'asc',
    cursor,
    cursorDirection
  } = filters || {}

  return useQuery<Room[]>({
    queryKey: ['rooms', filters],
    queryFn: async () => {
      console.log('useRooms: Starting room fetch...')
      const params = new URLSearchParams()
      if (cursor) {
        params.set('cursor', cursor)
        params.set('cursorDirection', cursorDirection || 'next')
      } else {
        params.set('page', page.toString())
      }
      params.set('limit', limit.toString())
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      const response = await fetch(`/api/rooms?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      console.log('useRooms: Response status:', response.status)
      if (!response.ok) {
        const error = await response.json()
        console.error('useRooms: API error:', error)
        throw new Error(error.error || 'Failed to fetch rooms')
      }

      const result = await response.json()
      console.log('useRooms: Received rooms data:', result.rooms?.length || 0, 'rooms')
      console.log('useRooms: Rooms data:', result.rooms)
      return result.rooms || []
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
    onSuccess: (updatedRoom) => {
      // Selective invalidation for rooms
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
        refetchType: 'active',
      })

      // Optimistically update the rooms cache
      if (updatedRoom) {
        queryClient.setQueryData(['rooms'], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData
          const existingIndex = oldData.findIndex((room: Room) => room.id === updatedRoom.id)
          if (existingIndex >= 0) {
            // Update existing room
            const newData = [...oldData]
            newData[existingIndex] = { ...newData[existingIndex], ...updatedRoom }
            return newData
          } else {
            // Add new room
            return [...oldData, updatedRoom]
          }
        })
      }

      // Invalidate related queries that depend on room data
      queryClient.invalidateQueries({ queryKey: ['roomUtilization'] })
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
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
      return id // Return the deleted room ID
    },
    onSuccess: (deletedRoomId) => {
      // Selective invalidation for rooms
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
        refetchType: 'active',
      })

      // Optimistically remove the room from cache
      if (deletedRoomId) {
        queryClient.setQueryData(['rooms'], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData
          return oldData.filter((room: Room) => room.id !== deletedRoomId)
        })
      }

      // Invalidate related queries that depend on room data
      queryClient.invalidateQueries({ queryKey: ['roomUtilization'] })
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
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
      return { id, is_active: !is_active } // Return updated data
    },
    onSuccess: (updatedData) => {
      // Selective invalidation for rooms
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
        refetchType: 'active',
      })

      // Optimistically update the room's active status in cache
      if (updatedData) {
        queryClient.setQueryData(['rooms'], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData
          return oldData.map((room: Room) =>
            room.id === updatedData.id ? { ...room, is_active: updatedData.is_active } : room
          )
        })
      }

      // Invalidate related queries that depend on room availability
      queryClient.invalidateQueries({ queryKey: ['roomUtilization'] })
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
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
      const approvedBookings = stats.filter((b) => b.status === 'approved' || b.status === 'completed').length
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
        const roomBookings = typedBookings.filter(b => b.room_id === room.id && (b.status === 'approved' || b.status === 'completed'))
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
