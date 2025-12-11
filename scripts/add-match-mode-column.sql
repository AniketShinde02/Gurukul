-- Migration: Add match_mode column to waiting_queue
-- This is required for the production matchmaking system

-- Add match_mode column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waiting_queue' 
        AND column_name = 'match_mode'
    ) THEN
        ALTER TABLE waiting_queue 
        ADD COLUMN match_mode TEXT DEFAULT 'buddies_first';
    END IF;
END $$;

-- Update existing rows
UPDATE waiting_queue SET match_mode = 'buddies_first' WHERE match_mode IS NULL;
