'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Users, Building, BookOpen, TrendingUp, Calendar, LucideIcon, AlertTriangle, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Booking, Room } from '@/lib/types'
import { BookingWithRelations } from '@/lib/api'

interface ApprovalsOverviewCardsProps {
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

export function ApprovalsOverviewCards({
  bookings,
  rooms,
  isLoading = false
}: ApprovalsOverviewCardsProps) {
  const [animatedValues, setAnimatedValues] = useState<{
    totalPending: number
    totalApproved: number
    totalRejected: number
    totalBookings: number
    pendingToday: number
    approvedToday: number
    rejectedToday: number
    approvalRate: number
  }>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalBookings: 0,
    pendingToday: 0,
    approvedToday: 0,
    rejectedToday: 0,
    approvalRate: 0
  })
  const [prevValues, setPrevValues] = useState<{
    totalPending: number
    totalApproved: number
    totalRejected: number
    totalBookings: number
    pendingToday: number
    approvedToday: number
    rejectedToday: number
    approvalRate: number
  }>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalBookings: 0,
    pendingToday: 0,
    approvedToday: 0,
    rejectedToday: 0,
    approvalRate: 0
  })

  // Animate numbers on change
  useEffect(() => {
    // Get today's date boundaries
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    const endOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59, 999)

    // Analyze bookings by status
    const statusBreakdown = {
      pending: bookings.filter((b) => b.status === 'pending').length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      rejected: bookings.filter((b) => b.status === 'rejected').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
    }

    // Today's metrics
    const pendingToday = bookings.filter((b) => {
      const bookingDate = new Date(b.created_at)
      return b.status === 'pending' && bookingDate >= startOfToday
    }).length

    const approvedToday = bookings.filter((b) => {
      if (!b.updated_at) return false
      const approvalDate = new Date(b.updated_at)
      return (b.status === 'approved' || b.status === 'completed') && approvalDate >= startOfToday
    }).length

    const rejectedToday = bookings.filter((b) => {
      if (!b.updated_at) return false
      const rejectionDate = new Date(b.updated_at)
      return b.status === 'rejected' && rejectionDate >= startOfToday
    }).length

    const totalBookings = bookings.length
    const approvedBookings = statusBreakdown.approved + statusBreakdown.completed
    const rejectedBookings = statusBreakdown.rejected

    // Calculate approval rate
    const approvalRate = totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0

    const currentStats = {
      totalPending: statusBreakdown.pending,
      totalApproved: approvedBookings,
      totalRejected: rejectedBookings,
      totalBookings,
      pendingToday,
      approvedToday,
      rejectedToday,
      approvalRate
    }

    const currentValues = {
      totalPending: currentStats.totalPending,
      totalApproved: currentStats.totalApproved,
      totalRejected: currentStats.totalRejected,
      totalBookings: currentStats.totalBookings,
      pendingToday: currentStats.pendingToday,
      approvedToday: currentStats.approvedToday,
      rejectedToday: currentStats.rejectedToday,
      approvalRate: currentStats.approvalRate
    }

    // Check if values changed
    const hasChanged =
      prevValues.totalPending !== currentValues.totalPending ||
      prevValues.totalApproved !== currentValues.totalApproved ||
      prevValues.totalRejected !== currentValues.totalRejected ||
      prevValues.totalBookings !== currentValues.totalBookings ||
      prevValues.pendingToday !== currentValues.pendingToday ||
      prevValues.approvedToday !== currentValues.approvedToday ||
      prevValues.rejectedToday !== currentValues.rejectedToday ||
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

      animateValue('totalPending', currentValues.totalPending, animatedValues.totalPending)
      animateValue('totalApproved', currentValues.totalApproved, animatedValues.totalApproved)
      animateValue('totalRejected', currentValues.totalRejected, animatedValues.totalRejected)
      animateValue('totalBookings', currentValues.totalBookings, animatedValues.totalBookings)
      animateValue('pendingToday', currentValues.pendingToday, animatedValues.pendingToday)
      animateValue('approvedToday', currentValues.approvedToday, animatedValues.approvedToday)
      animateValue('rejectedToday', currentValues.rejectedToday, animatedValues.rejectedToday)
      animateValue('approvalRate', currentValues.approvalRate, animatedValues.approvalRate)
    }
  }, [bookings, rooms, animatedValues, prevValues])

  // Get this week's pending vs last week's
  const getWeeklyTrend = (): { trend: 'up' | 'down' | 'neutral', change: number } => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const thisWeekPending = bookings.filter((b) => {
      const bookingDate = new Date(b.created_at)
      return b.status === 'pending' && bookingDate >= weekAgo && bookingDate <= today
    }).length

    const lastWeekDate = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekPending = bookings.filter((b) => {
      const bookingDate = new Date(b.created_at)
      return b.status === 'pending' && bookingDate >= lastWeekDate && bookingDate < weekAgo
    }).length

    if (lastWeekPending === 0) return { trend: 'neutral' as const, change: 0 }
    const change = ((thisWeekPending - lastWeekPending) / lastWeekPending) * 100
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: Math.abs(Math.round(change))
    }
  }

  const weeklyTrend = getWeeklyTrend()

  const statCards: StatCard[] = [
    {
      label: 'Menunggu Persetujuan',
      value: animatedValues.totalPending,
      icon: Clock,
      color: 'text-white',
      bgColor: 'bg-yellow-500',
      change: weeklyTrend.change,
      trend: weeklyTrend.trend
    },
    {
      label: 'Permintaan Hari Ini',
      value: animatedValues.pendingToday,
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-orange-500'
    },
    {
      label: 'Disetujui Hari Ini',
      value: animatedValues.approvedToday,
      icon: TrendingUp,
      color: 'text-white',
      bgColor: 'bg-emerald-500'
    },
    {
      label: 'Ditolak Hari Ini',
      value: animatedValues.rejectedToday,
      icon: XCircle,
      color: 'text-white',
      bgColor: 'bg-red-500'
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
          <Card className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.label === 'Tingkat Persetujuan' ? `${stat.value}%` : stat.value}
                    </p>
                    {stat.trend && stat.trend !== 'neutral' && (
                      <div className={`flex items-center text-xs px-1.5 py-0.5 rounded-full ${
                        stat.trend === 'up' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {stat.trend === 'up' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                        {stat.change}%
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
