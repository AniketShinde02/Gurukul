-- Module 1: Add Critical Indices to stop full table scans

-- 1. Index for DM Messages (Pagination & Filtering)
-- Optimizes: .eq('conversation_id', ...).order('created_at', descending)
-- Table: dm_messages
CREATE INDEX IF NOT EXISTS idx_dm_messages_conv_created 
ON dm_messages (conversation_id, created_at DESC);

-- 2. Index for Room Messages (Room Chat)
-- Optimizes: .eq('room_id', ...).order('created_at', descending)
-- Table: room_messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created
ON room_messages (room_id, created_at DESC);

-- 3. Index for Study Sessions (Time range queries)
-- Optimizes: .eq('user_id', ...).gte('started_at', ...).lte('completed_at', ...)
-- Table: study_sessions (Columns corrected to started_at, completed_at)
CREATE INDEX IF NOT EXISTS idx_sessions_user_time 
ON study_sessions (user_id, started_at, completed_at);
