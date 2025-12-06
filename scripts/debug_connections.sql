-- Check study_connections table
SELECT 
    sc.id,
    sc.status,
    sc.created_at,
    p1.username as requester_username,
    p1.id as requester_id,
    p2.username as receiver_username,
    p2.id as receiver_id
FROM study_connections sc
LEFT JOIN profiles p1 ON sc.requester_id = p1.id
LEFT JOIN profiles p2 ON sc.receiver_id = p2.id
ORDER BY sc.created_at DESC;

-- Check if there are any accepted connections
SELECT COUNT(*) as accepted_connections
FROM study_connections
WHERE status = 'accepted';

-- Check if Don is in the profiles
SELECT id, username, full_name
FROM profiles
WHERE username ILIKE '%don%';
