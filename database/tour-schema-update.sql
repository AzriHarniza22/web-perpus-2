-- Database schema update for Library Tour System
-- This script adds tour support to the existing library reservation system

-- Tours table
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  meeting_point TEXT NOT NULL,
  guide_name TEXT NOT NULL,
  guide_contact TEXT NOT NULL,
  schedule JSONB NOT NULL, -- Array of schedule objects with dayOfWeek, startTime, availableSlots
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tour bookings view (for easier querying of tour bookings)
CREATE OR REPLACE VIEW public.tour_bookings AS
SELECT
  b.*,
  t.name as tour_name,
  t.duration_minutes,
  t.max_participants,
  t.meeting_point,
  t.guide_name,
  t.guide_contact,
  t.schedule as tour_schedule
FROM public.bookings b
LEFT JOIN public.tours t ON b.room_id = t.id
WHERE t.id IS NOT NULL;

-- Add tour-specific fields to bookings table (optional, for better tour data)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS participant_count INTEGER,
ADD COLUMN IF NOT EXISTS tour_meeting_point TEXT,
ADD COLUMN IF NOT EXISTS tour_guide TEXT,
ADD COLUMN IF NOT EXISTS tour_duration_minutes INTEGER;

-- Update existing bookings to use the new fields if they contain tour data
UPDATE public.bookings
SET
  participant_count = guest_count,
  tour_meeting_point = CASE
    WHEN notes LIKE '%Meeting Point:%' THEN
      TRIM(SPLIT_PART(SUBSTRING(notes FROM 'Meeting Point:([^,]+)'), 'Meeting Point:', 2))
    ELSE NULL
  END,
  tour_guide = CASE
    WHEN notes LIKE '%Guide:%' THEN
      TRIM(SPLIT_PART(SUBSTRING(notes FROM 'Guide:([^,]+)'), 'Guide:', 2))
    ELSE NULL
  END,
  tour_duration_minutes = CASE
    WHEN notes LIKE '%Duration:%' THEN
      CAST(TRIM(SPLIT_PART(SUBSTRING(notes FROM 'Duration:([0-9]+)'), 'Duration:', 2)) AS INTEGER)
    ELSE NULL
  END
WHERE event_description LIKE '%Tour:%' OR notes LIKE '%Meeting Point:%';

-- Insert sample tours
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tours LIMIT 1) THEN
    INSERT INTO public.tours (name, description, duration_minutes, max_participants, meeting_point, guide_name, guide_contact, schedule) VALUES
    (
      'Library Heritage Tour',
      'Explore the rich history and architecture of our historic library building. Learn about the founding of the library, its architectural significance, and view rare historical documents.',
      90,
      15,
      'Main Entrance Lobby',
      'Dr. Sarah Johnson',
      'sarah.johnson@library.edu',
      '[
        {"id": "sched-1", "dayOfWeek": 1, "startTime": "10:00", "availableSlots": 15},
        {"id": "sched-2", "dayOfWeek": 3, "startTime": "14:00", "availableSlots": 15},
        {"id": "sched-3", "dayOfWeek": 5, "startTime": "10:00", "availableSlots": 15}
      ]'::jsonb
    ),
    (
      'Digital Archives Tour',
      'Discover our extensive digital collection and research resources. Learn how to access rare manuscripts, historical documents, and academic databases.',
      60,
      10,
      'Digital Services Desk',
      'Prof. Michael Chen',
      'michael.chen@library.edu',
      '[
        {"id": "sched-4", "dayOfWeek": 2, "startTime": "11:00", "availableSlots": 10},
        {"id": "sched-5", "dayOfWeek": 4, "startTime": "15:00", "availableSlots": 10}
      ]'::jsonb
    ),
    (
      'Children\'s Literature Tour',
      'A fun and educational tour of our children\'s literature collection. Perfect for families and educators interested in children\'s books and reading programs.',
      45,
      20,
      'Children\'s Section',
      'Ms. Emily Rodriguez',
      'emily.rodriguez@library.edu',
      '[
        {"id": "sched-6", "dayOfWeek": 6, "startTime": "10:30", "availableSlots": 20}
      ]'::jsonb
    );
  END IF;
END $$;

-- Enable Row Level Security for tours table
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tours
DROP POLICY IF EXISTS "Anyone can view active tours" ON public.tours;
CREATE POLICY "Anyone can view active tours" ON public.tours FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage tours" ON public.tours;
CREATE POLICY "Admins can manage tours" ON public.tours FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- Add trigger for updated_at on tours table
DROP TRIGGER IF EXISTS handle_updated_at_tours ON public.tours;
CREATE TRIGGER handle_updated_at_tours BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON public.tours(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_info ON public.bookings(room_id) WHERE event_description LIKE '%Tour:%';

-- Grant permissions
GRANT SELECT ON public.tour_bookings TO authenticated;
GRANT SELECT ON public.tour_bookings TO anon;

-- Comments for documentation
COMMENT ON TABLE public.tours IS 'Library tours with schedules and capacity information';
COMMENT ON VIEW public.tour_bookings IS 'Combined view of bookings and tour information for tour bookings';
COMMENT ON COLUMN public.tours.schedule IS 'JSON array of tour schedules with day of week, start time, and available slots';
COMMENT ON COLUMN public.bookings.participant_count IS 'Number of participants for tour bookings (alias for guest_count)';