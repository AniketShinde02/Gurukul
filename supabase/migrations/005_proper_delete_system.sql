-- ============================================
-- PROPER DELETE CHAT SYSTEM (Discord/Instagram Style)
-- ============================================
-- This creates a system where:
-- 1. Each user can delete chat independently
-- 2. Deleted messages are hidden for that user only
-- 3. Other user still sees all messages
-- 4. Fresh start when deleted user sends new message
-- ============================================

-- Step 1: Add deleted_by columns to track who deleted what
ALTER TABLE dm_conversations
ADD COLUMN IF NOT EXISTS deleted_by_user1_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by_user2_at TIMESTAMP;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_dm_conversations_deleted
ON dm_conversations(user1_id, deleted_by_user1_at, user2_id, deleted_by_user2_at);

-- Step 3: Remove old archive columns (we're replacing this system)
-- Note: Only run this if you're sure you want to remove archive functionality
-- ALTER TABLE dm_conversations
-- DROP COLUMN IF EXISTS archived_by_user1,
-- DROP COLUMN IF EXISTS archived_by_user2;

-- Step 4: Verify the changes
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dm_conversations' 
AND column_name LIKE '%deleted%'
ORDER BY ordinal_position;

-- ============================================
-- HOW IT WORKS:
-- ============================================
-- When User 1 "deletes" chat:
--   - Set deleted_by_user1_at = NOW()
--   - Conversation stays in database
--   - User 1 only sees messages AFTER this timestamp
--   - User 2 sees ALL messages (their deleted_by_user2_at is NULL)
--
-- When User 1 sends new message:
--   - Message is created normally
--   - User 1 sees only new messages (after delete timestamp)
--   - User 2 sees ALL messages (old + new)
--
-- When User 2 also deletes:
--   - Set deleted_by_user2_at = NOW()
--   - Now both users only see messages after their respective delete times
-- ============================================

-- Example query to get messages for User 1:
-- SELECT * FROM dm_messages 
-- WHERE conversation_id = 'xxx'
-- AND created_at > COALESCE(
--     (SELECT deleted_by_user1_at FROM dm_conversations WHERE id = 'xxx'),
--     '1970-01-01'
-- )
-- ORDER BY created_at ASC;
