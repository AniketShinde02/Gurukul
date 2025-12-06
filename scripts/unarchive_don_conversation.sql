-- Unarchive all conversations with Don
-- Run this in Supabase SQL Editor to immediately unarchive

UPDATE dm_conversations
SET 
    archived_by_user1 = false,
    archived_by_user2 = false
WHERE 
    (user1_id IN (SELECT id FROM profiles WHERE username = 'don'))
    OR 
    (user2_id IN (SELECT id FROM profiles WHERE username = 'don'));

-- Verify the update
SELECT 
    dc.id,
    p1.username as user1,
    p2.username as user2,
    dc.archived_by_user1,
    dc.archived_by_user2,
    dc.last_message_at
FROM dm_conversations dc
LEFT JOIN profiles p1 ON dc.user1_id = p1.id
LEFT JOIN profiles p2 ON dc.user2_id = p2.id
WHERE 
    p1.username = 'don' OR p2.username = 'don';
