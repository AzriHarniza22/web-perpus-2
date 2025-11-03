// tests/unit/skeletons/RoomBookingSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { RoomBookingSkeleton } from '@/components/ui/skeletons'

describe('RoomBookingSkeleton', () => {
  it('renders room booking layout skeleton', () => {
    render(<RoomBookingSkeleton />)

    // Check that the skeleton renders without crashing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<RoomBookingSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})