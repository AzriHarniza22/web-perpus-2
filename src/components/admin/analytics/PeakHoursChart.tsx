'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js'
import { Line, Scatter } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, TrendingUp, Activity } from 'lucide-react'
import { Booking } from '@/lib/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface PeakHoursChartProps {
  bookings: Booking[]
  isLoading?: boolean
}

type ChartType = 'line' | 'scatter'
type TimeRange = '24' | '12' | '6'

export function PeakHoursChart({ bookings, isLoading = false }: PeakHoursChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeRange, setTimeRange] = useState<TimeRange>('24')

  // Process data for peak hours analysis
  const chartData = useMemo(() => {
    return processPeakHoursData(bookings, timeRange)
  }, [bookings, timeRange])

  const peakHour = useMemo(() => {
    if (chartData.datasets[0]?.data.length === 0) return null

    const maxValue = Math.max(...chartData.datasets[0].data)
    const peakIndex = chartData.datasets[0].data.indexOf(maxValue)
    return {
      hour: chartData.labels[peakIndex],
      count: maxValue
    }
  }, [chartData])

  const totalBookings = useMemo(() => {
    return chartData.datasets[0]?.data.reduce((sum: number, value: number) => sum + value, 0) || 0
  }, [chartData])

  if (isLoading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Peak Hours
          </CardTitle>
          <CardDescription>Analisis jam sibuk reservasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
              <Clock className="w-5 h-5" />
              Peak Hours
            </CardTitle>
            <CardDescription>
              Analisis jam sibuk reservasi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {peakHour && (
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Peak: {peakHour.hour}:00 ({peakHour.count})
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Total: {totalBookings}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Range:</span>
            </div>

            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Jam</SelectItem>
                <SelectItem value="12">12 Jam</SelectItem>
                <SelectItem value="24">24 Jam</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border bg-white dark:bg-gray-800">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="rounded-r-none"
              >
                Line
              </Button>
              <Button
                variant={chartType === 'scatter' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('scatter')}
                className="rounded-l-none"
              >
                Scatter
              </Button>
            </div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-64">
              {chartType === 'line' ? (
                <Line data={chartData} options={getChartOptions(timeRange)} />
              ) : (
                <Scatter data={chartData} options={getScatterOptions(timeRange)} />
              )}
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}

function processPeakHoursData(bookings: Booking[], timeRange: TimeRange) {
  const hoursData = new Map()

  // Initialize hours based on range
  const maxHours = parseInt(timeRange)
  for (let i = 0; i < maxHours; i++) {
    hoursData.set(i, 0)
  }

  // Count bookings per hour
  bookings.forEach(booking => {
    // Use start_time for room bookings, created_at for others
    const dateTime = booking.start_time ? parseISO(booking.start_time) : parseISO(booking.created_at)
    const hour = dateTime.getHours()

    if (hour < maxHours) {
      hoursData.set(hour, hoursData.get(hour) + 1)
    }
  })

  const labels = Array.from(hoursData.keys()).map(hour => `${hour.toString().padStart(2, '0')}:00`)
  const data = Array.from(hoursData.values())

  return {
    labels,
    datasets: [
      {
        label: 'Jumlah Reservasi',
        data: data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
}

function getChartOptions(timeRange: TimeRange) {
  const maxHours = parseInt(timeRange)

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
        callbacks: {
          title: function(tooltipItems: TooltipItem<'line'>[]) {
            const tooltipItem = tooltipItems[0]
            const hour = tooltipItem.label
            return `Jam ${hour}`
          },
          label: function(tooltipItem: TooltipItem<'line'>) {
            return `Reservasi: ${tooltipItem.parsed.y}`
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
          maxRotation: 0,
          callback: function(value: string | number, index: number) {
            if (maxHours <= 12) {
              return `${index}:00`
            }
            return index % 2 === 0 ? `${index}:00` : ''
          }
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
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2
      }
    }
  }
}

function getScatterOptions(timeRange: TimeRange) {
  const maxHours = parseInt(timeRange)

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
        callbacks: {
          title: function(context: TooltipItem<'scatter'>[]) {
            return `Jam ${context[0].label}:00`
          },
          label: function(context: TooltipItem<'scatter'>) {
            return `Reservasi: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          stepSize: 1,
          callback: function(value: string | number) {
            return `${value}:00`
          }
        },
        min: 0,
        max: maxHours - 1
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
      intersect: false
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 8
      }
    }
  }
}