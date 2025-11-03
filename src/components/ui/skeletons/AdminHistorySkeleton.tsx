import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export const AdminHistorySkeleton: React.FC = () => {
  return (
    <BaseSkeleton className="space-y-6">
      {/* History Overview Cards */}
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <Skeleton className="h-10 w-24" data-testid="tab-skeleton" />
        <Skeleton className="h-10 w-20" data-testid="tab-skeleton" />
      </div>

      {/* Content Area */}
      <Skeleton className="h-96 w-full rounded-lg" data-testid="content-area-skeleton" />
    </BaseSkeleton>
  )
}