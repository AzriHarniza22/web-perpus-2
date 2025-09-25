'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface RoomUtilizationGaugeProps {
  data: { roomId: string; roomName: string; capacity: number; utilizationPercentage: number }[]
}

function Gauge({ percentage, roomName }: { percentage: number; roomName: string }) {
  const radius = 40
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct < 50) return '#10B981'
    if (pct < 80) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
            className="dark:stroke-gray-600"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{roomName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Utilisasi</p>
      </div>
    </div>
  )
}

export function RoomUtilizationGauge({ data }: RoomUtilizationGaugeProps) {
  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Utilisasi Ruangan
        </CardTitle>
        <CardDescription>
          Persentase pemanfaatan kapasitas ruangan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.map((room) => (
            <Gauge
              key={room.roomId}
              percentage={room.utilizationPercentage}
              roomName={room.roomName}
            />
          ))}
        </div>
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Tidak ada data utilisasi ruangan
          </div>
        )}
      </CardContent>
    </Card>
  )
}