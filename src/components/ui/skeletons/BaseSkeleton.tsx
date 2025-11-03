import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface BaseSkeletonProps {
  className?: string
  animated?: boolean
  children: React.ReactNode
}

export const BaseSkeleton: React.FC<BaseSkeletonProps> = ({
  className,
  animated = true,
  children
}) => {
  if (!animated) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}