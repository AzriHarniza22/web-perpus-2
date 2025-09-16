'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  facilities: string[]
  photos: string[] | null
  layout: string | null
  is_active: boolean
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    facilities: '',
    photos: '',
    layout: '',
  })

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching rooms:', error)
    } else {
      setRooms(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const roomData = {
      name: formData.name,
      description: formData.description || null,
      capacity: parseInt(formData.capacity),
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f),
      photos: formData.photos.split(',').map(p => p.trim()).filter(p => p) || null,
      layout: formData.layout || null,
    }

    if (editingRoom) {
      const { error } = await supabase
        .from('rooms')
        .update(roomData)
        .eq('id', editingRoom.id)

      if (error) {
        console.error('Error updating room:', error)
      } else {
        setEditingRoom(null)
        fetchRooms()
      }
    } else {
      const { error } = await supabase
        .from('rooms')
        .insert(roomData)

      if (error) {
        console.error('Error creating room:', error)
      } else {
        fetchRooms()
      }
    }

    setFormData({
      name: '',
      description: '',
      capacity: '',
      facilities: '',
      photos: '',
      layout: '',
    })
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity.toString(),
      facilities: room.facilities.join(', '),
      photos: room.photos?.join(', ') || '',
      layout: room.layout || '',
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting room:', error)
      } else {
        fetchRooms()
      }
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !is_active })
      .eq('id', id)

    if (error) {
      console.error('Error updating room status:', error)
    } else {
      fetchRooms()
    }
  }

  if (loading) {
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
            <Label htmlFor="photos">Photo URLs (comma-separated)</Label>
            <Input
              id="photos"
              value={formData.photos}
              onChange={(e) => setFormData(prev => ({ ...prev, photos: e.target.value }))}
            />
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
                  photos: '',
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
          {rooms.map((room) => (
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