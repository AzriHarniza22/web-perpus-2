'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { useDragAnimation } from '@/hooks/useAnimations'

interface ImageCarouselProps {
  photos: string[]
  alt: string
  onImageClick?: (photo: string) => void
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function ImageCarousel({
  photos,
  alt,
  onImageClick,
  autoPlay = false,
  autoPlayInterval = 5000
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set())
  const [isHovered, setIsHovered] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Animation variants for smoother transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 1.05,
    }),
  }

  const [direction, setDirection] = useState(0)

  const nextImage = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const prevImage = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  const goToImage = useCallback((index: number) => {
    if (index === currentIndex) return
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && photos.length > 1 && !isHovered) {
      autoPlayRef.current = setInterval(nextImage, autoPlayInterval)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [autoPlay, photos.length, isHovered, autoPlayInterval, nextImage])

  // Preload images
  useEffect(() => {
    photos.forEach((photo, index) => {
      if (!imagesLoaded.has(index)) {
        const img = new window.Image()
        img.onload = () => {
          setImagesLoaded(prev => new Set([...prev, index]))
        }
        img.src = photo
      }
    })
  }, [photos, imagesLoaded])

  // Touch/swipe handlers
  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50
    if (info.offset.x > swipeThreshold) {
      prevImage()
    } else if (info.offset.x < -swipeThreshold) {
      nextImage()
    }
  }

  const dragProps = useDragAnimation()

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  if (photos.length === 0) return null

  return (
    <div
      ref={carouselRef}
      className="relative h-full overflow-hidden rounded-md group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.3 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 rounded-md overflow-hidden"
        >
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
            )}
            <Image
              src={photos[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              fill
              className="object-cover"
              onClick={() => onImageClick?.(photos[currentIndex])}
              onLoad={handleImageLoad}
              priority={currentIndex === 0}
            />

            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <>
          {/* Enhanced Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isHovered ? 1 : 0.7, x: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-0 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
              onClick={prevImage}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0.7, x: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-0 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
              onClick={nextImage}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Enhanced Dot Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          >
            {photos.map((_, index) => (
              <motion.button
                key={index}
                className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-white shadow-lg'
                    : 'w-3 h-3 bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => goToImage(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                layout
              >
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 bg-white rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Image counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-full z-10"
          >
            {currentIndex + 1} / {photos.length}
          </motion.div>
        </>
      )}
    </div>
  )
}