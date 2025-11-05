// Analytics Content Skeleton
// Content area only - sidebar dan page header dari BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const AnalyticsContentSkeleton: React.FC = () => {
  const { slideUp, shimmer } = useSkeletonAnimation()

  return (
    <motion.div
      {...slideUp}
      className="space-y-6"
    >
      {/* Analytics Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </motion.div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Skeleton className="h-6 w-32" />
            </div>
            <motion.div {...shimmer}>
              <Skeleton className="h-80 w-full rounded-lg" />
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}