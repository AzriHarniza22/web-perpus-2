'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, UserCheck, UserPlus, Building, Award, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { aggregateUserAnalytics, getUserInitials } from '@/lib/userAnalytics'
import { Booking, User } from '@/lib/types'

interface UserOverviewCardsProps {
  bookings: Booking[]
  users: User[]
  isLoading?: boolean
  dateFilter?: { from?: Date; to?: Date }
}

interface StatCard {
  label: string
  value: number
  icon: LucideIcon
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

  // Animate numbers on change
  useEffect(() => {
    // Calculate user analytics and stats inside useEffect to avoid recreating on every render
    const currentUserAnalytics = aggregateUserAnalytics(bookings, users, dateFilter)

    const currentStats = {
      totalUsers: currentUserAnalytics.totalUsers,
      activeUsers: currentUserAnalytics.activeUsers,
      newUsersThisMonth: currentUserAnalytics.newUsersThisMonth,
      avgBookingsPerUser: currentUserAnalytics.activeUsers > 0
        ? currentUserAnalytics.topUsers.reduce((sum, user) => sum + user.bookingCount, 0) / currentUserAnalytics.activeUsers
        : 0,
      topInstitutionCount: currentUserAnalytics.topInstitutions.length,
      approvalRate: currentUserAnalytics.totalUsers > 0
        ? Math.round((currentUserAnalytics.activeUsers / currentUserAnalytics.totalUsers) * 100)
        : 0
    }

    const currentValues = {
      totalUsers: currentStats.totalUsers,
      activeUsers: currentStats.activeUsers,
      newUsersThisMonth: currentStats.newUsersThisMonth,
      avgBookingsPerUser: Math.round(currentStats.avgBookingsPerUser * 10) / 10,
      topInstitutionCount: currentStats.topInstitutionCount,
      approvalRate: currentStats.approvalRate
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
 }, [bookings, users, dateFilter, animatedValues, prevValues])

  const statCards: StatCard[] = [
    {
      label: 'Total Pengguna',
      value: animatedValues.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      change: 12,
      changeType: 'increase'
    },
    {
      label: 'Pengguna Aktif',
      value: animatedValues.activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      subtitle: `${animatedValues.approvalRate}% dari total`,
      change: 8,
      changeType: 'increase'
    },
    {
      label: 'Pengguna Baru',
      value: animatedValues.newUsersThisMonth,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      subtitle: 'Bulan ini',
      change: 15,
      changeType: 'increase'
    },
    {
      label: 'Rata-rata Booking',
      value: animatedValues.avgBookingsPerUser,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      subtitle: 'Per pengguna aktif',
      change: 5,
      changeType: 'increase'
    },
    {
      label: 'Institusi Terdaftar',
      value: animatedValues.topInstitutionCount,
      icon: Building,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
      change: 3,
      changeType: 'increase'
    },
    {
      label: 'Tingkat Aktivitas',
      value: animatedValues.approvalRate,
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm w-full">
            <CardContent className="p-3 h-20">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105 w-full">
            <CardContent className="p-3 h-20">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {stat.label.includes('Tingkat') ? `${stat.value}%` : stat.value}
                    </p>
                    {stat.change !== undefined && stat.changeType && (
                      <div className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                        stat.changeType === 'increase'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : stat.changeType === 'decrease'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                      }`}>
                        <TrendingUp className={`w-2.5 h-2.5 ${stat.changeType === 'decrease' ? 'rotate-180' : ''}`} />
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0 ml-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}