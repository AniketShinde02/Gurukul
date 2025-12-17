-- Add onboarding and session fields to profiles table
-- Run this in Supabase SQL Editor

-- Add session field (e.g., "JEE 2025", "NEET 2024")
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS session TEXT;

-- Add profile completion tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add tour completion tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding timestamps
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_tour_completed ON profiles(tour_completed);

-- Comment for documentation
COMMENT ON COLUMN profiles.session IS 'User''s current study goal/session (e.g., JEE 2025, NEET 2024)';
COMMENT ON COLUMN profiles.profile_completed IS 'Whether user has completed mandatory profile setup';
COMMENT ON COLUMN profiles.tour_completed IS 'Whether user has completed the onboarding tour';
