import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import useAuthStore from './authStore'
import { sendBookingConfirmation, sendBookingStatusUpdate } from './notifications'

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
  proposal_file?: string
  notes?: string
  created_at: string
}

export interface BookingWithRelations extends Booking {
  profiles: {
    full_name: string
    email: string
    institution?: string
    role?: string
  }
  rooms: {
    name: string
    capacity?: number
    facilities?: string[]
  }
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

// Fetch all bookings with profiles and rooms
export const useBookings = () => {
  return useQuery<BookingWithRelations[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            institution,
            role
          ),
          rooms:room_id (
            name,
            capacity,
            facilities
          )
        `)
        .order('created_at', { ascending: false })

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
      // Get start of today in local timezone
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISOString = today.toISOString()

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms:room_id (
            name
          )
        `)
        .in('status', ['approved', 'pending'])
        .gte('start_time', todayISOString)
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
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      await sendBookingStatusUpdate(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// Create booking
export const useCreateBooking = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id' | 'created_at' | 'user_id'> & { proposalFile?: File }) => {
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
            institution: user.user_metadata?.institution || '',
            phone: user.user_metadata?.phone || '',
          })

        if (profileError) throw profileError
      }

      let proposalFileUrl: string | null = null
      if (bookingData.proposalFile) {
        const fileExt = bookingData.proposalFile.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('proposals')
          .upload(fileName, bookingData.proposalFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('proposals')
          .getPublicUrl(fileName)

        proposalFileUrl = publicUrl
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          user_id: user.id,
          proposal_file: proposalFileUrl,
        })
        .select()
        .single()

      if (error) throw error

      await sendBookingConfirmation(data.id)
      return data
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
export const useBookingStats = () => {
  return useQuery({
    queryKey: ['bookingStats'],
    queryFn: async () => {
      const { data: bookingStats } = await supabase
        .from('bookings')
        .select('status, created_at, room_id, start_time, end_time')

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
