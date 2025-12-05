-- Update room_messages table to support rich media and threading
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES room_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- Create storage bucket for chat attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Policy to allow public viewing
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
