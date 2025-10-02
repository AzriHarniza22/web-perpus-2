'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin } from 'lucide-react'

interface TourTimeHeatmapProps {
  bookings: any[]
  tours: any[]
  isLoading?: boolean
}

type TimeRange = 'week' | 'month' | '3months'

export function TourTimeHeatmap({
  bookings,
  tours,
  isLoading = false
}: TourTimeHeatmapProps) {
  // Filter tour bookings
  const tourBookings = useMemo(() => {
    return bookings.filter(booking => booking.tour_id)
  }, [bookings])

  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  // Process heatmap data
  const heatmapData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    const hours = Array.from({ length: 24 }, (_, i) => i)

    // Initialize heatmap grid
    const grid = days.map(() => Array(24).fill(0))

    // Filter bookings based on time range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }

    // Process bookings within time range
    tourBookings
      .filter(booking => new Date(booking.created_at) >= startDate)
      .forEach(booking => {
        const date = new Date(booking.created_at)
        const dayOfWeek = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
        const hour = date.getHours()

        if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
          grid[dayOfWeek][hour] += booking.participant_count || 1
        }
      })

    // Find max value for color scaling
    const maxValue = Math.max(...grid.flat())

    return {
      days,
      hours,
      grid,
      maxValue
    }
  }, [tourBookings, timeRange])

  const getIntensityColor = (value: number, maxValue: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800'

    const intensity = value / maxValue
    if (intensity <= 0.25) return 'bg-blue-200 dark:bg-blue-900'
    if (intensity <= 0.5) return 'bg-blue-300 dark:bg-blue-800'
    if (intensity <= 0.75) return 'bg-blue-400 dark:bg-blue-700'
    return 'bg-blue-600 dark:bg-blue-600'
  }

  const getTextColor = (value: number, maxValue: number) => {
    if (value === 0) return 'text-gray-400'
    const intensity = value / maxValue
    return intensity > 0.5 ? 'text-white' : 'text-gray-900 dark:text-gray-100'
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tour Time Heatmap
          </CardTitle>
          <CardDescription>Pola reservasi tour berdasarkan waktu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-8 gap-1">
              {[...Array(56)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
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
              <Calendar className="w-5 h-5" />
              Tour Time Heatmap
            </CardTitle>
            <CardDescription>
              Pola reservasi tour berdasarkan hari dan jam
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 Hari</SelectItem>
                <SelectItem value="month">30 Hari</SelectItem>
                <SelectItem value="3months">90 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Intensitas:</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm" />
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 rounded-sm" />
              <div className="w-4 h-4 bg-blue-400 dark:bg-blue-700 rounded-sm" />
              <div className="w-4 h-4 bg-blue-600 dark:bg-blue-600 rounded-sm" />
            </div>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              0 - {heatmapData.maxValue}+ peserta
            </span>
          </div>

          {/* Heatmap Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto"
          >
            <div className="min-w-[600px]">
              {/* Header with hours */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div></div> {/* Empty corner */}
                {heatmapData.hours.filter((_, i) => i % 4 === 0).map(hour => (
                  <div key={hour} className="text-center text-xs text-gray-600 dark:text-gray-400 py-1">
                    {hour}:00
                  </div>
                ))}
              </div>

              {/* Days and data */}
              {heatmapData.days.map((day, dayIndex) => (
                <div key={day} className="grid grid-cols-8 gap-1 mb-1">
                  {/* Day label */}
                  <div className="flex items-center justify-end pr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </div>

                  {/* Hour cells */}
                  {heatmapData.hours.map((hour) => {
                    const value = heatmapData.grid[dayIndex][hour]
                    return (
                      <motion.div
                        key={`${dayIndex}-${hour}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (dayIndex * 24 + hour) * 0.01 }}
                        className={`
                          h-8 rounded-sm flex items-center justify-center text-xs font-medium cursor-pointer
                          hover:ring-2 hover:ring-blue-300 transition-all
                          ${getIntensityColor(value, heatmapData.maxValue)}
                          ${getTextColor(value, heatmapData.maxValue)}
                        `}
                        title={`${day} ${hour}:00 - ${value} peserta`}
                      >
                        {value > 0 ? value : ''}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {heatmapData.maxValue}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Peak Hour</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tourBookings.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tourBookings.reduce((sum, booking) => sum + (booking.participant_count || 0), 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Participants</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}