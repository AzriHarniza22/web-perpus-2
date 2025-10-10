'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, MapPin, Clock, BarChart3, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Booking, Room, Tour, User } from '@/lib/types'

interface GeneralOverviewCardsProps {
  bookings: Booking[]
  rooms: Room[]
  tours: Tour[]
  users: User[]
  isLoading?: boolean
}

interface StatCard {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
}

export function GeneralOverviewCards({
  bookings,
  rooms,
  tours,
  users,
  isLoading = false
}: GeneralOverviewCardsProps) {
  const [animatedValues, setAnimatedValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    totalRooms: number
    totalTours: number
    totalUsers: number
    approvalRate: number
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    totalRooms: 0,
    totalTours: 0,
    totalUsers: 0,
    approvalRate: 0
  })
  const [prevValues, setPrevValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    totalRooms: number
    totalTours: number
    totalUsers: number
    approvalRate: number
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    totalRooms: 0,
    totalTours: 0,
    totalUsers: 0,
    approvalRate: 0
  })

  // Animate numbers on change
  useEffect(() => {
    // Debug logging for guest count calculation
    console.log('=== GUEST COUNT DEBUG ===')
    console.log('Total bookings:', bookings.length)

    // Analyze bookings by status
    const statusBreakdown = {
      pending: bookings.filter((b: Booking) => b.status === 'pending').length,
      approved: bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').length,
      rejected: bookings.filter((b: Booking) => b.status === 'rejected').length,
      completed: bookings.filter((b: Booking) => b.status === 'completed').length,
      cancelled: bookings.filter((b: Booking) => b.status === 'cancelled').length,
    }
    console.log('Status breakdown:', statusBreakdown)

    // Analyze guest counts by status
    const guestBreakdown = {
      pending: bookings.filter((b: Booking) => b.status === 'pending').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
      approved: bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
      rejected: bookings.filter((b: Booking) => b.status === 'rejected').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
      completed: bookings.filter((b: Booking) => b.status === 'completed').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
      cancelled: bookings.filter((b: Booking) => b.status === 'cancelled').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
    }
    console.log('Guest count by status:', guestBreakdown)

    // Show bookings with null guest_count
    const nullGuestCount = bookings.filter((b: Booking) => b.guest_count === null || b.guest_count === undefined)
    console.log('Bookings with null/undefined guest_count:', nullGuestCount.length)
    if (nullGuestCount.length > 0) {
      console.log('Sample bookings with null guest_count:', nullGuestCount.slice(0, 3).map(b => ({ id: b.id, status: b.status, guest_count: b.guest_count })))
    }

    // Current calculation (approved and completed bookings only)
    const currentTotalTours = bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    console.log('Current calculation (approved only):', currentTotalTours)

    // Proposed calculation (approved + completed)
    const proposedTotalTours = bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    console.log('Proposed calculation (approved + completed):', proposedTotalTours)

    // All bookings calculation
    const allBookingsTotal = bookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
    console.log('All bookings total:', allBookingsTotal)

    // Calculate stats inside useEffect to avoid recreating on every render
    const currentStats = {
      totalBookings: bookings.length,
      approvedBookings: statusBreakdown.approved,
      pendingBookings: statusBreakdown.pending,
      rejectedBookings: statusBreakdown.rejected,
      totalRooms: rooms.length,
      totalTours: currentTotalTours, // Keep current calculation for now
      totalUsers: users.length,
      approvalRate: bookings.length > 0 ? Math.round((statusBreakdown.approved / bookings.length) * 100) : 0
    }

    const currentValues = {
      totalBookings: currentStats.totalBookings,
      approvedBookings: currentStats.approvedBookings,
      pendingBookings: currentStats.pendingBookings,
      rejectedBookings: currentStats.rejectedBookings,
      totalRooms: currentStats.totalRooms,
      totalTours: currentStats.totalTours,
      totalUsers: currentStats.totalUsers,
      approvalRate: currentStats.approvalRate
    }

    // Check if values changed
    const hasChanged =
      prevValues.totalBookings !== currentValues.totalBookings ||
      prevValues.approvedBookings !== currentValues.approvedBookings ||
      prevValues.pendingBookings !== currentValues.pendingBookings ||
      prevValues.rejectedBookings !== currentValues.rejectedBookings ||
      prevValues.totalRooms !== currentValues.totalRooms ||
      prevValues.totalTours !== currentValues.totalTours ||
      prevValues.totalUsers !== currentValues.totalUsers ||
      prevValues.approvalRate !== currentValues.approvalRate

    if (hasChanged) {
      setPrevValues(currentValues)

      // Animate each value
      const animateValue = (
        key: keyof typeof currentValues,
        targetValue: number,
        startValue: number
      ) => {
        const duration = 1000 // 1 second
        const steps = 60
        const increment = (targetValue - startValue) / steps
        let currentStep = 0

        const animate = () => {
          currentStep++
          const progress = currentStep / steps
          const easeOutQuart = 1 - Math.pow(1 - progress, 4)
          const currentValue = Math.round(startValue + (increment * currentStep * easeOutQuart))

          setAnimatedValues(prev => ({
            ...prev,
            [key]: Math.min(currentValue, targetValue)
          }))

          if (currentStep < steps) {
            requestAnimationFrame(animate)
          } else {
            setAnimatedValues(prev => ({
              ...prev,
              [key]: targetValue
            }))
          }
        }

        requestAnimationFrame(animate)
      }

      animateValue('totalBookings', currentValues.totalBookings, animatedValues.totalBookings)
      animateValue('approvedBookings', currentValues.approvedBookings, animatedValues.approvedBookings)
      animateValue('pendingBookings', currentValues.pendingBookings, animatedValues.pendingBookings)
      animateValue('rejectedBookings', currentValues.rejectedBookings, animatedValues.rejectedBookings)
      animateValue('totalRooms', currentValues.totalRooms, animatedValues.totalRooms)
      animateValue('totalTours', currentValues.totalTours, animatedValues.totalTours)
      animateValue('totalUsers', currentValues.totalUsers, animatedValues.totalUsers)
      animateValue('approvalRate', currentValues.approvalRate, animatedValues.approvalRate)
   }
 }, [bookings, rooms, tours, users, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Reservasi',
      value: animatedValues.totalBookings,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary-100 dark:bg-primary-900/50',
      change: 12,
      changeType: 'increase'
    },
    {
      label: 'Disetujui',
      value: animatedValues.approvedBookings,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      change: 8,
      changeType: 'increase'
    },
    {
      label: 'Menunggu',
      value: animatedValues.pendingBookings,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      change: -3,
      changeType: 'decrease'
    },
    {
      label: 'Ditolak',
      value: animatedValues.rejectedBookings,
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      change: 2,
      changeType: 'increase'
    },
    {
      label: 'Total Ruangan',
      value: animatedValues.totalRooms,
      icon: Building,
      color: 'text-secondary',
      bgColor: 'bg-secondary-100 dark:bg-secondary-900/50'
    },
    {
      label: 'Total Tamu',
      value: animatedValues.totalTours,
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/50'
    },
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/50'
    },
    {
      label: 'Tingkat Persetujuan',
      value: animatedValues.approvalRate,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
      change: 5,
      changeType: 'increase'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="bg-card backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="bg-card backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.label.includes('Tingkat') ? `${stat.value}%` : stat.value}
                    </p>
                    {stat.change !== undefined && stat.changeType && (
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        stat.changeType === 'increase'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : stat.changeType === 'decrease'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${stat.changeType === 'decrease' ? 'rotate-180' : ''}`} />
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}