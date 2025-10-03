import { ChartOptions } from 'chart.js'

// Color palettes for consistent theming
export const CHART_COLORS = {
  primary: {
    main: 'rgb(59, 130, 246)',
    light: 'rgba(59, 130, 246, 0.1)',
    dark: 'rgb(29, 78, 216)'
  },
  success: {
    main: 'rgb(34, 197, 94)',
    light: 'rgba(34, 197, 94, 0.1)',
    dark: 'rgb(21, 128, 61)'
  },
  warning: {
    main: 'rgb(245, 158, 11)',
    light: 'rgba(245, 158, 11, 0.1)',
    dark: 'rgb(217, 119, 6)'
  },
  danger: {
    main: 'rgb(239, 68, 68)',
    light: 'rgba(239, 68, 68, 0.1)',
    dark: 'rgb(220, 38, 38)'
  },
  purple: {
    main: 'rgb(168, 85, 247)',
    light: 'rgba(168, 85, 247, 0.1)',
    dark: 'rgb(124, 58, 237)'
  },
  pink: {
    main: 'rgb(236, 72, 153)',
    light: 'rgba(236, 72, 153, 0.1)',
    dark: 'rgb(219, 39, 119)'
  }
}

// Status-based color mapping
export const STATUS_COLORS = {
  approved: CHART_COLORS.success.main,
  pending: CHART_COLORS.warning.main,
  rejected: CHART_COLORS.danger.main,
  cancelled: 'rgb(107, 114, 128)',
  completed: CHART_COLORS.primary.main
}

// Common chart options that can be reused
export function getBaseChartOptions(overrides: Partial<ChartOptions> = {}): ChartOptions {
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

// Line chart specific options
export function getLineChartOptions(overrides: Partial<ChartOptions> = {}): ChartOptions {
  return getBaseChartOptions({
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2,
        tension: 0.4
      }
    },
    ...overrides
  })
}

// Bar chart specific options
export function getBarChartOptions(overrides: Partial<ChartOptions> = {}): ChartOptions {
  return getBaseChartOptions({
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
          precision: 0,
          stepSize: 1
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    },
    ...overrides
  })
}

// Scatter plot specific options
export function getScatterChartOptions(overrides: Partial<ChartOptions> = {}): ChartOptions {
  return getBaseChartOptions({
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
          callback: function(value: any) {
            return `${value}:00`
          }
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
          precision: 0,
          stepSize: 1
        }
      }
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 8
      }
    },
    ...overrides
  })
}

// Horizontal bar chart options (for room duration charts)
export function getHorizontalBarChartOptions(overrides: Partial<ChartOptions> = {}): ChartOptions {
  return getBaseChartOptions({
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          precision: 1,
          callback: (value: any) => `${value}h`
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
          maxRotation: 0
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    },
    ...overrides
  })
}

// Chart type specific option getters
export function getChartOptionsByType(
  chartType: 'line' | 'bar' | 'scatter' | 'horizontalBar',
  overrides: Partial<ChartOptions> = {}
): ChartOptions {
  switch (chartType) {
    case 'line':
      return getLineChartOptions(overrides)
    case 'bar':
      return getBarChartOptions(overrides)
    case 'scatter':
      return getScatterChartOptions(overrides)
    case 'horizontalBar':
      return getHorizontalBarChartOptions(overrides)
    default:
      return getBaseChartOptions(overrides)
  }
}

// Dataset configuration helpers
export function createDataset(
  label: string,
  data: number[],
  color: string,
  options: {
    type?: 'line' | 'bar'
    fill?: boolean
    tension?: number
    backgroundColor?: string
    borderWidth?: number
    pointRadius?: number
  } = {}
) {
  const {
    type = 'line',
    fill = false,
    tension = 0.4,
    backgroundColor,
    borderWidth = 2,
    pointRadius = 4
  } = options

  return {
    label,
    data,
    borderColor: color,
    backgroundColor: backgroundColor || `${color}1A`,
    fill,
    tension,
    borderWidth,
    pointRadius,
    pointHoverRadius: pointRadius + 2,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2
  }
}

// Status-based dataset creation
export function createStatusDatasets(
  labels: string[],
  statusData: Record<string, number[]>,
  statusConfig: Record<string, { label: string; color: string }> = {
    total: { label: 'Total', color: CHART_COLORS.primary.main },
    approved: { label: 'Disetujui', color: CHART_COLORS.success.main },
    pending: { label: 'Menunggu', color: CHART_COLORS.warning.main },
    rejected: { label: 'Ditolak', color: CHART_COLORS.danger.main }
  }
) {
  return Object.entries(statusConfig).map(([key, config]) => ({
    label: config.label,
    data: statusData[key] || labels.map(() => 0),
    borderColor: config.color,
    backgroundColor: `${config.color}1A`,
    fill: false,
    tension: 0.4
  }))
}

// Time range specific options
export function getTimeRangeOptions(timeRange: string): Partial<ChartOptions> {
  const range = parseInt(timeRange)

  if (range <= 12) {
    return {
      scales: {
        x: {
          ticks: {
            callback: function(value: any, index: number) {
              return `${index}:00`
            }
          }
        }
      }
    }
  }

  return {
    scales: {
      x: {
        ticks: {
          callback: function(value: any, index: number) {
            return index % 2 === 0 ? `${index}:00` : ''
          }
        }
      }
    }
  }
}

// Tooltip formatters
export const TOOLTIP_FORMATTERS = {
  default: function(context: any) {
    return `${context.dataset.label}: ${context.parsed.y}`
  },
  time: function(context: any) {
    return `Jam ${context[0].label}: ${context.parsed.y} reservasi`
  },
  duration: function(context: any) {
    return `Durasi: ${context.parsed.x} jam`
  },
  percentage: function(context: any) {
    return `${context.dataset.label}: ${context.parsed.y}%`
  }
}

// Animation presets
export const CHART_ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  }
}

// Responsive height configurations
export const CHART_HEIGHTS = {
  small: 200,
  medium: 256,
  large: 320,
  extraLarge: 400
}

// Grid configurations for different chart types
export const GRID_CONFIGS = {
  none: {
    display: false
  },
  light: {
    color: 'rgba(0, 0, 0, 0.05)',
    borderDash: [5, 5]
  },
  dark: {
    color: 'rgba(255, 255, 255, 0.1)',
    borderDash: [3, 3]
  }
}