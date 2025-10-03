'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Building, TrendingUp } from 'lucide-react'
import { Booking, Room } from '@/lib/types'

// Extended booking type for analytics that includes joined room data
interface BookingWithRoom extends Booking {
  rooms?: Room
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface AverageReservationTimeChartProps {
  bookings: BookingWithRoom[]
  rooms: Room[]
  selectedRoom?: string
  isLoading?: boolean
}

export function AverageReservationTimeChart({
  bookings,
  rooms,
  selectedRoom,
  isLoading = false
}: AverageReservationTimeChartProps) {
  const [localRoomFilter, setLocalRoomFilter] = useState<string>(selectedRoom || 'all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter bookings based on selected room
  const filteredBookings = useMemo(() => {
    if (!localRoomFilter || localRoomFilter === 'all') return bookings
    return bookings.filter(booking => booking.room_id === localRoomFilter)
  }, [bookings, localRoomFilter])

  // Process average duration data per room
  const chartData = useMemo(() => {
    const roomDurationData = new Map()

    filteredBookings.forEach(booking => {
      const roomId = booking.room_id
      const roomName = booking.rooms?.name || 'Unknown Room'

      if (!roomDurationData.has(roomId)) {
        roomDurationData.set(roomId, {
          name: roomName,
          totalDuration: 0,
          bookingCount: 0,
          capacity: booking.rooms?.capacity || 0
        })
      }

      const data = roomDurationData.get(roomId)

      // Calculate duration in hours
      if (booking.start_time && booking.end_time) {
        const start = new Date(booking.start_time).getTime()
        const end = new Date(booking.end_time).getTime()
        const duration = (end - start) / (1000 * 60 * 60) // Convert to hours

        if (duration > 0 && duration <= 24) { // Filter out invalid durations
          data.totalDuration += duration
          data.bookingCount += 1
        }
      }
    })

    // Calculate averages and filter out rooms with no valid bookings
    const roomAverages = Array.from(roomDurationData.values())
      .filter(room => room.bookingCount > 0)
      .map(room => ({
        ...room,
        averageDuration: Math.round((room.totalDuration / room.bookingCount) * 10) / 10
      }))
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.averageDuration - a.averageDuration
        } else {
          return a.averageDuration - b.averageDuration
        }
      })
      .slice(0, 10) // Top 10 rooms

    return {
      labels: roomAverages.map(room => room.name),
      datasets: [
        {
          label: 'Rata-rata Durasi (jam)',
          data: roomAverages.map(room => room.averageDuration),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        }
      ]
    }
  }, [filteredBookings, sortOrder])

  const overallAverage = useMemo(() => {
    if (chartData.datasets[0].data.length > 0) {
      const sum = chartData.datasets[0].data.reduce((acc, val) => acc + val, 0)
      return Math.round((sum / chartData.datasets[0].data.length) * 10) / 10
    }
    return 0
  }, [chartData])

  const maxDuration = useMemo(() => {
    if (chartData.datasets[0].data.length > 0) {
      return Math.max(...chartData.datasets[0].data)
    }
    return 0
  }, [chartData])

  const selectedRoomName = useMemo(() => {
    if (!localRoomFilter || localRoomFilter === 'all') return 'Semua Ruangan'
    return rooms?.find(room => room.id === localRoomFilter)?.name || 'Unknown Room'
  }, [localRoomFilter, rooms])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Average Reservation Duration
          </CardTitle>
          <CardDescription>Rata-rata durasi reservasi per ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              <Clock className="w-5 h-5" />
              Average Reservation Duration by Room
            </CardTitle>
            <CardDescription>
              Rata-rata durasi penggunaan ruangan (dalam jam)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {selectedRoomName}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {overallAverage}h
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Max: {maxDuration}h
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border bg-white dark:bg-gray-800">
              <Button
                variant={sortOrder === 'desc' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('desc')}
                className="rounded-r-none"
              >
                Terlama
              </Button>
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('asc')}
                className="rounded-l-none"
              >
                Terpendek
              </Button>
            </div>

            {/* Room Filter */}
            <Select value={localRoomFilter} onValueChange={setLocalRoomFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih ruangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ruangan</SelectItem>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-64">
              <Bar data={chartData} options={getChartOptions()} />
            </div>
          </motion.div>

          {/* Summary Stats */}
          {chartData.labels.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Ruangan</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chartData.labels.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {overallAverage} jam
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Terlama</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {maxDuration} jam
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Terpendek</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.min(...chartData.datasets[0].data)} jam
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getChartOptions() {
  return {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context: { parsed: { x: number } }) => {
            return `Durasi: ${context.parsed.x} jam`
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5]
        },
        ticks: {
          font: {
            size: 11
          },
          precision: 1,
          callback: (value: string | number) => `${value}h`
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 0,
          callback: (value: string | number) => {
            // This will be handled by Chart.js internally
            return value
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'y' as const,
      intersect: false
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  }
}