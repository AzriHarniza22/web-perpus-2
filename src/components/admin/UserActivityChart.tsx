'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface UserActivityChartProps {
  data: { date: string; activeUsers: number; bookings: number; newRegistrations: number }[]
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" />
          Aktivitas Pengguna
        </CardTitle>
        <CardDescription>
          Tren aktivitas pengguna harian: pengguna aktif, reservasi, dan pendaftaran baru
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="dark:fill-gray-400"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="dark:fill-gray-400"
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
                  value,
                  name === 'activeUsers' ? 'Pengguna Aktif' :
                  name === 'bookings' ? 'Reservasi' : 'Pendaftaran Baru'
                ]}
                labelFormatter={(label) => `Tanggal: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="newRegistrations"
                stackId="1"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#colorRegistrations)"
                className="hover:opacity-80 transition-opacity duration-200"
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stackId="1"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorBookings)"
                className="hover:opacity-80 transition-opacity duration-200"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#colorActiveUsers)"
                className="hover:opacity-80 transition-opacity duration-200"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Pengguna Aktif</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-primary-500 mr-2"></div>
            <span className="text-sm">Reservasi</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Pendaftaran Baru</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}