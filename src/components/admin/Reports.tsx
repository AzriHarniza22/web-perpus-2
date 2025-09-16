'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  totalBookings: number
  approvedBookings: number
  pendingBookings: number
  rejectedBookings: number
  roomStats: Array<{
    room_name: string
    booking_count: number
  }>
  monthlyStats: Array<{
    month: string
    count: number
  }>
}

export default function Reports() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get booking statistics
      const { data: bookingStats } = await supabase
        .from('bookings')
        .select('status')

      const totalBookings = bookingStats?.length || 0
      const approvedBookings = bookingStats?.filter((b: any) => b.status === 'approved').length || 0
      const pendingBookings = bookingStats?.filter((b: any) => b.status === 'pending').length || 0
      const rejectedBookings = bookingStats?.filter((b: any) => b.status === 'rejected').length || 0

      // Get room statistics
      const { data: roomStats } = await supabase
        .from('bookings')
        .select(`
          rooms:room_id (
            name
          )
        `)
        .not('status', 'eq', 'cancelled')

      const roomCount: { [key: string]: number } = {}
      roomStats?.forEach((booking: any) => {
        const roomName = booking.rooms?.name
        if (roomName) {
          roomCount[roomName] = (roomCount[roomName] || 0) + 1
        }
      })

      const roomStatsArray = Object.entries(roomCount).map(([room_name, booking_count]) => ({
        room_name,
        booking_count
      }))

      // Get monthly statistics (simplified)
      const currentYear = new Date().getFullYear()
      const monthlyCount: { [key: string]: number } = {}

      for (let i = 1; i <= 12; i++) {
        const monthName = new Date(currentYear, i - 1, 1).toLocaleString('id-ID', { month: 'long' })
        monthlyCount[monthName] = 0
      }

      bookingStats?.forEach((booking: any) => {
        const date = new Date() // In real app, use booking.created_at
        const monthName = date.toLocaleString('id-ID', { month: 'long' })
        monthlyCount[monthName] = (monthlyCount[monthName] || 0) + 1
      })

      const monthlyStats = Object.entries(monthlyCount).map(([month, count]) => ({
        month,
        count
      }))

      setStats({
        totalBookings,
        approvedBookings,
        pendingBookings,
        rejectedBookings,
        roomStats: roomStatsArray,
        monthlyStats
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!stats) {
    return <div>Error loading statistics</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan & Statistik</CardTitle>
        <CardDescription>Statistik penggunaan ruangan dan reservasi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Total Reservasi</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">Disetujui</h3>
            <p className="text-2xl font-bold text-green-600">{stats.approvedBookings}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900">Menunggu</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">Ditolak</h3>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedBookings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Statistik per Ruangan</h3>
            <div className="space-y-2">
              {stats.roomStats.map((room, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{room.room_name}</span>
                  <span className="font-semibold">{room.booking_count} reservasi</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Statistik Bulanan</h3>
            <div className="space-y-2">
              {stats.monthlyStats.slice(0, 6).map((month, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{month.month}</span>
                  <span className="font-semibold">{month.count} reservasi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}