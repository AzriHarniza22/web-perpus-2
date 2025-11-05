// Book Tour Content Skeleton - Content area only
// Header dan navigation menggunakan BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const BookTourContentSkeleton: React.FC = () => {
  const { slideUp, shimmer } = useSkeletonAnimation()

  return (
    <motion.div
      className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-3 xl:gap-4"
      {...slideUp}
    >
      {/* Tour Info Card */}
      <div className="flex-1">
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.1 }}
          data-testid="tour-info-card-skeleton"
        >
          <motion.div
            className="bg-card rounded-lg p-6"
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
      <div className="flex-1">
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.2 }}
          data-testid="calendar-card-skeleton"
        >
          <motion.div
            className="bg-card rounded-lg p-6"
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
      <div className="flex-1">
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.3 }}
          data-testid="booking-form-card-skeleton"
        >
          <motion.div
            className="bg-card rounded-lg p-6"
            {...shimmer}
          >
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton data-testid="form-field-skeleton" className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton data-testid="form-field-skeleton" className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton data-testid="form-field-skeleton" className="h-10 w-full" />
              </div>
              <Skeleton data-testid="submit-button-skeleton" className="h-12 w-full mt-6" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}