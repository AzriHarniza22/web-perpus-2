// Centralized Animation System for Framer Motion
// Provides reusable animation variants, hooks, and utilities

import { Variants, Transition, useReducedMotion } from 'framer-motion'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

// Fade animations
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

// Slide animations
export const slideVariants = {
  left: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  },
  right: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  },
  up: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  down: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  }
}

// Scale animations
export const scaleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  tap: { scale: 0.95 },
  hover: { scale: 1.05 }
}

// Translate-based hover animations (blur-free)
export const translateHoverVariants: Variants = {
  hover: { y: -2 },
  tap: { y: 1 }
}

// Stagger animations for lists
export const staggerVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  }
}

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

// Loading spinner variants
export const spinnerVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// ============================================================================
// TRANSITION CONFIGURATIONS
// ============================================================================

export const transitions = {
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30
  },
  smooth: {
    duration: 0.3,
    ease: "easeInOut"
  },
  bounce: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10
  },
  fast: {
    duration: 0.15,
    ease: "easeOut"
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

// Hook for reduced motion support
export const useAnimationVariants = () => {
  const shouldReduceMotion = useReducedMotion()

  return {
    shouldReduceMotion,
    getVariants: (variants: Variants): Variants => {
      if (shouldReduceMotion) {
        // Return simplified variants for reduced motion
        return Object.keys(variants).reduce((acc, key) => {
          const variant = variants[key]
          if (typeof variant === 'object' && variant !== null) {
            acc[key] = {
              ...variant,
              transition: { duration: 0.01 } // Near-instant transition
            }
          }
          return acc
        }, {} as Variants)
      }
      return variants
    }
  }
}

// Hook for hover animations
export const useHoverAnimation = () => {
  const { shouldReduceMotion, getVariants } = useAnimationVariants()

  return {
    whileHover: shouldReduceMotion ? {} : { scale: 1.02 },
    whileTap: shouldReduceMotion ? {} : { scale: 0.98 },
    transition: transitions.spring
  }
}

// Hook for entrance animations with stagger
export const useStaggerAnimation = (delay: number = 0) => {
  const { getVariants } = useAnimationVariants()

  return {
    initial: "hidden",
    animate: "visible",
    variants: getVariants(staggerVariants.container),
    transition: { delay }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate slide variants with custom distance
export const createSlideVariants = (direction: 'left' | 'right' | 'up' | 'down', distance: number = 20): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const value = direction === 'left' || direction === 'up' ? -distance : distance

  return {
    hidden: { [axis]: value, opacity: 0 },
    visible: { [axis]: 0, opacity: 1 },
    exit: { [axis]: -value, opacity: 0 }
  }
}

// Generate scale variants with custom scale
export const createScaleVariants = (scale: number = 0.8): Variants => ({
  hidden: { scale, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale, opacity: 0 }
})

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

// GPU-accelerated properties for better performance
export const gpuProps = {
  willChange: "transform, opacity",
  backfaceVisibility: "hidden" as const,
  perspective: 1000
}

// Layout animation props
export const layoutProps = {
  layout: true,
  layoutId: "layout"
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Animation props that respect user preferences
export const accessibleAnimation = (animation: any) => {
  return prefersReducedMotion() ? {} : animation
}