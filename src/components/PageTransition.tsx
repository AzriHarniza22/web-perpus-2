'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { usePageTransition } from '@/hooks/useAnimations'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const pageProps = usePageTransition()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        {...pageProps}
        style={{
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          perspective: 1000
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for custom page transitions
export const useCustomPageTransition = (direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
  const baseTransition = usePageTransition()

  const customVariants = {
    initial: {
      ...baseTransition.initial,
      x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
    },
    animate: baseTransition.animate,
    exit: {
      ...baseTransition.exit,
      x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
      y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0,
    }
  }

  return {
    initial: "initial",
    animate: "animate",
    exit: "exit",
    variants: customVariants,
    transition: baseTransition.transition
  }
}