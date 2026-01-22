-- Fixed Database Schema for Library Reservation System
-- This schema contains corrected RLS policies to prevent infinite recursion
-- Based on comprehensive codebase analysis

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'member', 'user');
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- Create profiles table (without unused profile_photo column)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user',
  institution TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create rooms table (without unused rules column)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  facilities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  layout TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookings table (without unused columns)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status reservation_status DEFAULT 'pending',
  event_description TEXT,
  guest_count INTEGER,
  proposal_file TEXT,
  notes TEXT,
  institution TEXT,
  is_tour BOOLEAN DEFAULT false,
  contact_name TEXT,
  contact_institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure no overlapping approved bookings for the same room
  CONSTRAINT no_overlap EXCLUDE USING gist (room_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE (status = 'approved'),
  
  -- Additional constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT future_booking CHECK (start_time > TIMEZONE('utc'::text, NOW()))
);

-- Create indexes for better performance (only for actively used columns)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(start_time, end_time);

-- Create updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (idempotent)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for rooms table (FIXED - simplified logic)
-- Drop all existing policies first
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can manage all rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can view all rooms" ON rooms;

-- Simplified policies for rooms
CREATE POLICY "Anyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and staff can manage all rooms" ON rooms
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- RLS Policies for bookings table (FIXED - allows users to cancel their own pending bookings)
-- Drop all existing policies first
DROP POLICY IF EXISTS "Anyone can view approved bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can update booking status" ON bookings;

-- Simplified policies for bookings
CREATE POLICY "Anyone can view approved bookings" ON bookings
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fixed policy: Users can update their own bookings from pending to cancelled
-- This uses OLD.status to check the previous state before the update
CREATE POLICY "Users can update their own pending bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = user_id AND OLD.status = 'pending'
  );

CREATE POLICY "Admins and staff can manage all bookings" ON bookings
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Function to handle user registration (removed - profile creation handled by API)
-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO profiles (id, email, full_name)
--   VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration (removed - profile creation handled by API)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check for booking conflicts (idempotent)
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_room_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE room_id = p_room_id
    AND status IN ('pending', 'approved')
    AND (p_booking_id IS NULL OR id != p_booking_id)
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time);
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Insert sample room data (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms LIMIT 1) THEN
    INSERT INTO rooms (name, description, capacity, facilities, photos, layout) VALUES
    (
      'Library Theater',
      'Modern theater with state-of-the-art audio-visual equipment, perfect for presentations, seminars, and cultural events.',
      150,
      ARRAY['Proyektor', 'Sound System', 'Stage', 'AC', 'Microphone', 'Lighting System'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Theater-style seating with stage at front'
    ),
    (
      'Aula Gedung (Full)',
      'Large multipurpose hall suitable for conferences, exhibitions, and major events.',
      350,
      ARRAY['AC', 'Sound System', 'Catering Facility', 'Stage', 'Parking Area', 'WiFi'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Open floor plan with stage area'
    ),
    (
      'Aula Gedung (Setengah)',
      'Half section of the main hall with flexible partitioning for medium-sized events.',
      175,
      ARRAY['AC', 'Sound System', 'Flexible Partisi', 'WiFi', 'Projector'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Flexible partition layout'
    ),
    (
      'Ruang Inklusi Sosial',
      'Accessible meeting room designed for inclusive gatherings and community programs.',
      30,
      ARRAY['Wheelchair Accessible', 'Assistive Technology', 'AC', 'WiFi', 'Whiteboard'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Accessible circular seating arrangement'
    ),
    (
      'Ruang Rapat',
      'Professional meeting room equipped for business meetings and video conferences.',
      20,
      ARRAY['Video Conference', 'Whiteboard', 'AC', 'WiFi', 'Projector', 'Conference Table'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Boardroom-style with video conference setup'
    ),
    (
      'Library Stage Outdoor',
      'Open-air stage perfect for outdoor events, cultural performances, and community gatherings.',
      200,
      ARRAY['Outdoor Stage', 'Sound System', 'Lighting', 'Weather Dependent'],
      ARRAY['/gedungperpusaceh.jpg'],
      'Outdoor stage with open seating area'
    );
  END IF;
END $$;