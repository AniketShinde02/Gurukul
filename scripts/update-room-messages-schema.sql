-- Add missing columns to room_messages table to support rich chat features

-- 1. Add 'type' column
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'gif', 'file', 'system'));

-- 2. Add 'file_url' column for attachments
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 3. Add 'parent_id' for replies (self-referencing)
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES room_messages(id) ON DELETE SET NULL;

-- 4. Add 'is_edited' flag
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- 5. Update RLS Policies to allow Editing and Deleting own messages

-- Drop existing policies if they conflict (optional, but safer to be explicit)
DROP POLICY IF EXISTS "Users can update own messages" ON room_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON room_messages;

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update own messages"
ON room_messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON room_messages FOR DELETE
USING (auth.uid() = sender_id);

-- 6. Ensure Storage Bucket exists for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage Policies (if not already set)
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
