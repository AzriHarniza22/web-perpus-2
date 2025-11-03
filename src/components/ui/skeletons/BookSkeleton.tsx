'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const BookSkeleton: React.FC = () => {
  const { shimmer, slideUp } = useSkeletonAnimation({ loading: true })

  return (
    <main className="pb-8 pt-24 transition-all duration-300 ml-64">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          {...slideUp}
          className="mb-8"
          data-testid="header-skeleton"
        >
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </motion.div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              {...slideUp}
              transition={{ ...slideUp.transition, delay: i * 0.1 }}
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
    </main>
  )
}