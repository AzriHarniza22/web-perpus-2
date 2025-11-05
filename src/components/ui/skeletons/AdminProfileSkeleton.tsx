import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'
import { useUserData } from "@/hooks/useUserData"

export const AdminProfileSkeleton: React.FC = () => {
  const { slideUp } = useSkeletonAnimation()
  const { user, profile, isLoading } = useUserData()

  return (
    <BaseSkeleton 
      className="max-w-2xl mx-auto"
      user={user}
      profile={profile}
      isAdmin={true}
      isLoading={isLoading}
    >
      <motion.div
        {...slideUp}
        className="bg-card rounded-lg p-6 space-y-6"
        data-testid="admin-profile-form-skeleton"
      >
        {/* Profile Photo */}
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.1 }}
          className="flex flex-col items-center"
          data-testid="profile-photo-skeleton"
        >
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-6 w-32 mt-4" />
        </motion.div>

        {/* Role (Read-only) */}
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.2 }}
          className="space-y-2"
        >
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </motion.div>

        {/* Form Fields */}
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.3 }}
          className="space-y-4"
        >
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
        </motion.div>

        {/* Account Info */}
        <motion.div
          {...slideUp}
          transition={{ ...slideUp.transition, delay: 0.5 }}
          className="pt-4 border-t space-y-2"
          data-testid="account-info-skeleton"
        >
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
        </motion.div>
      </motion.div>
    </BaseSkeleton>
  )
}