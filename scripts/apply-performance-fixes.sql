-- ==========================================
-- GURUKUL PERFORMANCE & SCALABILITY PATCH
-- ==========================================
-- Run this entire script in your Supabase SQL Editor.

-- 1. INDEXES FOR SPEED (Removes Table Scans)
-- ==========================================

-- Messages: Speed up loading session chat history (Matchmaking)
CREATE INDEX IF NOT EXISTS idx_messages_session_created 
ON messages(session_id, created_at DESC);

-- Room Messages: Speed up loading Sangha room chat history
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created 
ON room_messages(room_id, created_at DESC);

-- DM Messages: Speed up loading DM history
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created 
ON dm_messages(conversation_id, created_at DESC);

-- DM Conversations: Speed up listing conversations (User 1)
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1_updated 
ON dm_conversations(user1_id, updated_at DESC);

-- DM Conversations: Speed up listing conversations (User 2)
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2_updated 
ON dm_conversations(user2_id, updated_at DESC);

-- Waiting Queue: Speed up matchmaking lookups
CREATE INDEX IF NOT EXISTS idx_waiting_queue_joined_at 
ON waiting_queue(joined_at ASC);

-- Room Participants: Speed up permission checks (was memberships)
CREATE INDEX IF NOT EXISTS idx_room_participants_user_room 
ON room_participants(user_id, room_id);

-- Study Rooms: Speed up listing rooms
CREATE INDEX IF NOT EXISTS idx_study_rooms_created 
ON study_rooms(created_at DESC);

-- Study Connections: Speed up friend list & DM checks
CREATE INDEX IF NOT EXISTS idx_study_connections_users 
ON study_connections(requester_id, receiver_id, status);


-- 2. ATOMIC MATCHMAKING FUNCTION (Prevents Race Conditions)
-- ========================================================

CREATE OR REPLACE FUNCTION match_and_update_atomic(
    user_a_id UUID,
    user_b_id UUID
)
RETURNS TABLE(session_id UUID) AS $$
DECLARE
    v_session_id UUID;
    v_user_a_chat_count INT;
    v_user_b_chat_count INT;
BEGIN
    -- Create chat session atomically
    INSERT INTO chat_sessions (user1_id, user2_id, started_at, status)
    VALUES (user_a_id, user_b_id, NOW(), 'active')
    RETURNING id INTO v_session_id;

    -- Remove both users from queue atomically
    DELETE FROM waiting_queue
    WHERE user_id IN (user_a_id, user_b_id);

    -- Get current chat counts (handle nulls with COALESCE)
    SELECT COALESCE(total_chats, 0) INTO v_user_a_chat_count
    FROM profiles WHERE id = user_a_id;
    
    SELECT COALESCE(total_chats, 0) INTO v_user_b_chat_count
    FROM profiles WHERE id = user_b_id;

    -- Update both profiles atomically
    UPDATE profiles
    SET 
        total_chats = v_user_a_chat_count + 1,
        is_online = true,
        last_seen = NOW()
    WHERE id = user_a_id;

    UPDATE profiles
    SET 
        total_chats = v_user_b_chat_count + 1,
        is_online = true,
        last_seen = NOW()
    WHERE id = user_b_id;

    RETURN QUERY SELECT v_session_id;
END;
$$ LANGUAGE plpgsql;


-- 3. STORAGE SETUP (If not already present)
-- ==========================================
-- Attempt to create the uploads bucket if it doesn't exist.
-- Note: This requires proper permissions. If it fails, create 'uploads' bucket in Dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to their own folder
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow viewing own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
