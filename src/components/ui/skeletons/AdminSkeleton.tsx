'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const AdminSkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
        <div className="p-6 border-b">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Header Skeleton */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16"
      >
        <div className="px-6 h-full flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </motion.header>

      {/* Content Skeleton */}
      <main className="ml-64 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </motion.div>

        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.div
                className="bg-card rounded-lg p-6"
                {...shimmer}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Data Table Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="bg-card rounded-lg p-6"
            {...shimmer}
          >
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            {/* Table Rows */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}