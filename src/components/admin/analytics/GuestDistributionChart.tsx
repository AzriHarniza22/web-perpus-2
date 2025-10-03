'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  TooltipItem
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, PieChart, BarChart3, Building } from 'lucide-react'
import { Booking, Room } from '@/lib/types'

// Extended booking type for analytics that includes joined room data
interface BookingWithRoom extends Booking {
  rooms?: Room
}

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

interface GuestDistributionChartProps {
  bookings: BookingWithRoom[]
  rooms: Room[]
  selectedRoom?: string
  isLoading?: boolean
}

type ChartType = 'pie' | 'doughnut' | 'bar'

export function GuestDistributionChart({
  bookings,
  rooms,
  selectedRoom,
  isLoading = false
}: GuestDistributionChartProps) {
  const [chartType, setChartType] = useState<ChartType>('doughnut')
  const [localRoomFilter, setLocalRoomFilter] = useState<string>(selectedRoom || 'all')

  // Filter bookings based on selected room
  const filteredBookings = useMemo(() => {
    if (!localRoomFilter || localRoomFilter === 'all') return bookings
    return bookings.filter(booking => booking.room_id === localRoomFilter)
  }, [bookings, localRoomFilter])

  // Process guest distribution data
  const chartData = useMemo(() => {
    const roomGuestData = new Map()

    filteredBookings.forEach(booking => {
      const roomId = booking.room_id
      const roomName = booking.rooms?.name || 'Unknown Room'
      const guestCount = booking.guest_count || 0

      if (!roomGuestData.has(roomId)) {
        roomGuestData.set(roomId, {
          name: roomName,
          totalGuests: 0,
          bookingCount: 0
        })
      }

      const data = roomGuestData.get(roomId)
      data.totalGuests += guestCount
      data.bookingCount += 1
    })

    const sortedRooms = Array.from(roomGuestData.entries())
      .sort((a, b) => b[1].totalGuests - a[1].totalGuests)
      .slice(0, 10) // Top 10 rooms

    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(34, 197, 94, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',  // Yellow
      'rgba(239, 68, 68, 0.8)',   // Red
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
      'rgba(6, 182, 212, 0.8)',   // Cyan
      'rgba(234, 179, 8, 0.8)',   // Yellow
      'rgba(168, 85, 247, 0.8)',  // Violet
      'rgba(249, 115, 22, 0.8)'   // Orange
    ]

    if (chartType === 'bar') {
      return {
        labels: sortedRooms.map(([_, data]) => data.name),
        datasets: [
          {
            label: 'Total Tamu',
            data: sortedRooms.map(([_, data]) => data.totalGuests),
            backgroundColor: colors.slice(0, sortedRooms.length),
            borderColor: colors.slice(0, sortedRooms.length).map(color => color.replace('0.8', '1')),
            borderWidth: 1
          }
        ]
      }
    } else {
      return {
        labels: sortedRooms.map(([_, data]) => data.name),
        datasets: [
          {
            data: sortedRooms.map(([_, data]) => data.totalGuests),
            backgroundColor: colors.slice(0, sortedRooms.length),
            borderColor: colors.slice(0, sortedRooms.length).map(color => color.replace('0.8', '1')),
            borderWidth: 2
          }
        ]
      }
    }
  }, [filteredBookings, chartType])

  const totalGuests = useMemo(() => {
    return filteredBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0)
  }, [filteredBookings])

  const averageGuestsPerBooking = useMemo(() => {
    if (filteredBookings.length > 0) {
      return Math.round((totalGuests / filteredBookings.length) * 10) / 10
    }
    return 0
  }, [totalGuests, filteredBookings])

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
            Guest Distribution
          </CardTitle>
          <CardDescription>Distribusi tamu per ruangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              Guest Distribution by Room
            </CardTitle>
            <CardDescription>
              Distribusi jumlah tamu per ruangan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {selectedRoomName}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Total: {totalGuests}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <PieChart className="w-3 h-3" />
              Avg: {averageGuestsPerBooking}
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
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="rounded-r-none"
              >
                <PieChart className="w-4 h-4 mr-1" />
                Pie
              </Button>
              <Button
                variant={chartType === 'doughnut' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('doughnut')}
                className="rounded-l-none rounded-r-none"
              >
                Donut
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="rounded-l-none"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Bar
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
              {chartType === 'bar' ? (
                <Bar data={chartData} options={getBarChartOptions()} />
              ) : (
                <Pie
                  data={chartData}
                  options={getPieChartOptions(chartType)}
                />
              )}
            </div>
          </motion.div>

          {/* Legend */}
          {chartData.labels.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {chartData.labels.map((label, index) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: chartType === 'bar'
                        ? chartData.datasets[0].backgroundColor[index]
                        : chartData.datasets[0].backgroundColor[index]
                    }}
                  />
                  <span className="truncate" title={label}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getPieChartOptions(chartType: 'pie' | 'doughnut') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We'll use custom legend
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
          label: (tooltipItem: TooltipItem<'pie'>) => {
            const total = tooltipItem.dataset.data.reduce((sum: number, value: number) => sum + value, 0)
            const percentage = Math.round((tooltipItem.parsed * 100) / total)
            return `${tooltipItem.label}: ${tooltipItem.parsed} (${percentage}%)`
          }
        }
      }
    },
    cutout: chartType === 'doughnut' ? '50%' : 0
  }
}

function getBarChartOptions() {
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
        padding: 12
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
    }
  }
}