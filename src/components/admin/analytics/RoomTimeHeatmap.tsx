'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Building } from 'lucide-react'

interface RoomTimeHeatmapProps {
  bookings: any[]
  rooms: any[]
  isLoading?: boolean
}

interface HeatmapData {
  hour: number
  day: string
  count: number
  intensity: number
}

export function RoomTimeHeatmap({
  bookings,
  rooms,
  isLoading = false
}: RoomTimeHeatmapProps) {
  // No longer need local room filter state

  // Filter room bookings (non-tour bookings)
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => booking.is_tour === false)
  }, [bookings])

  // Process heatmap data
  const heatmapData = useMemo(() => {
    const timeData = new Map()

    filteredBookings.forEach(booking => {
      if (booking.start_time) {
        const date = parseISO(booking.start_time)
        const hour = date.getHours()
        const dayOfWeek = format(date, 'EEEE', { locale: id })

        const key = `${hour}-${dayOfWeek}`

        if (!timeData.has(key)) {
          timeData.set(key, {
            hour,
            day: dayOfWeek,
            count: 0
          })
        }

        timeData.get(key).count += 1
      }
    })

    const data = Array.from(timeData.values())

    // Calculate intensity (0-100)
    const maxCount = Math.max(...data.map(d => d.count), 1)
    return data.map(d => ({
      ...d,
      intensity: Math.round((d.count / maxCount) * 100)
    }))
  }, [filteredBookings])

  const totalBookings = useMemo(() => {
    return filteredBookings.length
  }, [filteredBookings])

  const peakHour = useMemo(() => {
    if (heatmapData.length === 0) return 'N/A'

    const maxData = heatmapData.reduce((max, current) =>
      current.count > max.count ? current : max
    )

    return `${maxData.hour}:00`
  }, [heatmapData])

  const selectedRoomName = 'Semua Ruangan'

  // Days of week in Indonesian
  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

  // Hours of day
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i)

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Room Time Heatmap
          </CardTitle>
          <CardDescription>Pola waktu penggunaan ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 w-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-8 gap-1">
              {[...Array(56)].map((_, index) => (
                <div key={index} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              Room Time Patterns
            </CardTitle>
            <CardDescription>
              Heatmap pola waktu penggunaan ruangan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {selectedRoomName}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Peak: {peakHour}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Total: {totalBookings}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              {/* Hour labels */}
              <div className="flex">
                <div className="w-16"></div> {/* Empty corner */}
                <div className="flex-1 grid grid-cols-7 gap-1 text-xs text-center">
                  {daysOfWeek.map(day => (
                    <div key={day} className="py-1 font-medium text-gray-600 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap grid */}
              <div className="flex">
                {/* Hour labels column */}
                <div className="w-16 space-y-1">
                  {hoursOfDay.map(hour => (
                    <div key={hour} className="h-8 flex items-center justify-end pr-2 text-xs text-gray-600 dark:text-gray-400">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Heatmap cells */}
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {hoursOfDay.map(hour =>
                    daysOfWeek.map(day => {
                      const dayKey = day
                      const data = heatmapData.find(d => d.hour === hour && d.day === dayKey)

                      return (
                        <div
                          key={`${hour}-${day}`}
                          className={`
                            h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110
                            ${data?.intensity > 0
                              ? getIntensityColor(data.intensity)
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
                          `}
                          title={`${day} ${hour}:00 - ${data?.count || 0} bookings`}
                        />
                      )
                    })
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Lebih Sedikit</span>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map(intensity => (
                    <div
                      key={intensity}
                      className={`w-4 h-4 rounded ${getIntensityColor(intensity)}`}
                    />
                  ))}
                </div>
                <span>Lebih Banyak</span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}

function getIntensityColor(intensity: number): string {
  if (intensity === 0) {
    return 'bg-gray-100 dark:bg-gray-800'
  } else if (intensity <= 25) {
    return 'bg-blue-200 dark:bg-blue-900/30'
  } else if (intensity <= 50) {
    return 'bg-blue-300 dark:bg-blue-800/50'
  } else if (intensity <= 75) {
    return 'bg-blue-400 dark:bg-blue-700/70'
  } else {
    return 'bg-blue-500 dark:bg-blue-600'
  }
}