'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Building, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Room } from '@/lib/api'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Pesan Ruangan"
        description="Pilih ruangan yang ingin Anda pesan"
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-6xl mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col h-full">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Header with Image or Icon */}
                  <div className="h-32 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {room.photos && room.photos.length > 0 ? (
                        <img
                          src={room.photos[0]}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building className="w-16 h-16 text-white/80" />
                      )}
                    </motion.div>
                    {/* Floating elements */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-12 h-12 bg-white/20 rounded-full"
                    />
                  </div>

                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-h-[60px]">
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {room.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                          {room.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        <Users className="w-4 h-4" />
                        {room.capacity}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 flex flex-col flex-grow">
                    <div className="mb-6 flex flex-col" style={{ minHeight: '120px' }}>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        Fasilitas
                      </h4>
                      <div className="flex flex-wrap gap-2 flex-1 min-h-0">
                        {room.facilities.map((facility, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + idx * 0.05 }}
                            className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium"
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
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 group-hover:shadow-lg transition-all duration-300"
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