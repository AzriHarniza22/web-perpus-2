# Tour Management Admin Interface Design Specification

## Overview

This design specification extends the existing library reservation admin system to include comprehensive tour management capabilities. The design maintains consistency with current admin UI patterns while adapting existing components for tour-specific functionality.

## Page Structure & Navigation

### Updated Admin Sidebar Navigation

Add two new navigation items to `AdminSidebar.tsx`:

```typescript
const menuItems = [
  // ... existing items
  {
    href: '/admin/tours',
    label: 'Tour Management',
    icon: MapPin, // or Compass
    active: pathname === '/admin/tours'
  },
  {
    href: '/admin/tour-approvals',
    label: 'Tour Approvals',
    icon: CheckCircle,
    active: pathname === '/admin/tour-approvals'
  }
]
```

## Page 1: /admin/tours - Tour Management

### Page Layout Structure

**File:** `src/app/admin/tours/page.tsx`

Follows the same pattern as `src/app/admin/rooms/page.tsx`:

- Authentication check (admin role required)
- Consistent header with sidebar toggle and user info
- Main content area with `TourManagement` component wrapped in Card

### TourManagement Component

**File:** `src/components/admin/TourManagement.tsx`

**Adapted from:** `RoomManagement.tsx`

#### Component Structure

```typescript
interface Tour {
  id: string
  name: string
  description: string
  duration: number // in minutes
  capacity: number
  schedule: Array<{day: string, start_time: string, end_time?: string}>
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TourManagement() {
  // State management similar to RoomManagement
  // CRUD operations for tours
  // Schedule management
}
```

#### Key Features

1. **Tour List Grid**
   - Card-based layout similar to RoomManagement
   - Display: Tour name, duration, capacity, status
   - Action buttons: Edit, Toggle Active, Delete

2. **Add/Edit Tour Dialog**
   - Form fields:
     - Name (required)
     - Description (textarea)
     - Duration (number input, minutes)
     - Capacity (number input)
     - Schedule (JSON editor or structured input)
   - Schedule management with validation

3. **Schedule Management**
   - JSON-based schedule input
   - UI helper for common schedules (weekdays, weekends, etc.)
   - Validation for proper time format

#### UI Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button` (variants: default, outline, destructive)
- `Input`, `Textarea`, `Label`
- `Dialog` with form
- `Badge` for status
- `motion.div` for animations

## Page 2: /admin/tour-approvals - Tour Booking Approvals

### Page Layout Structure

**File:** `src/app/admin/tour-approvals/page.tsx`

Follows the same pattern as `src/app/admin/approvals/page.tsx`:

- Authentication check (admin role required)
- Consistent header with sidebar toggle and user info
- Main content area with `TourBookingApprovals` component wrapped in Card

### TourBookingApprovals Component

**File:** `src/components/admin/TourBookingApprovals.tsx`

**Adapted from:** `BookingApprovals.tsx`

#### Component Structure

```typescript
interface TourBooking {
  id: string
  user_id: string
  tour_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  participant_count: number
  proposal_file: string // File path for uploaded proposal
  created_at: string
  updated_at: string
  // Relations
  profiles: { full_name: string, email: string }
  tours: { name: string, duration: number }
}

export default function TourBookingApprovals() {
  // State management for tour bookings
  // Approval/rejection actions
  // Detail view modal
}
```

#### Key Features

1. **Pending Tour Bookings List**
   - Card-based layout similar to BookingApprovals
   - Display: Tour name, user info, date/time, participant count
   - Status badge (pending)
   - Action buttons: View Details, Download Proposal, Approve, Reject

2. **Detail View Dialog**
   - Tour information (name, duration)
   - Booking details (user, date/time, participant count)
   - Proposal file download link
   - Approval/rejection actions

3. **Approval Actions**
   - Approve: Changes status to 'approved'
   - Reject: Changes status to 'rejected'
   - Email notifications to user

4. **Filtering & Search**
   - Date range filtering
   - Search by user name or tour name
   - Filter by participant count range

#### UI Components Used

- `Card`, `CardContent`
- `Button` (variants: default, destructive, outline)
- `Badge` for status
- `Dialog` for details
- `Avatar` for user display
- `motion.div` and `AnimatePresence` for animations
- Icons: `CheckCircle`, `XCircle`, `Clock`, `Eye`, `Users`, `Calendar`, `MapPin`

## Page 3: Analytics Dashboard Updates

### Enhanced Analytics Page

**File:** `src/app/admin/analytics/page.tsx`

**Modifications to existing analytics:**

#### New Tour Metrics

1. **Tour Statistics Cards**
   - Total Tours
   - Active Tours
   - Total Tour Bookings (monthly)
   - Tour Utilization Rate

2. **Tour-Specific Charts**

   **Tour Usage Chart** (adapted from RoomUsageChart)
   ```typescript
   // Data structure
   const tourData = stats.tourStats.map(item => ({
     tour: item.tour_name,
     bookings: item.booking_count,
     capacity: item.capacity,
     utilization: (item.booking_count / item.capacity) * 100
   }))
   ```

   **Tour Booking Trends** (integrated into MonthlyTrendsChart)
   - Separate series for room bookings vs tour bookings
   - Monthly comparison

   **Tour Status Distribution** (adapted from StatusDistributionChart)
   - Pending, Approved, Rejected, Completed, Cancelled for tours

   **Popular Tours Chart** (new)
   - Bar chart showing most booked tours
   - Shows booking count and utilization rate

3. **Tour Analytics Calculations**

   ```typescript
   const tourAnalytics = useMemo(() => {
     const tourBookings = bookings.filter(b => b.tour_id) // Assuming tour bookings are in same table or separate
     const totalTourBookings = tourBookings.length
     const approvedTourBookings = tourBookings.filter(b => b.status === 'approved').length
     const tourUtilizationRate = totalTourBookings > 0 ? (approvedTourBookings / totalTourBookings) * 100 : 0

     return {
       totalTourBookings,
       approvedTourBookings,
       tourUtilizationRate,
       popularTours: // Calculate most booked tours
     }
   }, [bookings])
   ```

#### Updated Summary Stats

Add tour metrics to the main stats grid:

```typescript
{[
  // ... existing stats
  { label: 'Total Tours', value: stats.totalTours?.toString() || '0', icon: MapPin, color: 'from-green-500 to-teal-400' },
  { label: 'Tour Bookings', value: stats.monthlyTourBookings?.toString() || '0', icon: Users, color: 'from-purple-500 to-indigo-400' },
  { label: 'Tour Utilization', value: `${stats.tourUtilizationRate?.toFixed(1) || '0'}%`, icon: TrendingUp, color: 'from-orange-500 to-amber-400' }
].map((stat, index) => (
  // ... existing card rendering
))}
```

## Component Architecture

### Shared Components & Patterns

1. **Consistent Layout Pattern**
   - All admin pages follow: Sidebar + Header + Main Content
   - Header includes: Page title, subtitle, user info, theme toggle, logout
   - Main content wrapped in Card with consistent padding

2. **Animation & Interaction Patterns**
   - Framer Motion for page transitions and hover effects
   - Consistent button hover states and loading states
   - Skeleton loading states for all components

3. **Data Management**
   - React Query for API state management
   - Consistent error handling and loading states
   - Optimistic updates for CRUD operations

4. **Form Patterns**
   - Consistent form validation
   - File upload handling with Supabase storage
   - Dialog-based forms for add/edit operations

### API Integration

#### New API Hooks (extend existing `src/lib/api.ts`)

```typescript
// Tour management
export function useTours() { /* ... */ }
export function useUpsertTour() { /* ... */ }
export function useDeleteTour() { /* ... */ }
export function useToggleTourActive() { /* ... */ }

// Tour booking management
export function useTourBookings() { /* ... */ }
export function useUpdateTourBookingStatus() { /* ... */ }

// Tour analytics
export function useTourStats(dateRangeParam?: any) { /* ... */ }
export function useTourUtilization(dateRangeParam?: any) { /* ... */ }
```

## Admin Workflows

### Tour Management Workflow

1. **Access Tour Management**
   - Admin navigates to `/admin/tours`
   - System loads tour list with current status

2. **Add New Tour**
   - Click "Add Tour" button
   - Fill form: name, description, duration, capacity
   - Set schedule (optional)
   - Save → Tour appears in active list

3. **Edit Existing Tour**
   - Click edit button on tour card
   - Modify details in dialog
   - Update schedule if needed
   - Save changes

4. **Deactivate Tour**
   - Toggle active status
   - Prevents new bookings but keeps existing data

### Tour Approval Workflow

1. **Review Pending Bookings**
   - Admin navigates to `/admin/tour-approvals`
   - System shows pending tour bookings

2. **Review Booking Details**
   - Click "View Details" to see full booking info
   - Check tour capacity and schedule conflicts
   - Review user information and purpose

3. **Approve or Reject**
   - Approve: Status changes to 'approved', user notified
   - Reject: Status changes to 'rejected', user notified
   - System prevents double-booking via database constraints

### Analytics Review Workflow

1. **View Tour Metrics**
   - Access `/admin/analytics`
   - Review tour-specific charts and statistics

2. **Export Reports**
   - Use existing export functionality
   - Include tour data in CSV/PDF/Excel exports

3. **Monitor Performance**
   - Track tour utilization rates
   - Identify popular tours
   - Monitor approval/rejection trends

## Responsive Design

All components maintain responsive design patterns:

- **Mobile**: Single column layouts, collapsible sidebar
- **Tablet**: 2-column grids where appropriate
- **Desktop**: Full multi-column layouts with expanded sidebar

## Accessibility & UX Considerations

1. **Consistent Navigation**: Sidebar provides clear navigation between tour and room management
2. **Clear Status Indicators**: Badges and icons clearly show booking/approval status
3. **Intuitive Actions**: Primary actions (approve/reject) are prominently displayed
4. **Feedback**: Loading states, success/error messages for all operations
5. **Keyboard Navigation**: All interactive elements accessible via keyboard

## Implementation Notes

1. **Database Integration**: Assumes `tours` and `tour_bookings` tables exist as per tour-reservations-design-spec.md
2. **API Endpoints**: New endpoints needed for tour CRUD operations and tour booking management
3. **File Storage**: Proposal file uploads use existing Supabase storage patterns
4. **Notifications**: Reuse existing email/WhatsApp notification system for tour bookings
5. **Validation**: Client and server-side validation for tour schedules and booking conflicts

This design ensures seamless integration with the existing admin system while providing comprehensive tour management capabilities.