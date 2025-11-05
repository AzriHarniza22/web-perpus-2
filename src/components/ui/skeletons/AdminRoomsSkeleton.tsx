import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

export const AdminRoomsSkeleton: React.FC = () => {
  const { slideUp } = useSkeletonAnimation()

  return (
    <BaseSkeleton isAdmin={true}>
      <motion.div
        {...slideUp}
        className="mb-8"
      >
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </motion.div>

      {/* Room Management Card */}
      <motion.div
        {...slideUp}
        transition={{ ...slideUp.transition, delay: 0.1 }}
      >
        <div className="bg-card rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                {...slideUp}
                transition={{ ...slideUp.transition, delay: 0.2 + i * 0.1 }}
                className="p-4 bg-muted/50 rounded-lg"
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
        </div>
      </motion.div>
    </BaseSkeleton>
  )
}