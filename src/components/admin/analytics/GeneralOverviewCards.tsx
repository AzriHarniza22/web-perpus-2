'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, MapPin, Clock, BookOpen, CheckCircle, XCircle, LucideIcon } from 'lucide-react'
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
  subtitle?: string
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
  
  // Fungsi untuk menghitung jam terpadat dari data booking
  const calculatePeakHours = (bookings: Booking[]): { peakHour: string; peakCount: number } => {
    if (!bookings.length) {
      return { peakHour: '-', peakCount: 0 }
    }

    // Hitung jumlah booking per jam
    const hourCounts: { [key: string]: number } = {}
    
    bookings.forEach(booking => {
      if (booking.start_time) {
        // Ekstrak jam dari start_time (format: "YYYY-MM-DD HH:mm:ss")
        const timeMatch = booking.start_time.match(/\d{4}-\d{2}-\d{2} (\d{2}):\d{2}:\d{2}/)
        if (timeMatch) {
          const hour = timeMatch[1]
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }
      }
    })

    // Cari jam dengan jumlah booking tertinggi
    let peakHour = '-'
    let peakCount = 0
    
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > peakCount) {
        peakCount = count
        peakHour = `${hour}:00`
      }
    })

    return { peakHour, peakCount }
  }

  const [animatedValues, setAnimatedValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    peakHour: string
    peakCount: number
    totalRooms: number
    totalTours: number
    totalUsers: number
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    peakHour: '-',
    peakCount: 0,
    totalRooms: 0,
    totalTours: 0,
    totalUsers: 0
  })
  const [prevValues, setPrevValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    peakHour: string
    peakCount: number
    totalRooms: number
    totalTours: number
    totalUsers: number
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    peakHour: '-',
    peakCount: 0,
    totalRooms: 0,
    totalTours: 0,
    totalUsers: 0
  })

  // Animate numbers on change
  useEffect(() => {
    // Calculate stats inside useEffect to avoid recreating on every render
    const currentStats = {
      totalBookings: bookings.filter((b: Booking) => b.status !== 'cancelled').length,
      approvedBookings: bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').length,
      pendingBookings: bookings.filter((b: Booking) => b.status === 'pending').length,
      rejectedBookings: bookings.filter((b: Booking) => b.status === 'rejected').length,
      totalRooms: rooms.length,
      totalTours: bookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').reduce((sum, booking) => sum + (booking.guest_count || 0), 0),
      totalUsers: users.length
    }

    // Hitung jam terpadat
    const peakHours = calculatePeakHours(bookings)

    const currentValues = {
      totalBookings: currentStats.totalBookings,
      approvedBookings: currentStats.approvedBookings,
      pendingBookings: currentStats.pendingBookings,
      rejectedBookings: currentStats.rejectedBookings,
      peakHour: peakHours.peakHour,
      peakCount: peakHours.peakCount,
      totalRooms: currentStats.totalRooms,
      totalTours: currentStats.totalTours,
      totalUsers: currentStats.totalUsers
    }

    // Check if values changed
    const hasChanged =
      prevValues.totalBookings !== currentValues.totalBookings ||
      prevValues.approvedBookings !== currentValues.approvedBookings ||
      prevValues.pendingBookings !== currentValues.pendingBookings ||
      prevValues.rejectedBookings !== currentValues.rejectedBookings ||
      prevValues.peakHour !== currentValues.peakHour ||
      prevValues.peakCount !== currentValues.peakCount ||
      prevValues.totalRooms !== currentValues.totalRooms ||
      prevValues.totalTours !== currentValues.totalTours ||
      prevValues.totalUsers !== currentValues.totalUsers

    if (hasChanged) {
      setPrevValues(currentValues)

      // Animate each numeric value
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

      // Animate numeric values
      animateValue('totalBookings', currentValues.totalBookings, animatedValues.totalBookings)
      animateValue('approvedBookings', currentValues.approvedBookings, animatedValues.approvedBookings)
      animateValue('pendingBookings', currentValues.pendingBookings, animatedValues.pendingBookings)
      animateValue('rejectedBookings', currentValues.rejectedBookings, animatedValues.rejectedBookings)
      animateValue('peakCount', currentValues.peakCount, animatedValues.peakCount)
      animateValue('totalRooms', currentValues.totalRooms, animatedValues.totalRooms)
      animateValue('totalTours', currentValues.totalTours, animatedValues.totalTours)
      animateValue('totalUsers', currentValues.totalUsers, animatedValues.totalUsers)

      // Update peak hour text immediately (no animation needed for text)
      setAnimatedValues(prev => ({
        ...prev,
        peakHour: currentValues.peakHour
      }))
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
      label: 'Total Tamu',
      value: animatedValues.totalTours,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'orang'
    },
    {
      label: 'Total Ruangan',
      value: animatedValues.totalRooms,
      icon: Building,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'orang'
    },
    {
      label: 'Jam Terpadat',
      value: animatedValues.peakCount,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-purple-500',
      subtitle: animatedValues.peakHour
    }
  ]

  if (isLoading) {
    return (
      <motion.div
        {...staggerAnimation.container}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            {...staggerAnimation.item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <Card className="bg-card backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <motion.div
                      className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
                    />
                    <div className="flex items-baseline gap-1">
                      <motion.div
                        className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 + index * 0.1 }}
                      />
                      <motion.div
                        className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 + index * 0.1 }}
                      />
                    </div>
                  </div>
                  <motion.div
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: index * 0.1 }}
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
    <div className="space-y-4">
      
      <motion.div
        {...staggerAnimation.container}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          {...staggerAnimation.item}
          className="group"
        >
          <Card className="bg-card backdrop-blur-sm">
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
                    className="flex items-baseline gap-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.subtitle}
                      </span>
                    )}
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
    </div>
  )
}