'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { useInViewAnimation, useHoverAnimation } from '@/hooks/useAnimations'

interface RoomUsageChartProps {
  data: { room: string; bookings: number; capacity: number }[]
}

export function RoomUsageChart({ data }: RoomUsageChartProps) {
  const inViewAnimation = useInViewAnimation({ variant: 'slide', direction: 'up', delay: 0.1 })
  const hoverAnimation = useHoverAnimation()

  return (
    <motion.div
      {...inViewAnimation}
      className="w-full"
    >
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Penggunaan Ruangan
          </CardTitle>
          <CardDescription>
            Jumlah booking per ruangan dengan indikator kapasitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className="h-64 w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="horizontal"
                margin={{
                  top: 20,
                  right: 30,
                  left: 60,
                  bottom: 5,
                }}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  className="dark:fill-gray-400"
                />
                <YAxis
                  type="category"
                  dataKey="room"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  className="dark:fill-gray-400"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'bookings' ? 'Reservasi' : 'Kapasitas'
                  ]}
                  labelFormatter={(label) => `Ruangan: ${label}`}
                />
                <Bar
                  dataKey="bookings"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
                {data.map((item, index) => (
                  <ReferenceLine
                    key={index}
                    y={item.room}
                    x={item.capacity}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{
                      value: item.capacity.toString(),
                      position: 'right',
                      fontSize: 10,
                      fill: '#EF4444'
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {data.map((item, index) => (
              <motion.div
                key={item.room}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              >
                <span className="text-sm font-medium">{item.room}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary">{item.bookings} reservasi</span>
                  <span className="text-sm text-gray-500">/ {item.capacity} kapasitas</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}