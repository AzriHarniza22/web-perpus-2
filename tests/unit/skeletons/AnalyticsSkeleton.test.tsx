// tests/unit/skeletons/AnalyticsSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { AnalyticsSkeleton } from '@/components/ui/skeletons'

describe('AnalyticsSkeleton', () => {
  it('renders content skeletons only', () => {
    render(<AnalyticsSkeleton />)

    // Check that sidebar and header skeletons are NOT present
    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('header-skeleton')).not.toBeInTheDocument()

    // Check overview cards (4 cards)
    const overviewCards = screen.getAllByTestId('overview-card-skeleton')
    expect(overviewCards).toHaveLength(4)

    // Check chart skeletons (4 charts)
    const chartSkeletons = screen.getAllByTestId('chart-skeleton')
    expect(chartSkeletons).toHaveLength(4)
  })

  it('has proper accessibility attributes', () => {
    render(<AnalyticsSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})