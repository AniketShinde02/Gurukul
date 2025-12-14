-- Add screenshot_url column to user_reports table
ALTER TABLE user_reports 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add moderation columns for AI moderation
ALTER TABLE user_reports
ADD COLUMN IF NOT EXISTS moderation_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS auto_action_taken TEXT;

-- Create report-screenshots storage bucket (run this in Supabase Dashboard)
-- Bucket name: report-screenshots
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png

-- RLS policy for report screenshots
-- Users can upload screenshots when creating reports
-- Admins can view all screenshots
