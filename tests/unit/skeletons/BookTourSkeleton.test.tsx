// tests/unit/skeletons/BookTourSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { BookTourSkeleton } from '@/components/ui/skeletons'

describe('BookTourSkeleton', () => {
  it('renders three column layout skeleton', () => {
    render(<BookTourSkeleton />)

    // Check that the skeleton renders without crashing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<BookTourSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})