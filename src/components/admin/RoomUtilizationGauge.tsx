'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { useInViewAnimation, useStaggerAnimation, useLoadingAnimation } from '@/hooks/useAnimations'

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
    <motion.div
      className="flex flex-col items-center space-y-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
    >
      <div className="relative">
        <motion.svg
          width="100"
          height="100"
          className="transform -rotate-90"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 150 }}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
            className="dark:stroke-gray-600"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            strokeLinecap="round"
          />
        </motion.svg>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4, type: "spring", stiffness: 300 }}
        >
          <motion.span
            className="text-2xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            {percentage.toFixed(0)}%
          </motion.span>
        </motion.div>
      </div>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{roomName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Utilisasi</p>
      </motion.div>
    </motion.div>
  )
}

export function RoomUtilizationGauge({ data }: RoomUtilizationGaugeProps) {
  const inViewAnimation = useInViewAnimation({ variant: 'slide', direction: 'up', delay: 0.1 })
  const staggerAnimation = useStaggerAnimation({ staggerDelay: 0.1, itemDelay: 0.2 })

  return (
    <motion.div
      {...inViewAnimation}
      className="w-full"
    >
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Utilisasi Ruangan
          </CardTitle>
          <CardDescription>
            Persentase pemanfaatan kapasitas ruangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            {...staggerAnimation.container}
          >
            {data.map((room, index) => (
              <motion.div
                key={room.roomId}
                {...staggerAnimation.item}
                transition={{ delay: index * 0.1 }}
              >
                <Gauge
                  percentage={room.utilizationPercentage}
                  roomName={room.roomName}
                />
              </motion.div>
            ))}
          </motion.div>
          {data.length === 0 && (
            <motion.div
              className="text-center py-8 text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Tidak ada data utilisasi ruangan
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}