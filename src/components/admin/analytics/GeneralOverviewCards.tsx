'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, MapPin, Clock, BookOpen, CheckCircle, XCircle, Percent, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Booking, Room, Tour, User } from '@/lib/types'
import { useInViewAnimation, useHoverAnimation, useStaggerAnimation } from '@/hooks/useAnimations'

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
}

export function GeneralOverviewCards({
  bookings,
  rooms,
  tours,
  users,
  isLoading = false
}: GeneralOverviewCardsProps) {
  const staggerAnimation = useStaggerAnimation({ staggerDelay: 0.1, itemDelay: 0.2 })
  const hoverAnimation = useHoverAnimation()
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
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Disetujui',
      value: animatedValues.approvedBookings,
      icon: CheckCircle,
      color: 'text-white',
      bgColor: 'bg-green-500'
    },
    {
      label: 'Menunggu',
      value: animatedValues.pendingBookings,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-yellow-500'
    },
    {
      label: 'Ditolak',
      value: animatedValues.rejectedBookings,
      icon: XCircle,
      color: 'text-white',
      bgColor: 'bg-red-500'
    },
    {
      label: 'Total Ruangan',
      value: animatedValues.totalRooms,
      icon: Building,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Total Tamu',
      value: animatedValues.totalTours,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Tingkat Persetujuan',
      value: animatedValues.approvalRate,
      icon: Percent,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    }
  ]

  if (isLoading) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <Card className="bg-card backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <motion.div
                      className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    />
                  </div>
                  <motion.div
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      {...staggerAnimation.container}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          {...staggerAnimation.item}
          {...hoverAnimation}
          className="group"
        >
          <Card className="bg-card backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <motion.p
                    className="text-sm font-medium text-gray-600 dark:text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                  >
                    {stat.label}
                  </motion.p>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.label.includes('Tingkat') ? `${stat.value}%` : stat.value}
                    </p>
                  </motion.div>
                </div>
                <motion.div
                  className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}