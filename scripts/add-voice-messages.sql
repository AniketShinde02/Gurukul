-- 🎙️ VOICE MESSAGES SCHEMA
-- Stores metadata for voice messages

-- 1. Add voice message type support
-- (Already exists in messages table, just documenting)
-- type can be: 'text', 'image', 'file', 'gif', 'voice'

-- 2. Create voice_messages metadata table
CREATE TABLE IF NOT EXISTS voice_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL, -- References dm_messages.id or room_messages.id
    message_type TEXT NOT NULL CHECK (message_type IN ('dm', 'room')),
    storage_path TEXT NOT NULL, -- Supabase Storage path
    duration_seconds INTEGER NOT NULL, -- Audio duration
    file_size_bytes INTEGER NOT NULL,
    waveform_data JSONB, -- Waveform visualization data [0.2, 0.5, 0.8, ...]
    transcription TEXT, -- Future: AI transcription
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, message_type)
);

-- 3. Enable RLS
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view voice messages in their conversations"
ON voice_messages FOR SELECT
USING (
    CASE message_type
        WHEN 'dm' THEN EXISTS (
            SELECT 1 FROM dm_messages dm
            JOIN dm_conversations dc ON dm.conversation_id = dc.id
            WHERE dm.id = voice_messages.message_id
            AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
        )
        WHEN 'room' THEN EXISTS (
            SELECT 1 FROM room_messages rm
            WHERE rm.id = voice_messages.message_id
        )
        ELSE FALSE
    END
);

CREATE POLICY "Users can insert voice messages"
ON voice_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS voice_messages_message_id_idx ON voice_messages(message_id);
CREATE INDEX IF NOT EXISTS voice_messages_created_at_idx ON voice_messages(created_at DESC);

-- 6. Storage bucket (run this in Supabase Dashboard > Storage)
-- Bucket name: 'voice-messages'
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: audio/webm, audio/ogg, audio/mp4, audio/mpeg

-- 7. Storage RLS policies (run in Supabase Dashboard > Storage > voice-messages > Policies)
-- Policy 1: Allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload voice messages"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'voice-messages' AND auth.uid() IS NOT NULL);

-- Policy 2: Allow users to read voice messages in their conversations
-- CREATE POLICY "Users can read voice messages"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'voice-messages' AND auth.uid() IS NOT NULL);
