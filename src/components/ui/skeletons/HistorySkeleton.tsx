'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const HistorySkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-8 pt-24 transition-all duration-300 ml-64">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            {/* Booking Cards Skeleton */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <motion.div
                  className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 bg-card rounded-lg p-6"
                  {...shimmer}
                >
                  <div className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Room Name */}
                        <Skeleton className="h-6 w-48 mb-2" />

                        {/* Date and Time */}
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <Skeleton className="h-6 w-20 rounded-full" />

                        {/* Delete Button */}
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-0">
                    {/* Event Description */}
                    <div className="mb-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>

                    {/* Notes */}
                    <div className="mb-1">
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Created Date */}
                    <Skeleton className="h-3 w-48" />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}