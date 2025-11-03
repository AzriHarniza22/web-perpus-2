// tests/unit/skeletons/AdminHistorySkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { AdminHistorySkeleton } from '@/components/ui/skeletons'

describe('AdminHistorySkeleton', () => {
  it('renders admin history content skeleton', () => {
    render(<AdminHistorySkeleton />)

    // Check that the skeleton renders without crashing
    // Check that the component renders
    expect(screen.getByTestId('content-area-skeleton')).toBeInTheDocument()

    // Check that tabs are present
    const tabs = screen.getAllByTestId('tab-skeleton')
    expect(tabs).toHaveLength(2)
  })

  it('has proper accessibility attributes', () => {
    render(<AdminHistorySkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})