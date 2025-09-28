'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useTours, useUpsertTour, useDeleteTour, useToggleTourActive, type Tour } from '@/lib/api'
import { Plus, Edit, Trash2, Power, MapPin, Users, CheckCircle, Sparkles } from 'lucide-react'

export default function TourManagement() {
  const { data: tours = [], isLoading } = useTours()
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    capacity: '',
    schedule: '',
  })

  const upsertTourMutation = useUpsertTour()
  const deleteTourMutation = useDeleteTour()
  const toggleTourActiveMutation = useToggleTourActive()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tourData = {
      name: formData.name,
      description: formData.description || undefined,
      duration: parseInt(formData.duration),
      capacity: parseInt(formData.capacity),
      schedule: formData.schedule ? JSON.parse(formData.schedule) : undefined,
      ...(editingTour && { id: editingTour.id }),
    }

    upsertTourMutation.mutate(tourData)

    setFormData({
      name: '',
      description: '',
      duration: '',
      capacity: '',
      schedule: '',
    })
    setEditingTour(null)
    setDialogOpen(false)
  }

  const handleEdit = (tour: Tour) => {
    setEditingTour(tour)
    setFormData({
      name: tour.name,
      description: tour.description || '',
      duration: tour.duration.toString(),
      capacity: tour.capacity.toString(),
      schedule: tour.schedule ? JSON.stringify(tour.schedule, null, 2) : '',
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tour?')) {
      deleteTourMutation.mutate(id)
    }
  }

  const toggleActive = (id: string, is_active: boolean) => {
    toggleTourActiveMutation.mutate({ id, is_active })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add Tour Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tour List</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage all available tours</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTour(null)
                setFormData({
                  name: '',
                  description: '',
                  duration: '',
                  capacity: '',
                  schedule: '',
                })
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTour ? 'Edit Tour' : 'Add New Tour'}</DialogTitle>
              <DialogDescription>
                {editingTour ? 'Update tour details' : 'Add a new tour to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tour Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g., General Library Tour"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    required
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                    placeholder="15"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the tour..."
                />
              </div>
              <div>
                <Label htmlFor="schedule">Schedule (JSON format)</Label>
                <Textarea
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                  placeholder='[{"day": "monday", "start_time": "10:00"}, {"day": "wednesday", "start_time": "14:00"}]'
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Define recurring schedule. Leave empty for flexible booking.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingTour ? 'Update Tour' : 'Add Tour'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tour List */}
      {tours.length === 0 ? (
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
            <MapPin className="w-16 h-16 mx-auto" />
          </motion.div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tours available</h3>
          <p className="text-gray-600 dark:text-gray-400">Add the first tour to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tours.map((tour: Tour, index: number) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col h-full">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Header with Icon */}
                <div className="aspect-video bg-gradient-to-r from-green-400 via-green-500 to-green-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <MapPin className="w-16 h-16 text-white/80" />
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
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {tour.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                        {tour.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      <Users className="w-4 h-4" />
                      {tour.capacity}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 flex flex-col flex-grow">
                  <div className="mb-6 min-h-[60px]">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                      Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium">{tour.duration} min</span>
                      </div>
                      {tour.schedule && tour.schedule.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                          <span className="font-medium">{tour.schedule.length} slots</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant={tour.is_active ? "default" : "secondary"} className="text-xs">
                      {tour.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tour)}
                        className="p-2 hover:bg-blue-50 hover:border-blue-300 hover:text-black hover:scale-110 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={tour.is_active ? "secondary" : "default"}
                        onClick={() => toggleActive(tour.id, tour.is_active)}
                        className="p-2 hover:scale-110 transition-transform"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tour.id)}
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