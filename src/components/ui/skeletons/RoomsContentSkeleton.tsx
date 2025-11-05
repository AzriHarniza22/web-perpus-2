// Rooms Content Skeleton
// Content area only - sidebar dan page header dari BaseSkeleton

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useSkeletonAnimation } from "@/hooks/useSkeletonAnimation"

export const RoomsContentSkeleton: React.FC = () => {
  const { slideUp } = useSkeletonAnimation()

  return (
    <motion.div
      {...slideUp}
      className="space-y-6"
    >
      {/* Page Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </motion.div>

      {/* Room Management Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg p-6"
      >
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
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
      </motion.div>
    </motion.div>
  )
}