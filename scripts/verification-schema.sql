-- Create Verification Status Enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    method TEXT CHECK (method IN ('email', 'document')),
    school_email TEXT,
    document_url TEXT,
    status verification_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false; -- Global Admin Flag

-- Enable RLS on verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_requests
-- Users can insert their own request
CREATE POLICY "Users can create verification requests" 
ON verification_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own verification requests" 
ON verification_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests" 
ON verification_requests FOR SELECT 
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Admins can update requests
CREATE POLICY "Admins can update verification requests" 
ON verification_requests FOR UPDATE 
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-docs', 'verification-docs', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

-- RLS for Storage Objects (verification-docs)
CREATE POLICY "Users can upload their own ID"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'verification-docs' AND 
    auth.uid() = owner
);

-- Admins can view all IDs
CREATE POLICY "Admins can view all IDs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'verification-docs' AND
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Allow users to view their own uploaded ID (optional, for preview)
CREATE POLICY "Users can view their own ID"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'verification-docs' AND
    auth.uid() = owner
);
