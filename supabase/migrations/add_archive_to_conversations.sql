-- Add archived column to dm_conversations
ALTER TABLE dm_conversations 
ADD COLUMN IF NOT EXISTS archived_by_user1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_by_user2 BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dm_conversations_archived 
ON dm_conversations(user1_id, archived_by_user1, user2_id, archived_by_user2);

-- Update RLS policies to handle archived conversations
-- Users can still see their archived conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON dm_conversations;
CREATE POLICY "Users can view their conversations" ON dm_conversations
    FOR SELECT USING (
        auth.uid() = user1_id OR auth.uid() = user2_id
    );
