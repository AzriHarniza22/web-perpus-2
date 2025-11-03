'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const HomepageSkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" data-testid="homepage-skeleton">
      {/* Navigation Skeleton */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 h-20"
        data-testid="navigation-skeleton"
      >
        <div className="px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-16" />
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </motion.nav>

      {/* Hero Section Skeleton */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text Skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center lg:text-left space-y-6"
            >
              <div className="space-y-4">
                <Skeleton className="h-16 w-full max-w-lg mx-auto lg:mx-0" data-testid="hero-title-skeleton" />
                <Skeleton className="h-16 w-3/4 max-w-md mx-auto lg:mx-0" />
                <Skeleton className="h-6 w-full max-w-xl mx-auto lg:mx-0" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Skeleton className="h-12 w-48" />
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Calendar Skeleton */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
              data-testid="hero-calendar-skeleton"
            >
              <motion.div
                className="bg-card rounded-2xl shadow-xl p-6"
                {...shimmer}
              >
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-8" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded" />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rooms Section Skeleton */}
      <section className="py-20 bg-background">
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Skeleton className="h-12 w-64 mx-auto mb-6" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  data-testid="room-card-skeleton"
                >
                  <motion.div
                    className="bg-card rounded-lg p-6 space-y-4 h-80"
                    {...shimmer}
                  >
                    <Skeleton className="h-48 w-full rounded-md" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}