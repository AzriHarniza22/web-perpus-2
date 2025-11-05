// Admin Dashboard Content Skeleton
// Content area only - sidebar dan page header dari BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const AdminDashboardContentSkeleton: React.FC = () => {
  const { slideUp, shimmer } = useSkeletonAnimation()

  return (
    <motion.div
      {...slideUp}
      className="space-y-6"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 mb-3"
      >
        <Skeleton className="h-8 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-card rounded-lg p-3"
          >
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0"
      >
        <div className="lg:col-span-2">
          <div className="h-full flex flex-col bg-card rounded-lg">
            <div className="flex-shrink-0 p-4 pb-2">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex-1 min-h-0 p-4 pt-0">
              <motion.div {...shimmer}>
                <Skeleton className="h-full w-full rounded-lg" />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1 min-h-0 bg-card rounded-lg">
            <div className="flex-shrink-0 p-4 pb-2">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-4 pt-0 flex-1 overflow-auto">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="mb-2"
                >
                  <Skeleton className="h-16 w-full rounded-lg" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}