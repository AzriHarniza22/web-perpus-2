import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export const AdminDashboardContentSkeleton: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  return (
    <BaseSkeleton className="flex-1 overflow-auto">
      <motion.div
        className="p-4 h-full flex flex-col"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Title */}
        <motion.div
          variants={fadeInUp}
          className="flex-shrink-0 mb-3"
        >
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"
        >
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-card rounded-lg p-3">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid - Flexible */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0"
        >
          <div className="lg:col-span-2">
            <div className="h-full flex flex-col bg-card rounded-lg">
              <div className="flex-shrink-0 p-4 pb-2">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex-1 min-h-0 p-4 pt-0">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex-1 min-h-0 bg-card rounded-lg">
              <div className="flex-shrink-0 p-4 pb-2">
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="p-4 pt-0 flex-1 overflow-auto">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Skeleton className="h-16 w-full mb-2" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </BaseSkeleton>
  )
}