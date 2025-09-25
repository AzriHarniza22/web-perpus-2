# Unified Loading Template Design Specification

## Overview

This design specification outlines a unified, reusable loading template for the Library Reservation System. The template combines the best elements from existing implementations while maintaining consistency with the app's blue/purple gradient theme and Indonesian language support.

## Component Structure

### Main Component: `Loading`

```typescript
interface LoadingProps {
  variant: 'fullscreen' | 'inline' | 'skeleton'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  showDots?: boolean
  className?: string
  children?: React.ReactNode // For skeleton variant
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'inline',
  size = 'md',
  message,
  showDots = true,
  className,
  children
}) => { ... }
```

### Variants

#### 1. Fullscreen Variant
- **Purpose**: Page-level loading states
- **Structure**:
  - Full viewport overlay
  - Animated gradient background
  - Dual rotating spinners (blue + purple)
  - Centered content with message and dots
  - Indonesian text support

#### 2. Inline Variant
- **Purpose**: Component-level loading (buttons, sections)
- **Structure**:
  - Compact spinner
  - Optional message
  - Flexible sizing (sm/md/lg/xl)
  - Can be used within existing layouts

#### 3. Skeleton Variant
- **Purpose**: Content placeholder loading
- **Structure**:
  - Uses existing skeleton component as base
  - Enhanced with theme colors
  - Supports custom content shapes
  - Wave animation effect

## Animations & Transitions

### Fullscreen Animations
- **Background**: Continuous gradient movement (20s cycle)
- **Primary Spinner**: 360° rotation (2s linear)
- **Secondary Spinner**: Counter-rotation (3s linear)
- **Dots**: Sequential scale/opacity pulse (1.5s cycle, 0.2s stagger)
- **Fade-in**: Staggered content appearance (0.3s delay)

### Inline Animations
- **Spinner**: Continuous rotation (1s linear)
- **Pulse**: Optional background pulse effect
- **Scale**: Hover/tap feedback (1.05x scale)

### Skeleton Animations
- **Wave**: Left-to-right shimmer effect (2s cycle)
- **Pulse**: Fallback animate-pulse (2s ease-in-out)
- **Fade**: Smooth transition on load completion

## Color Scheme & Theming

### Primary Colors
- **Blue Primary**: `oklch(0.6 0.25 241)` / `#2563eb`
- **Purple Secondary**: `oklch(0.58 0.25 293)` / `#9333ea`
- **Accent**: `oklch(0.64 0.25 340)` / `#c026d3`

### Background Gradients
- **Light Mode**: `from-blue-50 via-indigo-50 to-purple-50`
- **Dark Mode**: `from-gray-900 via-blue-900 to-purple-900`
- **Overlay**: `from-blue-400/10 via-purple-400/10 to-pink-400/10`

### Text Colors
- **Primary Text**: `text-gray-800 dark:text-white`
- **Secondary Text**: `text-gray-600 dark:text-gray-300`
- **Message Text**: Indonesian language support

## Usage Examples

### Fullscreen Loading (Page Load)
```tsx
// In page component
if (loading) {
  return (
    <Loading
      variant="fullscreen"
      message="Memuat Perpustakaan Aceh"
      showDots={true}
    />
  )
}
```

### Inline Loading (Button State)
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <Loading variant="inline" size="sm" />
  ) : (
    'Submit'
  )}
</Button>
```

### Skeleton Loading (Content Placeholder)
```tsx
<Loading variant="skeleton">
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
</Loading>
```

### Dashboard Cards Loading
```tsx
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <Loading key={i} variant="skeleton">
        <Card className="h-32">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      </Loading>
    ))}
  </div>
) : (
  // Actual content
)}
```

## Implementation Guidelines

### Accessibility
- Screen reader announcements for loading states
- Reduced motion support (`prefers-reduced-motion`)
- ARIA labels for spinner elements
- Focus management for fullscreen variant

### Performance
- CSS-only animations where possible
- Minimal DOM manipulation
- Efficient re-renders with React.memo
- Lazy loading for complex animations

### Responsive Design
- Adaptive sizing across breakpoints
- Touch-friendly interactive elements
- Readable text scaling

### Customization
- CSS custom properties for theme overrides
- ClassName prop for additional styling
- Children prop for skeleton content shaping

## Migration Plan

### Existing Implementations
1. **Home Page Loading**: Replace with `<Loading variant="fullscreen" />`
2. **Dashboard Skeletons**: Replace with `<Loading variant="skeleton" />`
3. **Button Spinners**: Replace with `<Loading variant="inline" size="sm" />`

### Benefits
- Consistent visual language
- Reduced code duplication
- Easier maintenance
- Enhanced accessibility
- Better performance

## Technical Requirements

### Dependencies
- React 18+
- Framer Motion (for complex animations)
- Tailwind CSS (for styling)
- Lucide React (for icons, if needed)

### Browser Support
- Modern browsers with CSS Grid/Flexbox
- CSS Custom Properties support
- ES6+ JavaScript features

This specification provides a comprehensive foundation for implementing a unified loading experience that enhances user perception of performance while maintaining the app's distinctive blue/purple aesthetic and Indonesian language support.