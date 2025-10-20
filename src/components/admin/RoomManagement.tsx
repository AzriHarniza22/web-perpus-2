'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useRooms, useUpsertRoom, useDeleteRoom, useToggleRoomActive, type Room } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Power, Building, Users, CheckCircle, Sparkles, X } from 'lucide-react'
import { ImageCarousel } from '@/components/ui/image-carousel'


export default function RoomManagement() {
  const { data: rooms = [], isLoading } = useRooms()
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    facilities: '',
    photos: [] as string[],
  })

  const upsertRoomMutation = useUpsertRoom()
  const deleteRoomMutation = useDeleteRoom()
  const toggleRoomActiveMutation = useToggleRoomActive()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const roomData = {
      name: formData.name,
      description: formData.description || undefined,
      capacity: parseInt(formData.capacity),
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f),
      photos: formData.photos || undefined,
      ...(editingRoom && { id: editingRoom.id }),
    }

    upsertRoomMutation.mutate(roomData)

    setFormData({
      name: '',
      description: '',
      capacity: '',
      facilities: '',
      photos: [],
    })
    setEditingRoom(null)
    setDialogOpen(false)
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity.toString(),
      facilities: room.facilities.join(', '),
      photos: room.photos || [],
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
      deleteRoomMutation.mutate(id)
    }
  }

  const toggleActive = (id: string, is_active: boolean) => {
    toggleRoomActiveMutation.mutate({ id, is_active })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('room-images').upload(fileName, file)
      if (error) {
        console.error('Upload error:', error)
        continue
      }
      const { data: urlData } = supabase.storage.from('room-images').getPublicUrl(fileName)
      newUrls.push(urlData.publicUrl)
    }

    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newUrls] }))
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  // Debug logging to investigate room count issue
  console.log('=== ROOM MANAGEMENT DEBUG INFO ===')
  console.log('Total rooms received by RoomManagement:', rooms?.length || 0)
  console.log('All rooms data:', rooms?.map((room: Room) => ({
    id: room.id,
    name: room.name,
    is_active: room.is_active,
    capacity: room.capacity
  })))

  // Filter out Library Tour and check for inactive rooms
  const filteredRooms = rooms?.filter((room: Room) => room.name !== 'Library Tour') || []
  const activeRooms = filteredRooms.filter((room: Room) => room.is_active) || []
  const inactiveRooms = filteredRooms.filter((room: Room) => !room.is_active) || []

  console.log('Active rooms count:', activeRooms.length)
  console.log('Inactive rooms count:', inactiveRooms.length)
  console.log('Inactive rooms:', inactiveRooms.map((room: Room) => ({ id: room.id, name: room.name })))
  console.log('================================')

  return (
    <div className="space-y-6">
      {/* Add Room Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Ruangan</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Kelola semua ruangan yang tersedia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRoom(null)
                setFormData({
                  name: '',
                  description: '',
                  capacity: '',
                  facilities: '',
                  photos: [],
                })
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Ruangan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</DialogTitle>
              <DialogDescription>
                {editingRoom ? 'Perbarui detail ruangan' : 'Tambahkan ruangan baru ke sistem'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Ruangan</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Contoh: Ruang Rapat Utama"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Kapasitas</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsikan ruangan ini..."
                />
              </div>
              <div>
                <Label htmlFor="facilities">Fasilitas (pisahkan dengan koma)</Label>
                <Input
                  id="facilities"
                  value={formData.facilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, facilities: e.target.value }))}
                  placeholder="Proyektor, Sound System, Panggung"
                />
              </div>
              <div>
                <Label htmlFor="photos">Foto Ruangan</Label>
                <input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {uploading && <p className="text-sm text-primary mt-1">Mengunggah...</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.photos.map((url, index) => (
                    <div key={index} className="relative">
                      <Image src={url} alt={`Foto ruangan ${index + 1}`} width={80} height={80} className="object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingRoom ? 'Perbarui Ruangan' : 'Tambah Ruangan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room List */}
       {filteredRooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-gray-400 mb-4"
          >
            <Building className="w-16 h-16 mx-auto" />
          </motion.div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada ruangan</h3>
          <p className="text-gray-600 dark:text-gray-400">Tambahkan ruangan pertama untuk memulai</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredRooms.map((room: Room, index: number) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
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
                      {room.facilities && room.facilities.map((facility, idx) => (
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

                  <div className="flex items-center justify-between mt-auto mb-4">
                    <Badge variant={room.is_active ? "default" : "secondary"} className="text-xs">
                      {room.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(room)}
                        className="p-2 hover:bg-primary/10 hover:border-primary/30 hover:text-primary hover:scale-110 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={room.is_active ? "secondary" : "default"}
                        onClick={() => toggleActive(room.id, room.is_active)}
                        className="p-2 hover:scale-110 transition-transform"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(room.id)}
                        className="p-2 hover:bg-red-600 hover:scale-110 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
