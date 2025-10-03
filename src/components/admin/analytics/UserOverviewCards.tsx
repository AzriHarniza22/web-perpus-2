'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, UserCheck, UserPlus, Building, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { aggregateUserAnalytics, getUserInitials } from '@/lib/userAnalytics'

interface UserOverviewCardsProps {
  bookings: any[]
  users: any[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

interface StatCard {
  label: string
  value: number
  icon: any
  color: string
  bgColor: string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  subtitle?: string
}

export function UserOverviewCards({
  bookings,
  users,
  isLoading = false,
  dateFilter
}: UserOverviewCardsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    avgBookingsPerUser: 0,
    topInstitutionCount: 0,
    approvalRate: 0
  })

  const [prevValues, setPrevValues] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    avgBookingsPerUser: 0,
    topInstitutionCount: 0,
    approvalRate: 0
  })

  // Calculate user analytics
  const userAnalytics = aggregateUserAnalytics(bookings, users, dateFilter)

  const stats = {
    totalUsers: userAnalytics.totalUsers,
    activeUsers: userAnalytics.activeUsers,
    newUsersThisMonth: userAnalytics.newUsersThisMonth,
    avgBookingsPerUser: userAnalytics.activeUsers > 0
      ? userAnalytics.topUsers.reduce((sum, user) => sum + user.bookingCount, 0) / userAnalytics.activeUsers
      : 0,
    topInstitutionCount: userAnalytics.topInstitutions.length,
    approvalRate: userAnalytics.totalUsers > 0
      ? Math.round((userAnalytics.activeUsers / userAnalytics.totalUsers) * 100)
      : 0
  }

  // Animate numbers on change
  useEffect(() => {
    const currentValues = {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      newUsersThisMonth: stats.newUsersThisMonth,
      avgBookingsPerUser: Math.round(stats.avgBookingsPerUser * 10) / 10,
      topInstitutionCount: stats.topInstitutionCount,
      approvalRate: stats.approvalRate
    }

    // Check if values changed
    const hasChanged =
      prevValues.totalUsers !== currentValues.totalUsers ||
      prevValues.activeUsers !== currentValues.activeUsers ||
      prevValues.newUsersThisMonth !== currentValues.newUsersThisMonth ||
      Math.abs(prevValues.avgBookingsPerUser - currentValues.avgBookingsPerUser) > 0.1 ||
      prevValues.topInstitutionCount !== currentValues.topInstitutionCount ||
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
          const currentValue = key === 'avgBookingsPerUser'
            ? Math.round((startValue + (increment * currentStep * easeOutQuart)) * 10) / 10
            : Math.round(startValue + (increment * currentStep * easeOutQuart))

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

      animateValue('totalUsers', currentValues.totalUsers, animatedValues.totalUsers)
      animateValue('activeUsers', currentValues.activeUsers, animatedValues.activeUsers)
      animateValue('newUsersThisMonth', currentValues.newUsersThisMonth, animatedValues.newUsersThisMonth)
      animateValue('avgBookingsPerUser', currentValues.avgBookingsPerUser, animatedValues.avgBookingsPerUser)
      animateValue('topInstitutionCount', currentValues.topInstitutionCount, animatedValues.topInstitutionCount)
      animateValue('approvalRate', currentValues.approvalRate, animatedValues.approvalRate)
    }
  }, [stats, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers || stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      change: 12,
      changeType: 'increase'
    },
    {
      label: 'Pengguna Aktif',
      value: animatedValues.activeUsers || stats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      subtitle: `${animatedValues.approvalRate || stats.approvalRate}% dari total`,
      change: 8,
      changeType: 'increase'
    },
    {
      label: 'Pengguna Baru',
      value: animatedValues.newUsersThisMonth || stats.newUsersThisMonth,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      subtitle: 'Bulan ini',
      change: 15,
      changeType: 'increase'
    },
    {
      label: 'Rata-rata Booking',
      value: animatedValues.avgBookingsPerUser || stats.avgBookingsPerUser,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      subtitle: 'Per pengguna aktif',
      change: 5,
      changeType: 'increase'
    },
    {
      label: 'Institusi Terdaftar',
      value: animatedValues.topInstitutionCount || stats.topInstitutionCount,
      icon: Building,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
      change: 3,
      changeType: 'increase'
    },
    {
      label: 'Tingkat Aktivitas',
      value: animatedValues.approvalRate || stats.approvalRate,
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
      subtitle: 'Pengguna aktif/total',
      change: 7,
      changeType: 'increase'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.subtitle}
                    </p>
                  )}
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