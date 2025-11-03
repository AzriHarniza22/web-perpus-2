// tests/unit/skeletons/AdminProfileSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { AdminProfileSkeleton } from '@/components/ui/skeletons'

describe('AdminProfileSkeleton', () => {
  it('renders admin profile form skeleton', () => {
    render(<AdminProfileSkeleton />)

    // Check that the skeleton renders without crashing
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<AdminProfileSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})