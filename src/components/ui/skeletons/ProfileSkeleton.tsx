'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkeletonAnimation } from '@/hooks/useAnimations'

export const ProfileSkeleton: React.FC = () => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <div className="min-h-screen bg-background" data-testid="profile-skeleton">
      <main className={`px-6 pb-8 pt-24 transition-all duration-300 ml-64`}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="bg-card rounded-lg p-6"
              {...shimmer}
            >
              {/* Profile Photo */}
              <div className="flex flex-col items-center space-y-4 mb-6" data-testid="profile-photo-skeleton">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2" data-testid="form-field-skeleton">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2" data-testid="form-field-skeleton">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2" data-testid="form-field-skeleton">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2" data-testid="form-field-skeleton">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Account Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6" data-testid="account-info-skeleton">
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}