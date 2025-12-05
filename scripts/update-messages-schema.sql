-- Update room_messages table
ALTER TABLE room_messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'gif', 'system')),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update dm_messages table
-- First drop the existing check constraint if possible, or just add the column if it didn't exist (it does).
-- Since we can't easily modify a check constraint in one line without knowing its name, we'll try to drop it or just alter the column.
-- Supabase/Postgres usually names it dm_messages_type_check.

ALTER TABLE dm_messages DROP CONSTRAINT IF EXISTS dm_messages_type_check;
ALTER TABLE dm_messages ADD CONSTRAINT dm_messages_type_check CHECK (type IN ('text', 'system', 'image', 'file', 'gif'));

ALTER TABLE dm_messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
