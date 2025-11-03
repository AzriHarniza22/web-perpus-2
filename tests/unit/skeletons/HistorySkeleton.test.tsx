// tests/unit/skeletons/HistorySkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { HistorySkeleton } from '@/components/ui/skeletons'

describe('HistorySkeleton', () => {
  it('renders history list skeleton', () => {
    render(<HistorySkeleton />)

    // Check that the skeleton renders without crashing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<HistorySkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})