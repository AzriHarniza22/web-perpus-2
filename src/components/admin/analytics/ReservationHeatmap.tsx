'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, getDay, startOfWeek } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Activity, Flame } from 'lucide-react'

interface ReservationHeatmapProps {
  bookings: any[]
  isLoading?: boolean
}

type TimeRange = '30' | '60' | '90'

interface HeatmapData {
  day: number
  hour: number
  count: number
  date: string
}

export function ReservationHeatmap({ bookings, isLoading = false }: ReservationHeatmapProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  // Process heatmap data
  const heatmapData = useMemo(() => {
    return processHeatmapData(bookings, parseInt(timeRange))
  }, [bookings, timeRange])

  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map(d => d.count), 1)
  }, [heatmapData])

  const totalBookings = useMemo(() => {
    return heatmapData.reduce((sum, d) => sum + d.count, 0)
  }, [heatmapData])

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'

    const intensity = count / maxCount
    if (intensity <= 0.25) return 'bg-green-200 dark:bg-green-900/30'
    if (intensity <= 0.5) return 'bg-green-300 dark:bg-green-800/50'
    if (intensity <= 0.75) return 'bg-yellow-300 dark:bg-yellow-800/50'
    return 'bg-red-400 dark:bg-red-700/70'
  }

  const getIntensityTextColor = (count: number) => {
    if (count === 0) return 'text-gray-400'
    const intensity = count / maxCount
    if (intensity <= 0.5) return 'text-gray-700 dark:text-gray-300'
    return 'text-white'
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reservation Heatmap
          </CardTitle>
          <CardDescription>Heatmap pola reservasi hari/jam</CardDescription>
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
              Reservation Heatmap
            </CardTitle>
            <CardDescription>
              Heatmap pola reservasi hari/jam seperti GitHub
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Total: {totalBookings}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Max: {maxCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Hari</SelectItem>
                <SelectItem value="60">60 Hari</SelectItem>
                <SelectItem value="90">90 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              {/* Day labels */}
              <div className="flex">
                <div className="w-8"></div> {/* Empty corner */}
                <div className="flex-1 grid grid-cols-24 gap-1 text-xs text-gray-500">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="text-center">
                      {i % 4 === 0 ? i : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap grid */}
              <div className="flex">
                <div className="w-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                    <div key={i} className="h-8 flex items-center">{day}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {Array.from({ length: 7 }, (_, dayIndex) =>
                    Array.from({ length: 24 }, (_, hourIndex) => {
                      const data = heatmapData.find(d => d.day === dayIndex && d.hour === hourIndex)
                      const count = data?.count || 0

                      return (
                        <motion.div
                          key={`${dayIndex}-${hourIndex}`}
                          className={`
                            h-8 rounded-sm cursor-pointer transition-all duration-200
                            ${getIntensityColor(count)}
                            hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50
                          `}
                          title={`${count} reservasi pada hari ${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayIndex]}, jam ${hourIndex}:00`}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className={`w-full h-full flex items-center justify-center text-xs font-medium ${getIntensityTextColor(count)}`}>
                            {count > 0 ? count : ''}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>Lebih sedikit</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor((level / 4) * maxCount)}`}
                    />
                  ))}
                </div>
                <span>Lebih banyak</span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}

function processHeatmapData(bookings: any[], daysBack: number): HeatmapData[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysBack)

  // Filter bookings by date range
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.created_at)
    return bookingDate >= startDate && bookingDate <= endDate
  })

  // Initialize heatmap data structure
  const heatmapData: HeatmapData[] = []

  // Process bookings into day/hour grid
  filteredBookings.forEach(booking => {
    const bookingDate = parseISO(booking.created_at)
    const dayOfWeek = getDay(bookingDate) // 0 = Sunday, 1 = Monday, etc.
    const hour = bookingDate.getHours()

    // Find existing data point or create new one
    let dataPoint = heatmapData.find(d => d.day === dayOfWeek && d.hour === hour)

    if (dataPoint) {
      dataPoint.count += 1
    } else {
      heatmapData.push({
        day: dayOfWeek,
        hour: hour,
        count: 1,
        date: format(bookingDate, 'yyyy-MM-dd')
      })
    }
  })

  return heatmapData
}