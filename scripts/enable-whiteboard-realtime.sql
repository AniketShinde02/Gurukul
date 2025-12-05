-- Enable Realtime for whiteboard_data table
-- This allows Supabase to broadcast changes in real-time

-- First, check if replication is enabled
ALTER TABLE whiteboard_data REPLICA IDENTITY FULL;

-- Enable realtime publication
-- Note: You may need to run this in Supabase Dashboard > Database > Replication
-- Or use the Supabase CLI

-- For Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Find "whiteboard_data" table
-- 3. Enable "Realtime" toggle

-- Alternative: Use Supabase API to enable realtime
-- This requires running in Supabase SQL Editor with proper permissions

DO $$
BEGIN
    -- Enable realtime for the table
    PERFORM pg_notify('realtime', json_build_object(
        'table', 'whiteboard_data',
        'schema', 'public'
    )::text);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not enable realtime automatically. Please enable it manually in Dashboard > Database > Replication';
END $$;

-- Verify the table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'whiteboard_data'
ORDER BY ordinal_position;
