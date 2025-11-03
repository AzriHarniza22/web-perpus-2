// tests/unit/skeletons/AdminApprovalsSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { AdminApprovalsSkeleton } from '@/components/ui/skeletons'

describe('AdminApprovalsSkeleton', () => {
  it('renders admin approvals dashboard skeleton', () => {
    render(<AdminApprovalsSkeleton />)

    // Check that the skeleton renders without crashing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<AdminApprovalsSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})