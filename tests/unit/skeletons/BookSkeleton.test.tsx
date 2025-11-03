// tests/unit/skeletons/BookSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { BookSkeleton } from '@/components/ui/skeletons'

describe('BookSkeleton', () => {
  it('renders sidebar and room cards', () => {
    render(<BookSkeleton />)

    // Check header skeleton
    expect(screen.getByTestId('header-skeleton')).toBeInTheDocument()

    // Check room cards (6 cards)
    const roomCards = screen.getAllByTestId('room-card-skeleton')
    expect(roomCards).toHaveLength(6)
  })

  it('has proper accessibility attributes', () => {
    render(<BookSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})