import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export const ProfileContentSkeleton: React.FC = () => {
  return (
    <BaseSkeleton className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Card */}
        <div className="bg-card rounded-lg p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
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
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t space-y-2">
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
    </BaseSkeleton>
  )
}