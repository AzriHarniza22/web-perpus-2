'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const RoomSkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
        <div className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="ml-64 pt-24 px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </motion.div>

        {/* Room Detail Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery Skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="bg-card rounded-lg p-6"
                {...shimmer}
              >
                <Skeleton className="h-64 w-full rounded-md mb-4" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded" />
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Room Info Skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="bg-card rounded-lg p-6 space-y-4"
                {...shimmer}
              >
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>

                <Skeleton className="h-12 w-full mt-6" />
              </motion.div>
            </motion.div>
          </div>

          {/* Additional Info Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <motion.div
              className="bg-card rounded-lg p-6"
              {...shimmer}
            >
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}