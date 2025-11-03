import { useReducedMotion, Easing } from 'framer-motion'

// Mock useReducedMotion for testing environments
const mockUseReducedMotion = () => false

// Use the mock in test environments
const useReducedMotionHook = typeof window === 'undefined' || process.env.NODE_ENV === 'test' ? mockUseReducedMotion : useReducedMotion

export const useSkeletonAnimation = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 },
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    },
    shimmer: shouldReduceMotion ? {} : {
      animate: {
        backgroundPosition: ['-200px 0', '200px 0']
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear" as Easing
      },
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    }
  }
}