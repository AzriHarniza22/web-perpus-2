'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, MapPin, Clock, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface GeneralOverviewCardsProps {
  bookings: any[]
  rooms: any[]
  tours: any[]
  users: any[]
  isLoading?: boolean
}

interface StatCard {
  label: string
  value: number
  icon: any
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

  // Calculate stats
  const stats = {
    totalBookings: bookings.length,
    approvedBookings: bookings.filter((b: any) => b.status === 'approved').length,
    pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
    rejectedBookings: bookings.filter((b: any) => b.status === 'rejected').length,
    totalRooms: rooms.length,
    totalTours: tours.length,
    totalUsers: users.length,
    approvalRate: bookings.length > 0 ? Math.round((bookings.filter((b: any) => b.status === 'approved').length / bookings.length) * 100) : 0
  }

  // Animate numbers on change
  useEffect(() => {
    const currentValues = {
      totalBookings: stats.totalBookings,
      approvedBookings: stats.approvedBookings,
      pendingBookings: stats.pendingBookings,
      rejectedBookings: stats.rejectedBookings,
      totalRooms: stats.totalRooms,
      totalTours: stats.totalTours,
      totalUsers: stats.totalUsers,
      approvalRate: stats.approvalRate
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
  }, [stats, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Reservasi',
      value: animatedValues.totalBookings || stats.totalBookings,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      change: 12,
      changeType: 'increase'
    },
    {
      label: 'Disetujui',
      value: animatedValues.approvedBookings || stats.approvedBookings,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      change: 8,
      changeType: 'increase'
    },
    {
      label: 'Menunggu',
      value: animatedValues.pendingBookings || stats.pendingBookings,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      change: -3,
      changeType: 'decrease'
    },
    {
      label: 'Ditolak',
      value: animatedValues.rejectedBookings || stats.rejectedBookings,
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      change: 2,
      changeType: 'increase'
    },
    {
      label: 'Total Ruangan',
      value: animatedValues.totalRooms || stats.totalRooms,
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50'
    },
    {
      label: 'Total Tour',
      value: animatedValues.totalTours || stats.totalTours,
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/50'
    },
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers || stats.totalUsers,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/50'
    },
    {
      label: 'Tingkat Persetujuan',
      value: animatedValues.approvalRate || stats.approvalRate,
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
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
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