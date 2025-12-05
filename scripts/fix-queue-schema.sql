-- Fix Waiting Queue Schema and RLS
-- Run this in your Supabase SQL Editor

-- 1. Add preferences column if it doesn't exist
ALTER TABLE waiting_queue 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- 2. Enable RLS (just in case)
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to UPDATE their own queue entry (Required for UPSERT)
DROP POLICY IF EXISTS "Users can update own queue entry" ON waiting_queue;
CREATE POLICY "Users can update own queue entry"
ON waiting_queue FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can join queue" ON waiting_queue;
CREATE POLICY "Users can join queue" 
ON waiting_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can leave queue" ON waiting_queue;
CREATE POLICY "Users can leave queue" 
ON waiting_queue FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Ensure SELECT policy exists
DROP POLICY IF EXISTS "Users can view queue" ON waiting_queue;
CREATE POLICY "Users can view queue" 
ON waiting_queue FOR SELECT 
USING (true);
