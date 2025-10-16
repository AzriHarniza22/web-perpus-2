'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, Clock, BookOpen, CheckCircle, XCircle, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Booking, Room } from '@/lib/types'

interface RoomOverviewCardsProps {
  bookings: Booking[]
  rooms: Room[]
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

export function RoomOverviewCards({
  bookings,
  rooms,
  isLoading = false
}: RoomOverviewCardsProps) {
  const [animatedValues, setAnimatedValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    totalGuests: number
    avgDuration: number
    avgGuestsPerBooking: number
    peakHour: string
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    totalGuests: 0,
    avgDuration: 0,
    avgGuestsPerBooking: 0,
    peakHour: '0'
  })

  const [prevValues, setPrevValues] = useState<{
    totalBookings: number
    approvedBookings: number
    pendingBookings: number
    rejectedBookings: number
    totalGuests: number
    avgDuration: number
    avgGuestsPerBooking: number
    peakHour: string
  }>({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    rejectedBookings: 0,
    totalGuests: 0,
    avgDuration: 0,
    avgGuestsPerBooking: 0,
    peakHour: '0'
  })

  // Filter room bookings (non-tour bookings)
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => booking.is_tour === false)
  }, [bookings])

  // Calculate room analytics
  const roomStats = useMemo(() => {
    const totalBookings = filteredBookings.length
    const approvedBookings = filteredBookings.filter((b: Booking) => b.status === 'approved' || b.status === 'completed').length
    const pendingBookings = filteredBookings.filter((b: Booking) => b.status === 'pending').length
    const rejectedBookings = filteredBookings.filter((b: Booking) => b.status === 'rejected').length

    // Calculate total guests
    const totalGuests = filteredBookings.reduce((sum: number, booking: Booking) => {
      return sum + (booking.guest_count || 0)
    }, 0)

    // Calculate average duration in hours
    const totalDuration = filteredBookings.reduce((sum: number, booking: Booking) => {
      if (booking.start_time && booking.end_time) {
        const start = new Date(booking.start_time).getTime()
        const end = new Date(booking.end_time).getTime()
        const duration = (end - start) / (1000 * 60 * 60) // Convert to hours
        return sum + duration
      }
      return sum
    }, 0)
    const avgDuration = totalBookings > 0 ? Math.round(totalDuration / totalBookings * 10) / 10 : 0

    // Calculate average guests per booking (whole number)
    const avgGuestsPerBooking = totalBookings > 0
      ? Math.round(totalGuests / totalBookings)
      : 0

    // Find peak hour
    const hourCounts = new Map()
    filteredBookings.forEach(booking => {
      if (booking.start_time) {
        const hour = new Date(booking.start_time).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    })
    let peakHour = '0'
    let maxCount = 0
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count
        peakHour = hour.toString()
      }
    })

    return {
      totalBookings,
      approvedBookings,
      pendingBookings,
      rejectedBookings,
      totalGuests,
      avgDuration,
      avgGuestsPerBooking,
      peakHour: peakHour + ':00'
    }
  }, [filteredBookings, rooms])

  // Animate numbers on change
  useEffect(() => {
    const currentValues = {
      totalBookings: roomStats.totalBookings,
      approvedBookings: roomStats.approvedBookings,
      pendingBookings: roomStats.pendingBookings,
      rejectedBookings: roomStats.rejectedBookings,
      totalGuests: roomStats.totalGuests,
      avgDuration: roomStats.avgDuration,
      avgGuestsPerBooking: roomStats.avgGuestsPerBooking,
      peakHour: roomStats.peakHour
    }

    // Check if values changed
    const hasChanged =
      prevValues.totalBookings !== currentValues.totalBookings ||
      prevValues.approvedBookings !== currentValues.approvedBookings ||
      prevValues.pendingBookings !== currentValues.pendingBookings ||
      prevValues.rejectedBookings !== currentValues.rejectedBookings ||
      prevValues.totalGuests !== currentValues.totalGuests ||
      prevValues.avgDuration !== currentValues.avgDuration ||
      prevValues.avgGuestsPerBooking !== currentValues.avgGuestsPerBooking ||
      prevValues.peakHour !== currentValues.peakHour

    if (hasChanged) {
      setPrevValues(currentValues)

      // Animate each value
      const animateValue = (
        key: keyof typeof currentValues,
        targetValue: number | string,
        startValue: number | string
      ) => {
        const duration = 1000 // 1 second
        const steps = 60
        const isNumber = typeof targetValue === 'number'

        if (isNumber && typeof startValue === 'number') {
          const increment = (Number(targetValue) - Number(startValue)) / steps
          let currentStep = 0

          const animate = () => {
            currentStep++
            const progress = currentStep / steps
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentValue = Math.round(Number(startValue) + (increment * currentStep * easeOutQuart))

            setAnimatedValues(prev => ({
              ...prev,
              [key]: Math.min(currentValue, Number(targetValue))
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
        } else {
          setAnimatedValues(prev => ({
            ...prev,
            [key]: targetValue
          }))
        }
      }

      animateValue('totalBookings', currentValues.totalBookings, animatedValues.totalBookings)
      animateValue('approvedBookings', currentValues.approvedBookings, animatedValues.approvedBookings)
      animateValue('pendingBookings', currentValues.pendingBookings, animatedValues.pendingBookings)
      animateValue('rejectedBookings', currentValues.rejectedBookings, animatedValues.rejectedBookings)
      animateValue('totalGuests', currentValues.totalGuests, animatedValues.totalGuests)
      animateValue('avgDuration', currentValues.avgDuration, animatedValues.avgDuration)
      animateValue('avgGuestsPerBooking', currentValues.avgGuestsPerBooking, animatedValues.avgGuestsPerBooking)
      animateValue('peakHour', currentValues.peakHour, animatedValues.peakHour)
    }
  }, [roomStats, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Reservasi',
      value: animatedValues.totalBookings || roomStats.totalBookings,
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Disetujui',
      value: animatedValues.approvedBookings || roomStats.approvedBookings,
      icon: CheckCircle,
      color: 'text-white',
      bgColor: 'bg-green-500'
    },
    {
      label: 'Menunggu',
      value: animatedValues.pendingBookings || roomStats.pendingBookings,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-yellow-500'
    },
    {
      label: 'Ditolak',
      value: animatedValues.rejectedBookings || roomStats.rejectedBookings,
      icon: XCircle,
      color: 'text-white',
      bgColor: 'bg-red-500'
    },
    {
      label: 'Total Tamu',
      value: animatedValues.totalGuests || roomStats.totalGuests,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'orang'
    },
    {
      label: 'Rata-rata Durasi',
      value: animatedValues.avgDuration || roomStats.avgDuration,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'jam'
    },
    {
      label: 'Rata-rata Tamu',
      value: animatedValues.avgGuestsPerBooking || roomStats.avgGuestsPerBooking,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'orang/booking'
    },
    {
      label: 'Jam Puncak',
      value: 0, // We'll handle this specially in the render
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-orange-500',
      subtitle: animatedValues.peakHour || roomStats.peakHour
    }
  ]

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-10 w-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Room Analytics Overview
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Statistik dan analisis penggunaan ruangan
            </p>
          </div>

        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.label.includes('Jam Puncak')
                            ? (stat.subtitle || 'N/A')
                            : `${stat.value}${stat.subtitle || ''}`}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-75 ease-out`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}