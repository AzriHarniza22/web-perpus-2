'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageCarousel } from '@/components/ui/image-carousel'
import { Users, MapPin, Info, Clock, Ban, Shield, Star, DollarSign } from 'lucide-react'

interface Tour {
  id: string
  name: string
  description: string | null
  capacity: number
  facilities: string[] | null
  photos: string[] | null
  layout: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TourInfoCardProps {
  tour: Tour
}

export default function TourInfoCard({ tour }: TourInfoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (photo: string) => {
    setImageErrors(prev => new Set(prev).add(photo))
  }

  const isImageValid = (photo: string) => {
    return photo && !imageErrors.has(photo) && photo.trim() !== ''
  }

  return (
    <>
      <Card className="bg-card backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="relative z-10 flex-shrink-0">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {tour.name}
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
            Informasi lengkap tour yang dipilih
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 overflow-y-auto space-y-4">
          {/* Photo Gallery */}
          {tour.photos && tour.photos.length > 0 && (
            <div className="flex-shrink-0">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center text-sm">
                <Info className="w-4 h-4 mr-2 text-green-500" />
                Galeri Tour
              </h3>
              <div className="h-40 sm:h-44 md:h-48">
                <ImageCarousel
                  photos={tour.photos.filter(photo => isImageValid(photo))}
                  alt={tour.name}
                  onImageClick={(photo) => {
                    if (isImageValid(photo)) {
                      setSelectedImage(photo)
                      setIsModalOpen(true)
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Tour Information */}
          <div className="flex-shrink-0 space-y-3">
            {tour.description && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Info className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Deskripsi</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{tour.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Kapasitas</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{tour.capacity} orang</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Durasi</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">1 jam</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Harga</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Gratis</p>
              </div>
            </div>

            {tour.facilities && tour.facilities.length > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center text-sm">
                  <Star className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" />
                  Yang Akan Dilihat
                </h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {tour.facilities.slice(0, 10).map((facility: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs px-2.5 py-1.5">
                      {facility}
                    </Badge>
                  ))}
                  {tour.facilities.length > 10 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs px-2.5 py-1.5">
                      +{tour.facilities.length - 10}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tour Rules Section */}
          <div className="flex-shrink-0 space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center text-sm">
                <Shield className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                Aturan Tour
              </h4>
              <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Clock className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Datang 15 menit sebelum waktu mulai</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Dilarang membawa makanan/minuman</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
            {isImageValid(selectedImage) ? (
              <Image
                src={selectedImage}
                alt="Zoomed tour image"
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                onError={() => handleImageError(selectedImage)}
              />
            ) : (
              <div className="max-w-full max-h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium">Gambar tidak dapat dimuat</p>
                  <p className="text-sm">Gambar mungkin telah dihapus atau URL tidak valid</p>
                </div>
              </div>
            )}
            <button
              className="absolute top-2 right-2 bg-background/75 rounded-full p-2 hover:bg-background transition"
              onClick={() => setIsModalOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}