'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const BookTourSkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="h-[calc(100vh-106px)] sm:h-[calc(100vh-112px)] lg:h-[calc(100vh-116px)] flex flex-col">
      {/* Three Column Layout */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-3 xl:gap-4 flex-1 min-h-0">
        {/* Tour Info Card */}
        <div className="flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="bg-card rounded-lg p-6 h-full"
              {...shimmer}
            >
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-48 w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Calendar Card */}
        <div className="flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="bg-card rounded-lg p-6 h-full"
              {...shimmer}
            >
              <Skeleton className="h-8 w-32 mb-4" />
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

        {/* Form Card */}
        <div className="flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="bg-card rounded-lg p-6 h-full"
              {...shimmer}
            >
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-12 w-full mt-6" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}