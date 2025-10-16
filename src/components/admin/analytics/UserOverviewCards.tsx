'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, UserCheck, UserPlus, Building, Award, BookOpen, Activity, LucideIcon } from 'lucide-react'
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
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Pengguna Aktif',
      value: animatedValues.activeUsers,
      icon: UserCheck,
      color: 'text-white',
      bgColor: 'bg-green-500',
      subtitle: `${animatedValues.approvalRate}% dari total`
    },
    {
      label: 'Pengguna Baru',
      value: animatedValues.newUsersThisMonth,
      icon: UserPlus,
      color: 'text-white',
      bgColor: 'bg-purple-500',
      subtitle: 'Bulan ini'
    },
    {
      label: 'Rata-rata Booking',
      value: animatedValues.avgBookingsPerUser,
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      subtitle: 'Per pengguna aktif'
    },
    {
      label: 'Institusi Terdaftar',
      value: animatedValues.topInstitutionCount,
      icon: Building,
      color: 'text-white',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Tingkat Aktivitas',
      value: animatedValues.approvalRate,
      icon: Activity,
      color: 'text-white',
      bgColor: 'bg-green-500',
      subtitle: 'Pengguna aktif/total'
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
          <Card className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-105 w-full">
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
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-75 ease-out`}>
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