'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface PeakHoursHeatmapProps {
  data: { day: string; hours: { hour: number; count: number }[] }[]
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  // Find max count for color scaling
  const maxCount = Math.max(...data.flatMap(day => day.hours.map(h => h.count)))

  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700'
    const intensity = count / maxCount
    if (intensity < 0.25) return 'bg-blue-200 dark:bg-blue-900'
    if (intensity < 0.5) return 'bg-blue-300 dark:bg-blue-800'
    if (intensity < 0.75) return 'bg-blue-400 dark:bg-blue-700'
    return 'bg-blue-500 dark:bg-blue-600'
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Puncak Jam Penggunaan
        </CardTitle>
        <CardDescription>
          Heatmap frekuensi booking berdasarkan hari dan jam
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header with hours */}
            <div className="flex mb-2">
              <div className="w-20"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-8 h-6 text-xs text-center text-gray-600 dark:text-gray-400">
                  {i}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {data.map((dayData) => (
              <div key={dayData.day} className="flex items-center mb-1">
                <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 pr-2">
                  {dayData.day}
                </div>
                {dayData.hours.map((hourData) => (
                  <div
                    key={hourData.hour}
                    className={`w-8 h-8 rounded-sm border border-gray-200 dark:border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md ${getColorIntensity(hourData.count)}`}
                    title={`${dayData.day} ${hourData.hour}:00 - ${hourData.count} bookings`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center mt-4 space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rendah</span>
          <div className="flex space-x-1">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-sm"></div>
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 rounded-sm"></div>
            <div className="w-4 h-4 bg-blue-300 dark:bg-blue-800 rounded-sm"></div>
            <div className="w-4 h-4 bg-blue-400 dark:bg-blue-700 rounded-sm"></div>
            <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded-sm"></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Tinggi</span>
        </div>
      </CardContent>
    </Card>
  )
}