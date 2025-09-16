'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Room {
  id: string
  name: string
  description: string
  capacity: number
  facilities: string[]
  is_active: boolean
}

export default function BookRoomPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchRooms = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        console.log('User not authenticated')
        setLoading(false)
        return
      }

      const fetchRooms = async () => {
        try {
          const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('is_active', true)
            .order('name')

          if (error) {
            console.error('Error fetching rooms:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
          } else {
            console.log('Rooms fetched successfully:', data)
            setRooms(data || [])
          }
        } catch (err) {
          console.error('Unexpected error:', err)
        }
        setLoading(false)
      }

      fetchRooms()
    }

    checkAuthAndFetchRooms()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading rooms...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Anda perlu login untuk memesan ruangan
          </h1>
          <p className="text-gray-600 mb-6">
            Silakan login terlebih dahulu untuk melanjutkan pemesanan.
          </p>
          <Button onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pesan Ruangan
          </h1>
          <p className="text-gray-600">Pilih ruangan yang ingin Anda pesan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {room.name}
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                    Kapasitas: {room.capacity}
                  </span>
                </CardTitle>
                <CardDescription>{room.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Fasilitas:</h4>
                  <div className="flex flex-wrap gap-1">
                    {room.facilities.map((facility, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/book/${room.id}`)}
                  className="w-full"
                >
                  Pesan Ruangan Ini
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada ruangan yang tersedia saat ini.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}