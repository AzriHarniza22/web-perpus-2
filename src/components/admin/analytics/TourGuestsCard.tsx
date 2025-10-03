'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isTourBooking } from '@/lib/tourAnalytics'

interface TourGuestsCardProps {
  bookings: any[]
  tours: any[]
  isLoading?: boolean
}

export function TourGuestsCard({
  bookings,
  tours,
  isLoading = false
}: TourGuestsCardProps) {
  // Filter tour bookings using the utility function
  const tourBookings = useMemo(() => {
    return bookings.filter(isTourBooking)
  }, [bookings])

  const guestStats = useMemo(() => {
    const totalParticipants = tourBookings.reduce((sum: number, booking: any) => {
       return sum + (booking.guest_count || 0)
     }, 0)

    const approvedParticipants = tourBookings
       .filter(booking => booking.status === 'approved')
       .reduce((sum: number, booking: any) => sum + (booking.guest_count || 0), 0)

     const pendingParticipants = tourBookings
       .filter(booking => booking.status === 'pending')
       .reduce((sum: number, booking: any) => sum + (booking.guest_count || 0), 0)

    const avgParticipantsPerBooking = tourBookings.length > 0
      ? Math.round((totalParticipants / tourBookings.length) * 10) / 10
      : 0

    // Calculate capacity utilization
    const totalCapacity = tours.reduce((sum: number, tour: any) => sum + (tour.capacity || 0), 0)
    const utilizationRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0

    return {
      totalParticipants,
      approvedParticipants,
      pendingParticipants,
      avgParticipantsPerBooking,
      utilizationRate,
      totalCapacity
    }
  }, [tourBookings, tours])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tour Guests Analytics
          </CardTitle>
          <CardDescription>Analisis peserta tour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tour Guests Analytics
        </CardTitle>
        <CardDescription>
          Analisis jumlah peserta dan kapasitas tour
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{guestStats.totalParticipants}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Peserta</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{guestStats.approvedParticipants}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peserta Disetujui</p>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.avgParticipantsPerBooking}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rata-rata per Booking</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.totalCapacity}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Kapasitas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {guestStats.utilizationRate}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Utilisasi</p>
            </motion.div>
          </div>

          {/* Utilization Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Kapasitas Terpakai</span>
              <span className="font-medium">{guestStats.utilizationRate}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${guestStats.utilizationRate}%` }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="bg-blue-600 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Breakdown Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Approved: {guestStats.approvedParticipants}
              </Badge>
              <Badge variant="outline" className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Pending: {guestStats.pendingParticipants}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}