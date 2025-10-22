'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Building,
  BookOpen,
  TrendingUp,
  Clock,
  LucideIcon,
  FileText,
  Sparkles,
  Activity,
  History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingWithRelations, Room } from '@/lib/api'

interface HistoryOverviewCardsProps {
  bookings: BookingWithRelations[]
  rooms: Room[]
  isLoading?: boolean
}

interface StatCard {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
}

export function HistoryOverviewCards({
  bookings,
  rooms,
  isLoading = false
}: HistoryOverviewCardsProps) {
  const [animatedValues, setAnimatedValues] = useState<{
    totalBookings: number
    completedBookings: number
    roomBookings: number
    tourBookings: number
    approvedBookings: number
    rejectedBookings: number
    cancelledBookings: number
    activeBookings: number
  }>({
    totalBookings: 0,
    completedBookings: 0,
    roomBookings: 0,
    tourBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    cancelledBookings: 0,
    activeBookings: 0
  })

  const [prevValues, setPrevValues] = useState<{
    totalBookings: number
    completedBookings: number
    roomBookings: number
    tourBookings: number
    approvedBookings: number
    rejectedBookings: number
    cancelledBookings: number
    activeBookings: number
  }>({
    totalBookings: 0,
    completedBookings: 0,
    roomBookings: 0,
    tourBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    cancelledBookings: 0,
    activeBookings: 0
  })

  // Animate numbers on change
  useEffect(() => {
    // Analyze bookings by status and type
    const statusBreakdown = {
      approved: bookings.filter((b) => b.status === 'approved').length,
      rejected: bookings.filter((b) => b.status === 'rejected').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }

    // Separate room vs tour bookings
    const roomBookings = bookings.filter((b) => !b.is_tour).length
    const tourBookings = bookings.filter((b) => !!b.is_tour).length

    // Active bookings (approved/completed that haven't ended yet)
    const now = new Date()
    const activeBookings = bookings.filter((b) =>
      (b.status === 'approved' || b.status === 'completed') &&
      new Date(b.end_time) > now
    ).length

    const currentValues = {
      totalBookings: bookings.length,
      completedBookings: statusBreakdown.completed,
      roomBookings,
      tourBookings,
      approvedBookings: statusBreakdown.approved,
      rejectedBookings: statusBreakdown.rejected,
      cancelledBookings: statusBreakdown.cancelled,
      activeBookings
    }

    // Check if values changed
    const hasChanged = Object.keys(currentValues).some(
      key => (prevValues as any)[key] !== (currentValues as any)[key]
    )

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

      Object.keys(currentValues).forEach(key => {
        const k = key as keyof typeof currentValues
        animateValue(k, currentValues[k], animatedValues[k])
      })
    }
  }, [bookings, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Reservasi',
      value: animatedValues.totalBookings,
      icon: History,
      color: 'text-white',
      bgColor: 'bg-primary'
    },
    {
      label: 'Reservasi Aktif',
      value: animatedValues.activeBookings,
      icon: Activity,
      color: 'text-white',
      bgColor: 'bg-emerald-500'
    },
    {
      label: 'Reservasi Ruangan',
      value: animatedValues.roomBookings,
      icon: Building,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Reservasi Tour',
      value: animatedValues.tourBookings,
      icon: Sparkles,
      color: 'text-white',
      bgColor: 'bg-secondary'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
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
          <Card className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    {stat.trend && stat.trend !== 'neutral' && (
                      <div className={`flex items-center text-xs px-1.5 py-0.5 rounded-full ${
                        stat.trend === 'up' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {stat.trend === 'up' ? '+' : '-'}{stat.change}%
                      </div>
                    )}
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
  )
}
