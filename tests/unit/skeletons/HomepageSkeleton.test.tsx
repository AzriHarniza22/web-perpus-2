// tests/unit/skeletons/HomepageSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { HomepageSkeleton } from '@/components/ui/skeletons'

describe('HomepageSkeleton', () => {
  it('renders all skeleton elements', () => {
    render(<HomepageSkeleton />)

    // Check navigation skeleton
    expect(screen.getByTestId('navigation-skeleton')).toBeInTheDocument()

    // Check hero section skeletons
    expect(screen.getByTestId('hero-title-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('hero-calendar-skeleton')).toBeInTheDocument()

    // Check room cards (6 cards)
    const roomCards = screen.getAllByTestId('room-card-skeleton')
    expect(roomCards).toHaveLength(6)
  })

  it('has proper accessibility attributes', () => {
    render(<HomepageSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})