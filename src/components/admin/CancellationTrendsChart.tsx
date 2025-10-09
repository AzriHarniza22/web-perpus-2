'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'

interface CancellationTrendsChartProps {
  data: { month: string; cancellations: number; totalBookings: number; cancellationRate: number }[]
}

export function CancellationTrendsChart({ data }: CancellationTrendsChartProps) {
  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingDown className="w-5 h-5 mr-2 text-primary" />
          Tren Pembatalan
        </CardTitle>
        <CardDescription>
          Tingkat pembatalan dibandingkan dengan total reservasi per bulan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="dark:fill-gray-400"
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="dark:fill-gray-400"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="dark:fill-gray-400"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(8px)',
                }}
                labelStyle={{ color: '#374151' }}
                formatter={(value: number, name: string) => [
                  name === 'cancellationRate' ? `${value.toFixed(1)}%` : value,
                  name === 'cancellations' ? 'Pembatalan' :
                  name === 'totalBookings' ? 'Total Reservasi' : 'Tingkat Pembatalan'
                ]}
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cancellations"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                className="hover:opacity-80 transition-opacity duration-200"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalBookings"
                stroke="#3B82F6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                className="hover:opacity-80 transition-opacity duration-200"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cancellationRate"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-500 mr-2"></div>
            <span className="text-sm">Pembatalan</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-primary-500 mr-2 border-dashed border-t-2"></div>
            <span className="text-sm">Total Reservasi</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-yellow-500 mr-2"></div>
            <span className="text-sm">Tingkat Pembatalan (%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}