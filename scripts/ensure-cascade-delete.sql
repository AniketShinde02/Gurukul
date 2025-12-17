-- ENSURE CASCADE DELETE ON FOREIGN KEYS
-- Run this in Supabase SQL Editor AFTER cascade-delete-user.sql

-- This ensures that when a profile is deleted, all related data is also deleted

-- 1. Update chat_sessions foreign keys to CASCADE
ALTER TABLE public.chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_user1_id_fkey,
DROP CONSTRAINT IF EXISTS chat_sessions_user2_id_fkey;

ALTER TABLE public.chat_sessions
ADD CONSTRAINT chat_sessions_user1_id_fkey 
    FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT chat_sessions_user2_id_fkey 
    FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Update messages foreign key to CASCADE
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Update waiting_queue foreign key to CASCADE
ALTER TABLE public.waiting_queue
DROP CONSTRAINT IF EXISTS waiting_queue_user_id_fkey;

ALTER TABLE public.waiting_queue
ADD CONSTRAINT waiting_queue_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Update reports foreign keys to CASCADE
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;

ALTER TABLE public.reports
ADD CONSTRAINT reports_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT reports_reported_user_id_fkey 
    FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Update server_members foreign key to CASCADE
ALTER TABLE public.server_members
DROP CONSTRAINT IF EXISTS server_members_user_id_fkey;

ALTER TABLE public.server_members
ADD CONSTRAINT server_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Update servers foreign key to CASCADE
ALTER TABLE public.servers
DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;

ALTER TABLE public.servers
ADD CONSTRAINT servers_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Verify all foreign keys have CASCADE
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;
