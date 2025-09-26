# Admin Reservations Page Technical Specification

## Overview
This specification outlines the design for an enhanced admin page for viewing all reservations with advanced filtering, search functionality, and improved data display. The page will significantly enhance the existing BookingManagement component while maintaining integration with current API hooks and components.

## 1. Page Structure and Layout

### Header Section
- Page title: "Reservations Management"
- Subtitle: "View, filter, and manage all room reservations"
- Breadcrumb navigation: Admin Dashboard > Reservations

### Filters Section
- Collapsible filter panel (default: expanded)
- Clear filters button
- Apply filters button
- Real-time filter application (optional toggle)

### Data Display Section
- Table view with sortable columns
- Pagination controls
- Results summary (e.g., "Showing 1-50 of 200 reservations")
- Export functionality (CSV/PDF) - future enhancement

### Actions Section
- Bulk actions dropdown (approve, reject, cancel multiple)
- Refresh data button
- View toggle (table/list) - future enhancement

## 2. Filter Options

### Status Dropdown
- Options: All, Pending, Approved, Rejected, Completed, Cancelled
- Multi-select capability
- Default: All

### Date Range Picker
- Start date and end date inputs
- Calendar popup component using existing Calendar UI
- Quick presets: Today, This Week, This Month, Last Month, Custom
- Filters by booking creation date or event date (toggle)

### Room Selector
- Dropdown with all available rooms
- Multi-select capability
- Search within dropdown for large room lists
- Default: All rooms

### User Search
- Text input for searching by user name or email
- Real-time suggestions/autocomplete
- Case-insensitive search

## 3. Search Functionality

### Primary Search Input
- Single text input at top of page
- Searches across: event description, user name, user email, room name
- Real-time search with debouncing (300ms delay)
- Clear search button

### Advanced Search (Optional)
- Toggle for advanced search mode
- Separate inputs for each field
- Boolean operators support (AND/OR)

## 4. Data Display

### Table Columns
1. **Date/Time** - Start and end time, formatted for readability
2. **Room** - Room name with capacity indicator
3. **User** - Full name and email
4. **Status** - Color-coded status badge
5. **Event** - Event description (truncated with tooltip)
6. **Actions** - Approve/Reject buttons, Edit, View Details

### Table Features
- Sortable columns (click headers)
- Resizable columns
- Row selection for bulk actions
- Expandable rows for full details
- Loading states with skeleton rows

## 5. UI Components Needed

### Existing Components (Reuse)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button` (various variants)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Input`
- `Calendar` (for date range picker)
- `Badge` (for status indicators)
- `Skeleton` (for loading states)
- `Popover` (for advanced filters)

### New Components Required
- `DateRangePicker` - Wrapper around Calendar for range selection
- `DataTable` - Reusable table component with sorting/pagination
- `FilterPanel` - Collapsible filter container
- `SearchInput` - Enhanced search with suggestions
- `Pagination` - Page navigation component
- `BulkActions` - Multi-select action handler

## 6. Integration with Existing API Hooks and Components

### API Hooks Usage
- Extend `useBookings` with filter parameters:
  ```typescript
  useBookings({
    status?: string[],
    dateRange?: { start: string, end: string },
    roomIds?: string[],
    search?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  })
  ```

- Reuse `useUpdateBookingStatus` for individual actions
- Add `useBulkUpdateBookingStatus` for bulk operations
- Integrate with `useRooms` for room filter options

### Component Integration
- Build upon existing BookingManagement structure
- Use existing theme and styling patterns
- Maintain consistency with other admin pages
- Leverage existing error handling and loading states

## 7. Responsive Design Considerations

### Mobile Layout
- Filters collapse into a modal/drawer
- Table converts to card-based list view
- Actions become swipe gestures or dropdown menus
- Pagination adapts to mobile-friendly controls

### Tablet Layout
- Filters in collapsible sidebar
- Table with horizontal scroll
- Touch-friendly buttons and inputs

### Desktop Layout
- Full table with all columns visible
- Filters in dedicated panel
- Keyboard navigation support
- Hover states and tooltips

## 8. Performance Considerations

### Pagination
- Server-side pagination with configurable page size (10, 25, 50, 100)
- Maintain filter state across page changes
- Infinite scroll option for large datasets

### Lazy Loading
- Load data on demand
- Cache filtered results
- Prefetch adjacent pages

### Optimization Strategies
- Debounced search input (300ms)
- Memoized filter computations
- Virtual scrolling for very large tables (>1000 rows)
- Background refresh for real-time updates

### Data Management
- React Query for caching and background updates
- Optimistic updates for status changes
- Error boundaries for graceful failure handling
- Loading states to prevent layout shift

## Implementation Plan

### Phase 1: Core Functionality
- Enhanced useBookings hook with filters
- Basic table display with sorting
- Status filtering and search
- Responsive layout

### Phase 2: Advanced Features
- Date range filtering
- Bulk actions
- Export functionality
- Advanced search

### Phase 3: Performance Optimization
- Pagination implementation
- Virtual scrolling
- Caching improvements

## Dependencies
- React Query for data fetching
- Supabase for backend
- Existing UI component library
- Date manipulation libraries (date-fns or similar)

## Testing Considerations
- Unit tests for filter logic
- Integration tests for API calls
- E2E tests for user workflows
- Performance tests for large datasets