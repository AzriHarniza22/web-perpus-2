'use client'

import { useInViewAnimation } from '@/hooks/useAnimations'

interface TestInViewProps {
  title: string
  useInView?: boolean
}

export function TestInView({ title, useInView = false }: TestInViewProps) {
  if (useInView) {
    const inViewAnim = useInViewAnimation({ triggerOnce: false })
    
    return (
      <div
        ref={inViewAnim.ref}
        className="p-4 bg-blue-100 border rounded-lg mb-4"
        style={inViewAnim.style}
        initial={inViewAnim.initial}
        animate={inViewAnim.animate}
        variants={inViewAnim.variants}
      >
        <h3 className="text-lg font-semibold">{title} (with useInViewAnimation)</h3>
        <p>This component uses useInViewAnimation hook</p>
        <p>Status: Should be visible</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-100 border rounded-lg mb-4">
      <h3 className="text-lg font-semibold">{title} (without useInViewAnimation)</h3>
      <p>This component does NOT use useInViewAnimation hook</p>
      <p>Status: Should be visible</p>
    </div>
  )
}