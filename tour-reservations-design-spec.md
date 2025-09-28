# Tour Reservations Design Specification

## Overview

This design adds tour reservation functionality to the library reservation system, allowing users to book guided tours similar to room bookings. Tours are treated as bookable entities with fixed duration and capacity, integrating seamlessly with the existing booking flow, validation, and admin management.

## Data Model Changes

### New Tables

#### Tours Table

Analogous to the `rooms` table, but tailored for tours.

```sql
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- Duration in minutes
  capacity INTEGER NOT NULL, -- Maximum number of participants
  guide_info TEXT, -- Information about the tour guide
  schedule JSONB, -- Optional predefined schedule, e.g., [{"day": "monday", "start_time": "10:00", "end_time": "11:00"}]
  photos TEXT[], -- Array of photo URLs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

**Fields Explanation:**
- `name`: Tour name (e.g., "General Library Tour").
- `description`: Detailed description of the tour.
- `duration`: Fixed duration to calculate end time.
- `capacity`: Max participants per tour instance.
- `guide_info`: Guide details (name, bio, etc.).
- `schedule`: JSON array for recurring schedules; if null, tours are bookable at any time.
- `photos`: Array of image URLs for the tour.

#### Tour Bookings Table

Analogous to the `bookings` table, but for tours.

```sql
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  purpose TEXT, -- Purpose of the tour booking
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Ensure no overlapping approved bookings for the same tour
  CONSTRAINT no_overlap_tour EXCLUDE USING gist (tour_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE (status = 'approved')
);
```

**Fields Explanation:**
- Similar to `bookings`, but `tour_id` instead of `room_id`.
- `end_time` is calculated as `start_time + duration` from the tours table.
- Exclusion constraint prevents overlapping approved bookings for the same tour.

### Row Level Security (RLS) Policies

Enable RLS on both tables and add policies similar to existing tables:

- **Tours:**
  - Anyone can view active tours.
  - Admins can manage (insert, update, delete) tours.

- **Tour Bookings:**
  - Users can view and manage their own bookings.
  - Admins can view and manage all bookings.
  - Anonymous users can view approved bookings.

### Triggers

Add `updated_at` triggers for both tables using the existing `handle_updated_at` function.

### Sample Data

Insert sample tours, e.g.:

```sql
INSERT INTO public.tours (name, description, duration, capacity, guide_info, schedule) VALUES
('General Library Tour', 'A comprehensive tour of the library facilities', 60, 15, 'John Doe, experienced guide', '[{"day": "monday", "start_time": "10:00"}, {"day": "wednesday", "start_time": "14:00"}]'),
('Special Collections Tour', 'Explore rare books and archives', 90, 10, 'Jane Smith, curator', NULL);
```

## Integration with Existing System

### Booking Flow

- **New API Endpoint:** `/api/tour-bookings/route.ts` (POST)
  - Authenticate user.
  - Request body: `{ tour_id, start_time, purpose, notes }`
  - Fetch tour details to get `duration`.
  - Calculate `end_time = start_time + duration`.
  - Validate:
    - Tour is active.
    - `start_time` is in the future.
    - If `schedule` is defined, check if `start_time` matches a scheduled slot (e.g., correct day and time).
  - Check for conflicting approved `tour_bookings` using the exclusion constraint.
  - Insert booking with status 'pending'.
  - Send email notification to admin (reuse existing notification logic).
  - Return booking details.

- **Similar to Room Bookings:** Reuse validation logic, conflict checking, and notification sending.

### Validation

- **Time Validation:** Ensure `start_time < end_time` and in future.
- **Schedule Validation:** If `schedule` JSON is present, parse and validate that the requested `start_time` aligns with a predefined slot.
- **Capacity:** The exclusion constraint handles overlapping, but additional logic could check current bookings count vs. capacity if needed (though exclusion prevents overbooking).

### Admin Management

- **New Admin Pages:**
  - `/admin/tours`: CRUD interface for managing tours (list, add, edit, deactivate).
  - `/admin/tour-approvals`: Approve/reject tour bookings, similar to existing booking approvals.
- **Extend Existing Pages:**
  - Admin sidebar: Add "Tours" and "Tour Bookings" sections.
  - Analytics: Include tour booking metrics (e.g., utilization, popular tours) in existing charts.
- **Reuse Components:** Adapt `BookingApprovals.tsx`, `RoomManagement.tsx`, etc., for tours.

## How It Fits with Current System

- **Database:** Adds two new tables with FKs to existing `profiles`.
- **API:** New endpoint mirrors `/api/bookings`, ensuring consistent error handling and responses.
- **Frontend:** Users can book tours via a similar interface to room booking (e.g., select tour, pick time, submit).
- **Admin:** Integrates with existing admin dashboard for approvals and management.
- **Notifications:** Reuse email/WhatsApp notifications for tour bookings.
- **No Modifications to Existing Tables:** Keeps `rooms` and `bookings` unchanged.

This design ensures tours are bookable like rooms but with tour-specific fields and logic, maintaining system consistency.