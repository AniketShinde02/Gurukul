-- Clean up unwanted rooms from the database
-- Use this to manually delete verify/delete rooms

-- 1. View all rooms first (Safety Check)
-- SELECT * FROM study_rooms;

-- 2. Delete rooms with specific names (Uncomment to execute)
DELETE FROM study_rooms 
WHERE name ILIKE 'Demo Server' 
   OR name ILIKE 'Test Server';

-- 3. Delete by ID (if you know the UUID)
-- DELETE FROM study_rooms WHERE id = 'your-uuid-here';

-- Note: 'demo-server' (string ID) cannot exist in the database because the ID column is UUID type.
-- The ghost room you saw was purely in the React code (which I have now removed).
