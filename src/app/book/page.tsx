'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Building, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Room } from '@/lib/api'
import { ImageCarousel } from '@/components/ui/image-carousel'

export default function BookRoomPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
            .neq('name', 'Library Tour')
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
    return <Loading variant="fullscreen" />
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Pesan Ruangan"
        description="Pilih ruangan yang ingin Anda pesan"
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`pb-8 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-card backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group relative overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-800">

                  {/* Header with Image or Icon */}
                  {room.photos && room.photos.length > 1 ? (
                    <div className="h-48 bg-muted relative overflow-hidden">
                      <ImageCarousel photos={room.photos} alt={room.name} />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300 rounded-md" />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center rounded-md overflow-hidden"
                      >
                        {room.photos && room.photos.length === 1 ? (
                          <Image
                            src={room.photos[0]}
                            alt={room.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Building className="w-16 h-16 text-white/80" />
                        )}
                      </motion.div>
                      {/* Floating elements */}
                    </div>
                  )}

                  <CardHeader className="relative z-10 pb-4 px-6 h-20">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-foreground transition-colors duration-300 line-clamp-2">
                          {room.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                        <Users className="w-4 h-4" />
                        {room.capacity}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 flex flex-col flex-grow px-6">
                    <div className="h-16">
                      <CardDescription className="text-muted-foreground line-clamp-2">
                        {room.description}
                      </CardDescription>
                    </div>

                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
                        Fasilitas
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {room.facilities.map((facility, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + idx * 0.05 }}
                            className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors duration-200"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {facility}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-auto"
                    >
                      <Button
                        onClick={() => router.push(`/book/${room.id}`)}
                        variant="default"
                        size="lg"
                        className="w-full group-hover:shadow-lg transition-all duration-300"
                      >
                        Pesan Ruangan Ini
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada ruangan yang tersedia saat ini.</p>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}