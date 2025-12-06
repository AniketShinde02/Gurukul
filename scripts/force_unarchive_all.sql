-- STEP 1: Check current state of conversations
SELECT 
    dc.id,
    p1.username as user1_username,
    p1.id as user1_id,
    p2.username as user2_username,
    p2.id as user2_id,
    dc.archived_by_user1,
    dc.archived_by_user2,
    dc.last_message_at,
    dc.last_message_preview
FROM dm_conversations dc
LEFT JOIN profiles p1 ON dc.user1_id = p1.id
LEFT JOIN profiles p2 ON dc.user2_id = p2.id
WHERE p1.username IN ('don', 'ai.captioncraft') 
   OR p2.username IN ('don', 'ai.captioncraft')
ORDER BY dc.last_message_at DESC;

-- STEP 2: Force unarchive ALL conversations
UPDATE dm_conversations
SET 
    archived_by_user1 = false,
    archived_by_user2 = false,
    updated_at = NOW()
WHERE 
    archived_by_user1 = true 
    OR archived_by_user2 = true;

-- STEP 3: Verify the update
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
ORDER BY dc.last_message_at DESC;

-- STEP 4: Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dm_conversations' 
AND column_name LIKE '%archive%';
