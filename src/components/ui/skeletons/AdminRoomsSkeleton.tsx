import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export const AdminRoomsSkeleton: React.FC = () => (
  <BaseSkeleton>
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
    >
      <div className="bg-card rounded-lg p-6">
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