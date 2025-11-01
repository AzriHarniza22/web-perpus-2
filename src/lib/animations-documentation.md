# Framer Motion Animation System Documentation

## Overview

This project uses a comprehensive Framer Motion animation system designed for optimal performance, accessibility, and consistency. The system provides reusable animation variants, custom hooks, and utilities that respect user preferences for reduced motion.

## Core Files

### `src/lib/animations.ts`
Centralized animation variants and configurations.

### `src/hooks/useAnimations.ts`
Custom hooks for common animation patterns with accessibility support.

### `src/components/PageTransition.tsx`
Page-level transition components.

## Animation Variants

### Fade Variants
```typescript
import { fadeVariants } from '@/lib/animations'

<motion.div
  variants={fadeVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

### Slide Variants
```typescript
import { slideVariants } from '@/lib/animations'

<motion.div
  variants={slideVariants.up}
  initial="hidden"
  animate="visible"
/>
```

### Scale Variants
```typescript
import { scaleVariants } from '@/lib/animations'

<motion.div
  variants={scaleVariants}
  whileHover="hover"
  whileTap="tap"
/>
```

## Custom Hooks

### useInViewAnimation
Triggers animations when element enters viewport.

```typescript
const animationProps = useInViewAnimation({
  threshold: 0.1,
  direction: 'up',
  variant: 'slide'
})

return <motion.div {...animationProps} ref={animationProps.ref} />
```

### useHoverAnimation
Provides hover and tap animations with accessibility.

```typescript
const hoverProps = useHoverAnimation()

return <motion.button {...hoverProps} />
```

### useStaggerAnimation
Creates staggered animations for lists.

```typescript
const { container, item } = useStaggerAnimation()

return (
  <motion.ul {...container}>
    {items.map(item => <motion.li {...item} />)}
  </motion.ul>
)
```

### useLoadingAnimation
Provides loading spinner and pulse animations.

```typescript
const { spinner, pulse, dots } = useLoadingAnimation()

return (
  <motion.div {...spinner} />
  <motion.div {...pulse} />
  <motion.div {...dots(0)} />
)
```

## Component Enhancements

### Button Component
Enhanced with hover and tap animations.

```typescript
import { Button } from '@/components/ui/button'

// Automatically includes hover/tap animations
<Button>Click me</Button>
```

### Card Component
Enhanced with subtle hover effects.

```typescript
import { Card } from '@/components/ui/card'

// Automatically includes scale animations
<Card>Content</Card>
```

### Dialog Component
Enhanced with modal entrance/exit animations.

```typescript
import { Dialog } from '@/components/ui/dialog'

// Automatically includes modal animations
<Dialog>Content</Dialog>
```

## Page Transitions

### Basic Page Transition
```typescript
import { PageTransition } from '@/components/PageTransition'

export default function Layout({ children }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  )
}
```

### Custom Page Transition
```typescript
import { useCustomPageTransition } from '@/components/PageTransition'

const transitionProps = useCustomPageTransition('left')

return <motion.div {...transitionProps} />
```

## Performance Optimizations

### GPU Acceleration
All animations use GPU-accelerated properties:
- `transform` (translate, scale, rotate)
- `opacity`
- `will-change` for performance hints

### Reduced Motion Support
All animations respect `prefers-reduced-motion` media query:
- Automatic fallback to instant transitions
- Disabled complex animations
- Maintained functionality without motion

### Layout Animations
Use `layout` prop for smooth layout changes:
```typescript
<motion.div layout layoutId="unique-id" />
```

## Accessibility Guidelines

### Reduced Motion
- All animations check for `prefers-reduced-motion: reduce`
- Fallback to instant transitions when reduced motion is preferred
- Maintains full functionality without animations

### Focus Management
- Animations don't interfere with keyboard navigation
- Focus indicators remain visible during animations
- Screen reader compatibility maintained

### Animation Triggers
- Hover animations only trigger on pointer devices
- Touch interactions use tap animations
- No motion triggered by focus changes

## Best Practices

### 1. Use Variants
Always define animations as variants for consistency and reusability.

### 2. Respect Performance
- Avoid animating non-GPU properties (width, height, etc.)
- Use `transform` and `opacity` primarily
- Limit concurrent animations

### 3. Test on Real Devices
- Test animations on target devices
- Monitor frame rates with browser dev tools
- Use reduced motion testing

### 4. Provide Fallbacks
- Ensure content is accessible without animations
- Test with reduced motion enabled
- Maintain functionality for all users

## Animation Performance Metrics

### Target Performance
- 60fps on target devices
- < 100ms initial load impact
- < 10KB bundle size increase

### Monitoring
- Use browser performance tools
- Monitor Core Web Vitals
- Test on various devices and network conditions

## Troubleshooting

### Common Issues

1. **Animations not working**
   - Check if `prefers-reduced-motion` is set
   - Verify component is wrapped with `motion.`
   - Check for CSS conflicts

2. **Performance issues**
   - Avoid animating non-GPU properties
   - Use `will-change` sparingly
   - Limit animation complexity

3. **Bundle size concerns**
   - Import only needed animation utilities
   - Use tree shaking for unused variants
   - Consider lazy loading animation components

## Migration Guide

### From CSS Animations
Replace CSS animations with Framer Motion variants:

```css
/* Before */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* After */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>
```

### From React Transition Group
Replace with Framer Motion's AnimatePresence:

```typescript
// Before
<Transition in={show} timeout={300}>
  <div>Content</div>
</Transition>

// After
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

## Version Compatibility

- Framer Motion: ^12.23.18
- React: ^19.1.0
- Next.js: ^15.5.3

## Contributing

When adding new animations:
1. Add variants to `src/lib/animations.ts`
2. Create hooks in `src/hooks/useAnimations.ts` if reusable
3. Update this documentation
4. Test accessibility and performance
5. Add examples to component documentation