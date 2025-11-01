'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Line, Bar, Scatter } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { useChartData } from './ChartDataContext'
import { useInViewAnimation, useHoverAnimation, useLoadingAnimation } from '@/hooks/useAnimations'

// Using Chart.js types directly

// Register Chart.js components once to avoid duplication
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export type ChartType = 'line' | 'bar' | 'scatter'
export type ViewMode = 'monthly' | 'daily' | 'weekly'

export interface BaseChartProps<T extends ChartType = ChartType> {
  title: string
  description: string
  icon?: LucideIcon
  isLoading?: boolean
  chartType?: T
  viewMode?: ViewMode
  availableChartTypes?: ChartType[]
  availableViewModes?: ViewMode[]
  onChartTypeChange?: (type: ChartType) => void
  onViewModeChange?: (mode: ViewMode) => void
  chartData: ChartData<T, (number | [number, number] | null)[], unknown>
  getChartOptions: (viewMode?: ViewMode) => ChartOptions<T>
  customControls?: React.ReactNode
  customStats?: Array<{ label: string; value: string | number; icon?: LucideIcon }>
  height?: number
  children?: React.ReactNode
}

export function BaseChart<T extends ChartType = ChartType>({
  title,
  description,
  icon: Icon,
  isLoading = false,
  chartType = 'line' as T,
  viewMode = 'monthly',
  availableChartTypes = ['line', 'bar'],
  availableViewModes = ['monthly', 'daily'],
  onChartTypeChange,
  onViewModeChange,
  chartData,
  getChartOptions,
  customControls,
  customStats = [],
  height = 256,
  children
}: BaseChartProps<T>) {

  const [internalChartType, setInternalChartType] = useState<ChartType>(chartType)
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(viewMode)

  const currentChartType = onChartTypeChange ? chartType : internalChartType
  const currentViewMode = onViewModeChange ? viewMode : internalViewMode

  // Animation hooks
  const inViewAnimation = useInViewAnimation({ variant: 'slide', direction: 'up' })
  const hoverAnimation = useHoverAnimation()
  const loadingAnimation = useLoadingAnimation()

  // Register chart data for export functionality
  const { registerChartData } = useChartData()

  useEffect(() => {
    if (chartData && chartData.labels && chartData.datasets) {
      // Generate a unique chart key based on title and type
      const chartKey = `${title.replace(/\s+/g, '_').toLowerCase()}_${currentChartType}`

      registerChartData(chartKey, {
        title,
        data: chartData,
        type: currentChartType,
        viewMode: currentViewMode
      })
    }
  }, [chartData, title, currentChartType, currentViewMode, registerChartData])

  const handleChartTypeChange = (type: ChartType) => {
    if (onChartTypeChange) {
      onChartTypeChange(type)
    } else {
      setInternalChartType(type)
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    } else {
      setInternalViewMode(mode)
    }
  }

  const renderLoadingState = () => (
    <motion.div
      {...inViewAnimation}
      className="w-full"
    >
      <Card className="bg-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" />}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <motion.div
                className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
            </div>
            <motion.div
              className="bg-gray-200 dark:bg-gray-700 rounded"
              style={{ height: `${height}px` }}
              animate={{ scale: [1, 1.02, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderChart = () => {
    // Ensure chartData has the required structure
    if (!chartData || !chartData.labels || !chartData.datasets) {
      console.warn('Chart data is missing required structure:', chartData)
      return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
    }

    const options = getChartOptions(currentViewMode)

    switch (currentChartType) {
      case 'line':
        return <Line data={chartData as ChartData<'line', (number | [number, number] | null)[], unknown>} options={options as ChartOptions<'line'>} />
      case 'bar':
        return <Bar data={chartData as ChartData<'bar', (number | [number, number] | null)[], unknown>} options={options as ChartOptions<'bar'>} />
      case 'scatter':
        return <Scatter data={chartData as ChartData<'scatter', (number | [number, number] | null)[], unknown>} options={options as ChartOptions<'scatter'>} />
      default:
        return <Line data={chartData as ChartData<'line', (number | [number, number] | null)[], unknown>} options={options as ChartOptions<'line'>} />
    }
  }

  if (isLoading) {
    return renderLoadingState()
  }

  return (
    <motion.div
      {...inViewAnimation}
      className="w-full"
    >
      <Card className="bg-card backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5" />}
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {customStats.length > 0 && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {customStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  >
                    <Badge variant="outline" className="flex items-center gap-1">
                      {stat.icon && <stat.icon className="w-3 h-3" />}
                      {stat.label}: {stat.value}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <motion.div
              className="flex items-center gap-2 flex-wrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {/* View Mode Controls */}
              {availableViewModes.length > 1 && (
                <div className="flex rounded-lg border bg-card">
                  {availableViewModes.map((mode, index) => (
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                    >
                      <Button
                        variant={currentViewMode === mode ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleViewModeChange(mode)}
                        className={availableViewModes.indexOf(mode) === 0 ? 'rounded-r-none' : 'rounded-l-none'}
                        {...hoverAnimation}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Chart Type Controls */}
              {availableChartTypes.length > 1 && (
                <div className="flex rounded-lg border bg-card">
                  {availableChartTypes.map((type, index) => (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05, duration: 0.2 }}
                    >
                      <Button
                        variant={currentChartType === type ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleChartTypeChange(type)}
                        className={availableChartTypes.indexOf(type) === 0 ? 'rounded-r-none' : 'rounded-l-none'}
                        {...hoverAnimation}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Custom Controls */}
              {customControls}
            </motion.div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
              className="overflow-hidden rounded-lg"
            >
              <div style={{ height: `${height}px` }}>
                {renderChart()}
              </div>
            </motion.div>

            {/* Additional Content */}
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Common chart options factory
export function createChartOptions(overrides: ChartOptions<'line' | 'bar' | 'scatter'> = {}) {
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
        mode: 'index' as const,
        intersect: false,
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
          color: 'rgba(0, 0, 0, 0.05)'
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
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2
      }
    },
    ...overrides
  }
}

// Data processing utilities
export function processTimeSeriesData(
  data: Record<string, unknown>[],
  dateField: string = 'created_at',
  groupBy: 'day' | 'month' | 'hour' = 'month',
  valueFields: string[] = ['total']
) {
  const processedData = new Map()

  data.forEach(item => {
    const date = new Date(item[dateField] as string)
    let key: string

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'hour':
        key = `${date.toISOString().split('T')[0]}T${String(date.getHours()).padStart(2, '0')}:00:00`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!processedData.has(key)) {
      processedData.set(key, {
        ...valueFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}),
        count: 0
      })
    }

    const current = processedData.get(key)
    current.count += 1

    valueFields.forEach(field => {
      if (item[field] !== undefined) {
        current[field] += Number(item[field] as string | number) || 1
      }
    })
  })

  return Array.from(processedData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => ({ key, ...values }))
}