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
import { Users, Building, TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface AverageGuestsChartProps {
  bookings: any[]
  rooms: any[]
  selectedRoom?: string
  isLoading?: boolean
}

export function AverageGuestsChart({
  bookings,
  rooms,
  selectedRoom,
  isLoading = false
}: AverageGuestsChartProps) {
  const [localRoomFilter, setLocalRoomFilter] = useState<string>(selectedRoom || 'all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter bookings based on selected room
  const filteredBookings = useMemo(() => {
    if (!localRoomFilter || localRoomFilter === 'all') return bookings
    return bookings.filter(booking => booking.room_id === localRoomFilter)
  }, [bookings, localRoomFilter])

  // Process average guests data per room
  const chartData = useMemo(() => {
    const roomGuestData = new Map()

    filteredBookings.forEach(booking => {
      const roomId = booking.room_id
      const roomName = booking.rooms?.name || 'Unknown Room'
      const guestCount = booking.participant_count || 0

      if (!roomGuestData.has(roomId)) {
        roomGuestData.set(roomId, {
          name: roomName,
          totalGuests: 0,
          bookingCount: 0,
          capacity: booking.rooms?.capacity || 0
        })
      }

      const data = roomGuestData.get(roomId)
      data.totalGuests += guestCount
      data.bookingCount += 1
    })

    // Calculate averages and filter out rooms with no bookings
    const roomAverages = Array.from(roomGuestData.values())
      .filter(room => room.bookingCount > 0)
      .map(room => ({
        ...room,
        averageGuests: Math.round((room.totalGuests / room.bookingCount) * 10) / 10,
        utilizationRate: room.capacity > 0 ? Math.round((room.totalGuests / (room.bookingCount * room.capacity)) * 100) : 0
      }))
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.averageGuests - a.averageGuests
        } else {
          return a.averageGuests - b.averageGuests
        }
      })
      .slice(0, 10) // Top 10 rooms

    return {
      labels: roomAverages.map(room => room.name),
      datasets: [
        {
          label: 'Rata-rata Tamu',
          data: roomAverages.map(room => room.averageGuests),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
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

  const maxGuests = useMemo(() => {
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
            <Users className="w-5 h-5" />
            Average Guests by Room
          </CardTitle>
          <CardDescription>Rata-rata jumlah tamu per ruangan</CardDescription>
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
              <Users className="w-5 h-5" />
              Average Guests by Room
            </CardTitle>
            <CardDescription>
              Rata-rata jumlah tamu dan kapasitas ruangan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {selectedRoomName}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg: {overallAverage}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Max: {maxGuests}
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
                Terbanyak
              </Button>
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('asc')}
                className="rounded-l-none"
              >
                Tersedikit
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Tamu</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {overallAverage}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Maksimal</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {maxGuests}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Minimal</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.min(...chartData.datasets[0].data)}
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
          label: (context: any) => {
            return `Rata-rata Tamu: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5]
        },
        ticks: {
          font: {
            size: 11
          },
          precision: 0
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  }
}