'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRooms, useUpsertRoom, useDeleteRoom, useToggleRoomActive, type Room } from '@/lib/api'
import { supabase } from '@/lib/supabase'


export default function RoomManagement() {
  const { data: rooms = [], isLoading } = useRooms()
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    facilities: '',
    photos: [] as string[],
    layout: '',
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
      layout: formData.layout || undefined,
      ...(editingRoom && { id: editingRoom.id }),
    }

    upsertRoomMutation.mutate(roomData)

    setFormData({
      name: '',
      description: '',
      capacity: '',
      facilities: '',
      photos: [],
      layout: '',
    })
    if (editingRoom) {
      setEditingRoom(null)
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity.toString(),
      facilities: room.facilities.join(', '),
      photos: room.photos || [],
      layout: room.layout || '',
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Management</CardTitle>
        <CardDescription>Manage library rooms and their details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="facilities">Facilities (comma-separated)</Label>
            <Input
              id="facilities"
              value={formData.facilities}
              onChange={(e) => setFormData(prev => ({ ...prev, facilities: e.target.value }))}
              placeholder="Proyektor, Sound System, Panggung"
            />
          </div>
          <div>
            <Label htmlFor="photos">Room Photos</Label>
            <input
              id="photos"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.photos.map((url, index) => (
                <img key={index} src={url} alt={`Room photo ${index + 1}`} className="w-20 h-20 object-cover" />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="layout">Layout Description</Label>
            <Input
              id="layout"
              value={formData.layout}
              onChange={(e) => setFormData(prev => ({ ...prev, layout: e.target.value }))}
            />
          </div>
          <Button type="submit">
            {editingRoom ? 'Update Room' : 'Add Room'}
          </Button>
          {editingRoom && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingRoom(null)
                setFormData({
                  name: '',
                  description: '',
                  capacity: '',
                  facilities: '',
                  photos: [],
                  layout: '',
                })
              }}
            >
              Cancel
            </Button>
          )}
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Rooms</h3>
          {rooms.map((room: Room) => (
            <div key={room.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{room.name}</h4>
                  <p className="text-sm text-gray-600">Capacity: {room.capacity}</p>
                  <p className="text-sm text-gray-600">Status: {room.is_active ? 'Active' : 'Inactive'}</p>
                  {room.facilities && room.facilities.length > 0 && (
                    <p className="text-sm text-gray-600">Facilities: {room.facilities.join(', ')}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(room)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(room.id, room.is_active)}
                  >
                    {room.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(room.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
