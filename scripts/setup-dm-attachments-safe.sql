-- 1. Update dm_messages table to support attachments
ALTER TABLE dm_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 2. Create Storage Bucket for DM Attachments
-- We use INSERT instead of creating via UI to ensure it exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('dm_attachments', 'dm_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Note: We skipped 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY' as it often causes permission errors and is usually enabled by default.

-- Policy: Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload DM attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload DM attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'dm_attachments' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view files
DROP POLICY IF EXISTS "Authenticated users can view DM attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view DM attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'dm_attachments');

-- Policy: Allow users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete their own DM attachments" ON storage.objects;
CREATE POLICY "Users can delete their own DM attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'dm_attachments'
    AND owner = auth.uid()
);
