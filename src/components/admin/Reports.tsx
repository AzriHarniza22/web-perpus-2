'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingStats } from '@/lib/api'


export default function Reports() {
  const { data: stats, isLoading } = useBookingStats()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!stats) {
    return <div>Error loading statistics</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan & Statistik</CardTitle>
        <CardDescription>Statistik penggunaan ruangan dan reservasi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Total Reservasi</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">Disetujui</h3>
            <p className="text-2xl font-bold text-green-600">{stats.approvedBookings}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900">Menunggu</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">Ditolak</h3>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedBookings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Statistik per Ruangan</h3>
            <div className="space-y-2">
              {stats.roomStats.map((room, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{room.room_name}</span>
                  <span className="font-semibold">{room.booking_count} reservasi</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Statistik Bulanan</h3>
            <div className="space-y-2">
              {stats.monthlyStats.slice(0, 6).map((month, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{month.month}</span>
                  <span className="font-semibold">{month.count} reservasi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}