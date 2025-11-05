// Homepage Content Skeleton - Content area only
// Header dan navigation menggunakan BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const HomepageContentSkeleton: React.FC = () => {
  const { slideUp, shimmer } = useSkeletonAnimation()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.section
        {...slideUp}
        className="text-center py-20"
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-16 w-full max-w-3xl mx-auto" data-testid="hero-title-skeleton" />
          <Skeleton className="h-16 w-3/4 max-w-2xl mx-auto" />
          <Skeleton className="h-6 w-full max-w-3xl mx-auto" data-testid="hero-calendar-skeleton" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-48 mx-auto sm:mx-0" />
          </div>
          <div className="flex items-center justify-center gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Rooms Section */}
      <motion.section
        {...slideUp}
        className="py-20"
      >
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </motion.section>
    </div>
  )
}