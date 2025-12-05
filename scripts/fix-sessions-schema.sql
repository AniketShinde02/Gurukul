-- Fix chat_sessions schema to add missing status column if needed
-- Run this in Supabase SQL Editor

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE chat_sessions 
        ADD COLUMN status TEXT DEFAULT 'active';
        
        -- Create index for faster queries
        CREATE INDEX idx_chat_sessions_status 
        ON chat_sessions(status);
    END IF;
END $$;

-- Ensure all existing sessions have a status
UPDATE chat_sessions 
SET status = 'active' 
WHERE status IS NULL;
