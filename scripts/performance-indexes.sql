-- ============================================
-- PERFORMANCE INDEXES FOR SANGHA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DM Conversations: Speed up user lookup with ordering
-- These replace slow OR queries with fast indexed lookups
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1_last_message 
ON dm_conversations (user1_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2_last_message 
ON dm_conversations (user2_id, last_message_at DESC);

-- 2. DM Messages: Speed up message fetch per conversation
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created 
ON dm_messages (conversation_id, created_at DESC);

-- 3. Room Messages: Speed up channel message fetch (critical for chat)
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created 
ON room_messages (room_id, created_at DESC);

-- 4. Room Participants: Speed up membership checks
CREATE INDEX IF NOT EXISTS idx_room_participants_room_user 
ON room_participants (room_id, user_id);

CREATE INDEX IF NOT EXISTS idx_room_participants_user 
ON room_participants (user_id);

-- 5. Room Channels: Speed up channel fetch per room
CREATE INDEX IF NOT EXISTS idx_room_channels_room_position 
ON room_channels (room_id, position);

-- 6. Study Rooms: Speed up active room listing
CREATE INDEX IF NOT EXISTS idx_study_rooms_active_created 
ON study_rooms (is_active, created_at DESC);

-- 7. Profiles: Speed up user lookups (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles (username);

-- 8. Study Connections: Speed up friend lookups
CREATE INDEX IF NOT EXISTS idx_study_connections_requester_status 
ON study_connections (requester_id, status);

CREATE INDEX IF NOT EXISTS idx_study_connections_receiver_status 
ON study_connections (receiver_id, status);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
