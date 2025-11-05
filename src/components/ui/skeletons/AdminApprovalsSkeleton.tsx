import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'
import { useUserData } from "@/hooks/useUserData"

export const AdminApprovalsSkeleton: React.FC = () => {
  const { slideUp } = useSkeletonAnimation()
  const { user, profile, isLoading } = useUserData()

  return (
    <BaseSkeleton 
      className="space-y-6" 
      user={user}
      profile={profile}
      isAdmin={true}
      isLoading={isLoading}
    >
      <motion.div
        {...slideUp}
        className="mb-8"
        data-testid="approvals-header-skeleton"
      >
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        {...slideUp}
        transition={{ ...slideUp.transition, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        data-testid="overview-cards-skeleton"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            {...slideUp}
            transition={{ ...slideUp.transition, delay: 0.2 + i * 0.1 }}
            className="bg-card rounded-lg p-6"
            data-testid={`overview-card-skeleton-${i}`}
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
      </motion.div>

      {/* Approvals Card */}
      <motion.div
        {...slideUp}
        transition={{ ...slideUp.transition, delay: 0.5 }}
        className="bg-card rounded-lg p-6"
        data-testid="approvals-content-skeleton"
      >
        <div className="flex items-center mb-4">
          <Skeleton className="w-5 h-5 mr-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        {/* Booking Items */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              {...slideUp}
              transition={{ ...slideUp.transition, delay: 0.6 + i * 0.1 }}
              className="p-4 bg-muted/50 rounded-lg"
              data-testid={`booking-item-skeleton-${i}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </BaseSkeleton>
  )
}