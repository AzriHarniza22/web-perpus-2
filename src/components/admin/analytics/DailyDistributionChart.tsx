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
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Filter, Calendar } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DailyDistributionChartProps {
  bookings: any[]
  isLoading?: boolean
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected'

export function DailyDistributionChart({ bookings, isLoading = false }: DailyDistributionChartProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [timeRange, setTimeRange] = useState<string>('7') // days

  // Process data based on filters
  const chartData = useMemo(() => {
    return processDailyDistributionData(bookings, statusFilter, parseInt(timeRange))
  }, [bookings, statusFilter, timeRange])

  const totalInRange = useMemo(() => {
    return chartData.datasets[0]?.data.reduce((sum: number, value: number) => sum + value, 0) || 0
  }, [chartData])

  const averagePerDay = useMemo(() => {
    return chartData.labels.length > 0 ? Math.round(totalInRange / chartData.labels.length) : 0
  }, [chartData, totalInRange])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Distribution
          </CardTitle>
          <CardDescription>Distribusi reservasi harian dengan filter status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              <BarChart3 className="w-5 h-5" />
              Daily Distribution
            </CardTitle>
            <CardDescription>
              Distribusi reservasi harian dengan filter status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Total: {totalInRange}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Avg: {averagePerDay}/hari
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Filter:</span>
            </div>

            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari</SelectItem>
                <SelectItem value="14">14 Hari</SelectItem>
                <SelectItem value="30">30 Hari</SelectItem>
                <SelectItem value="90">90 Hari</SelectItem>
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
        </div>
      </CardContent>
    </Card>
  )
}

function processDailyDistributionData(bookings: any[], statusFilter: StatusFilter, daysBack: number) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysBack)

  // Filter bookings by date range and status
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.created_at)

    // Date range filter
    if (bookingDate < startDate || bookingDate > endDate) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false
    }

    return true
  })

  // Group by day
  const dailyData = new Map()

  // Initialize all days in range
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayKey = format(date, 'yyyy-MM-dd')
    dailyData.set(dayKey, 0)
  }

  // Count bookings per day
  filteredBookings.forEach(booking => {
    const dayKey = format(parseISO(booking.created_at), 'yyyy-MM-dd')
    if (dailyData.has(dayKey)) {
      dailyData.set(dayKey, dailyData.get(dayKey) + 1)
    }
  })

  const sortedDays = Array.from(dailyData.keys()).sort()

  // Color based on status filter
  const getColor = () => {
    switch (statusFilter) {
      case 'approved':
        return {
          background: 'rgba(34, 197, 94, 0.8)',
          border: 'rgb(34, 197, 94)'
        }
      case 'pending':
        return {
          background: 'rgba(245, 158, 11, 0.8)',
          border: 'rgb(245, 158, 11)'
        }
      case 'rejected':
        return {
          background: 'rgba(239, 68, 68, 0.8)',
          border: 'rgb(239, 68, 68)'
        }
      default:
        return {
          background: 'rgba(59, 130, 246, 0.8)',
          border: 'rgb(59, 130, 246)'
        }
    }
  }

  const colors = getColor()

  return {
    labels: sortedDays.map(day => format(parseISO(day), 'dd/MM', { locale: id })),
    datasets: [
      {
        label: statusFilter === 'all' ? 'Total Reservasi' : `Reservasi ${statusFilter}`,
        data: sortedDays.map(day => dailyData.get(day)),
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`
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
          precision: 0,
          stepSize: 1
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