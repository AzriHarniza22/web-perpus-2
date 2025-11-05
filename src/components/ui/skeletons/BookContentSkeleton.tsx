// Book Content Skeleton - Content area only for room booking page
// Sidebar dan page header dari BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const BookContentSkeleton: React.FC = () => {
  const { slideUp, shimmer } = useSkeletonAnimation()

  return (
    <div className="space-y-8">
      {/* Header Section */}
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
  )
}