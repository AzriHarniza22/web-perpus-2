// Profile Content Skeleton
// Content area only - sidebar dan page header dari BaseSkeleton

import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const ProfileContentSkeleton: React.FC = () => {
  const { slideUp } = useSkeletonAnimation()

  return (
    <motion.div
      {...slideUp}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Profile Card */}
      <div className="bg-card rounded-lg p-6 space-y-6">
        {/* Profile Photo */}
        <div data-testid="profile-photo-skeleton" className="flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-6 w-32 mt-4" />
        </div>

        {/* Role (Read-only) */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Form Fields */}
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
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton data-testid="form-field-skeleton" className="h-10 w-full" />
          </div>
        </div>

        {/* Account Info */}
        <div data-testid="account-info-skeleton" className="pt-4 border-t space-y-2">
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
      </div>
    </motion.div>
  )
}