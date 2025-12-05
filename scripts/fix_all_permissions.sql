-- NUCLEAR OPTION: Disable RLS on ALL key tables to restore data visibility immediately
-- Run this in Supabase SQL Editor

-- 1. Server & Membership Tables
ALTER TABLE public.servers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members DISABLE ROW LEVEL SECURITY;

-- 2. User Profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. DM & Friends Tables
ALTER TABLE public.dm_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_connections DISABLE ROW LEVEL SECURITY; -- Friends

-- 4. Room & Channel Tables
ALTER TABLE public.study_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bans DISABLE ROW LEVEL SECURITY;

-- 5. Whiteboard & Other
ALTER TABLE public.whiteboard_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_timers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions DISABLE ROW LEVEL SECURITY;

-- 6. Verify by granting explicit permissions (just in case)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
