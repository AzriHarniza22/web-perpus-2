'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface ImageCarouselProps {
  photos: string[]
  alt: string
}

export function ImageCarousel({ photos, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  if (photos.length === 0) return null

  return (
    <div className="relative h-full overflow-hidden rounded-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-md overflow-hidden"
        >
          <Image
            src={photos[currentIndex]}
            alt={`${alt} - ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/50 hover:bg-white/70 text-white border-0 rounded-full"
            onClick={prevImage}
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/50 hover:bg-white/70 text-white border-0 rounded-full"
            onClick={nextImage}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}