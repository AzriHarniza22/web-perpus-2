import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export const ApprovalsContentSkeleton: React.FC = () => {
  return (
    <BaseSkeleton className="space-y-6">
      {/* Overview Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Approvals Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Skeleton className="w-5 h-5 mr-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64 mb-6" />

          {/* Booking Items */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-lg">
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
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </BaseSkeleton>
  )
}