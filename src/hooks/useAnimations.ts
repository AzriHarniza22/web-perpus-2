// Custom hooks for common animation patterns
// Provides reusable animation logic with accessibility support

import { useEffect, useState, RefObject, useRef } from 'react'
import { useReducedMotion, useAnimation, Easing } from 'framer-motion'
import { fadeVariants, slideVariants, scaleVariants, translateHoverVariants, transitions, gpuProps } from '@/lib/animations'

// Mock useReducedMotion for testing environments
const mockUseReducedMotion = () => false

// Use the mock in test environments
const useReducedMotionHook = typeof window === 'undefined' || process.env.NODE_ENV === 'test' ? mockUseReducedMotion : useReducedMotion

// ============================================================================
// HOOK: useInViewAnimation
// ============================================================================

interface UseInViewAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
  delay?: number
  direction?: 'left' | 'right' | 'up' | 'down'
  variant?: 'fade' | 'slide' | 'scale'
}

export const useInViewAnimation = (options: UseInViewAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    direction = 'up',
    variant = 'fade'
  } = options

  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    if (!ref.current || shouldReduceMotion) {
      setInView(true)
      return
    }

    // Set a timer as fallback to ensure visibility
    const fallbackTimer = setTimeout(() => {
      setInView(true)
    }, 500)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          clearTimeout(fallbackTimer)
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setInView(false)
        }
      },
      { 
        threshold,
        rootMargin: '50px'
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [threshold, triggerOnce, shouldReduceMotion])

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.set({ opacity: 1, x: 0, y: 0, scale: 1 })
      return
    }

    if (inView) {
      controls.start('visible', { delay })
    } else if (!triggerOnce) {
      controls.start('hidden')
    }
  }, [controls, inView, shouldReduceMotion, delay, triggerOnce])

  const getVariants = () => {
    switch (variant) {
      case 'slide':
        return slideVariants[direction]
      case 'scale':
        return scaleVariants
      default:
        return fadeVariants
    }
  }

  return {
    ref,
    animate: controls,
    variants: getVariants(),
    initial: 'visible',
    style: gpuProps.style
  }
}

// ============================================================================
// HOOK: useHoverAnimation
// ============================================================================

export const useHoverAnimation = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    whileHover: shouldReduceMotion ? {} : {
      y: -2,
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    whileTap: shouldReduceMotion ? {} : {
      y: 1,
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    transition: shouldReduceMotion ? {} : transitions.spring,
    style: {
      ...gpuProps.style,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      userSelect: 'none' as const,
      cursor: 'pointer' as const
    }
  }
}

// ============================================================================
// HOOK: useStaggerAnimation
// ============================================================================

interface UseStaggerAnimationOptions {
  staggerDelay?: number
  itemDelay?: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

export const useStaggerAnimation = (options: UseStaggerAnimationOptions = {}) => {
  const { staggerDelay = 0.1, itemDelay = 0, direction = 'up' } = options
  const shouldReduceMotion = useReducedMotionHook()
  const controls = useAnimation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : itemDelay
      }
    }
  }

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : {
      opacity: 0,
      x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: shouldReduceMotion ? { duration: 0.01 } : transitions.spring
    }
  }

  return {
    container: {
      animate: controls,
      variants: containerVariants,
      initial: 'visible'  // Changed from 'hidden' to 'visible'
    },
    item: {
      variants: itemVariants,
      style: gpuProps.style
    },
    controls
  }
}

// ============================================================================
// HOOK: useLoadingAnimation
// ============================================================================

export const useLoadingAnimation = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    spinner: {
      animate: shouldReduceMotion ? {} : { rotate: 360 },
      transition: shouldReduceMotion ? {} : {
        duration: 1,
        repeat: Infinity,
        ease: "linear" as Easing
      },
      style: gpuProps.style
    },
    pulse: {
      animate: shouldReduceMotion ? {} : {
        scale: [1, 1.1, 1],
        opacity: [0.5, 1, 0.5]
      },
      transition: shouldReduceMotion ? {} : {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as Easing
      },
      style: gpuProps.style
    },
    dots: (index: number) => ({
      animate: shouldReduceMotion ? {} : {
        scale: [1, 1.2, 1],
        opacity: [0.3, 1, 0.3]
      },
      transition: shouldReduceMotion ? {} : {
        duration: 1.5,
        repeat: Infinity,
        delay: index * 0.2
      },
      style: gpuProps.style
    })
  }
}

// ============================================================================
// HOOK: useModalAnimation
// ============================================================================

export const useModalAnimation = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: shouldReduceMotion ? { duration: 0.01 } : transitions.smooth
    },
    content: {
      initial: shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : {
        opacity: 0,
        scale: 0.95,
        y: 20
      },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: shouldReduceMotion ? { opacity: 0 } : {
        opacity: 0,
        scale: 0.95,
        y: 20
      },
      transition: shouldReduceMotion ? { duration: 0.01 } : {
        type: "spring",
        stiffness: 300,
        damping: 25
      },
      style: gpuProps.style
    }
  }
}

// ============================================================================
// HOOK: usePageTransition
// ============================================================================

export const usePageTransition = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 },
    transition: shouldReduceMotion ? { duration: 0.01 } : {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    },
    style: gpuProps.style
  }
}

// ============================================================================
// HOOK: useScrollAnimation
// ============================================================================

interface UseScrollAnimationOptions {
  offset?: number
  once?: boolean
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { offset = 100, once = true } = options
  const shouldReduceMotion = useReducedMotionHook()
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || shouldReduceMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: `-${offset}px` }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, offset, once, shouldReduceMotion])

  return {
    ref: setRef,
    animate: isVisible ? 'visible' : 'hidden',
    variants: fadeVariants,
    initial: 'hidden',
    ...gpuProps
  }
}

// ============================================================================
// HOOK: useDragAnimation
// ============================================================================

export const useDragAnimation = () => {
  const shouldReduceMotion = useReducedMotionHook()

  return {
    drag: shouldReduceMotion ? false : "x",
    dragConstraints: { left: 0, right: 0 },
    dragElastic: shouldReduceMotion ? 0 : 0.2,
    whileDrag: shouldReduceMotion ? {} : { scale: 1.05 },
    style: gpuProps.style
  }
}

// ============================================================================
// HOOK: useSkeletonAnimation
// ============================================================================

interface UseSkeletonAnimationOptions {
  loading?: boolean
  delay?: number
}

export const useSkeletonAnimation = (options: UseSkeletonAnimationOptions = {}) => {
  const { loading = false, delay = 0 } = options
  const shouldReduceMotion = useReducedMotionHook()

  return {
    fadeIn: {
      initial: loading ? { opacity: 1 } : { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3, delay: loading ? 0 : delay },
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    },
    slideUp: {
      initial: loading ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay: loading ? 0 : delay },
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    },
    shimmer: loading ? {
      style: {
        backfaceVisibility: "hidden" as const,
        perspective: 1000
      }
    } : {
      animate: shouldReduceMotion ? {} : {
        backgroundPosition: ['-200px 0', '200px 0']
      },
      transition: shouldReduceMotion ? {} : {
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