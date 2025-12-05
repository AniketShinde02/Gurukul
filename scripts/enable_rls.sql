-- PRODUCTION SECURITY SCRIPT
-- Run this when you are ready to secure the database for real users.
-- This enables Row Level Security (RLS) and sets up standard policies.
-- It is safe to run multiple times (it drops existing policies first).

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CREATE POLICIES (The Rules)
-- ==========================================

-- PROFILES
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SERVERS
DROP POLICY IF EXISTS "View servers" ON public.servers;
CREATE POLICY "View servers" ON public.servers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Create servers" ON public.servers;
CREATE POLICY "Create servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Update servers" ON public.servers;
CREATE POLICY "Update servers" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);

-- SERVER MEMBERS
DROP POLICY IF EXISTS "View memberships" ON public.server_members;
CREATE POLICY "View memberships" ON public.server_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Join servers" ON public.server_members;
CREATE POLICY "Join servers" ON public.server_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STUDY ROOMS
DROP POLICY IF EXISTS "View rooms" ON public.study_rooms;
CREATE POLICY "View rooms" ON public.study_rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Create rooms" ON public.study_rooms;
CREATE POLICY "Create rooms" ON public.study_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Update rooms" ON public.study_rooms;
CREATE POLICY "Update rooms" ON public.study_rooms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM room_participants WHERE room_id = id AND user_id = auth.uid() AND role IN ('host', 'moderator'))
);

-- ROOM PARTICIPANTS
DROP POLICY IF EXISTS "View participants" ON public.room_participants;
CREATE POLICY "View participants" ON public.room_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Join rooms" ON public.room_participants;
CREATE POLICY "Join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leave rooms" ON public.room_participants;
CREATE POLICY "Leave rooms" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);

-- ROOM MESSAGES
DROP POLICY IF EXISTS "View messages" ON public.room_messages;
CREATE POLICY "View messages" ON public.room_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Send messages" ON public.room_messages;
CREATE POLICY "Send messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ROOM CHANNELS
DROP POLICY IF EXISTS "View channels" ON public.room_channels;
CREATE POLICY "View channels" ON public.room_channels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage channels" ON public.room_channels;
CREATE POLICY "Manage channels" ON public.room_channels FOR ALL USING (
  EXISTS (SELECT 1 FROM room_participants WHERE room_id = room_channels.room_id AND user_id = auth.uid() AND role IN ('host', 'moderator'))
);

-- ROOM ROLES
DROP POLICY IF EXISTS "View roles" ON public.room_roles;
CREATE POLICY "View roles" ON public.room_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage roles" ON public.room_roles;
CREATE POLICY "Manage roles" ON public.room_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM room_participants WHERE room_id = room_roles.room_id AND user_id = auth.uid() AND role IN ('host', 'moderator'))
);

-- DM CONVERSATIONS
DROP POLICY IF EXISTS "View own conversations" ON public.dm_conversations;
CREATE POLICY "View own conversations" ON public.dm_conversations FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

DROP POLICY IF EXISTS "Start conversation" ON public.dm_conversations;
CREATE POLICY "Start conversation" ON public.dm_conversations FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- DM MESSAGES
DROP POLICY IF EXISTS "View own messages" ON public.dm_messages;
CREATE POLICY "View own messages" ON public.dm_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_conversations WHERE id = conversation_id AND (user1_id = auth.uid() OR user2_id = auth.uid()))
);

DROP POLICY IF EXISTS "Send DM" ON public.dm_messages;
CREATE POLICY "Send DM" ON public.dm_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- WHITEBOARD
DROP POLICY IF EXISTS "View whiteboard" ON public.whiteboard_data;
CREATE POLICY "View whiteboard" ON public.whiteboard_data FOR SELECT USING (true);

DROP POLICY IF EXISTS "Update whiteboard" ON public.whiteboard_data;
CREATE POLICY "Update whiteboard" ON public.whiteboard_data FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Insert whiteboard" ON public.whiteboard_data;
CREATE POLICY "Insert whiteboard" ON public.whiteboard_data FOR INSERT WITH CHECK (true);

-- STUDY SESSIONS
DROP POLICY IF EXISTS "View own sessions" ON public.study_sessions;
CREATE POLICY "View own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Log session" ON public.study_sessions;
CREATE POLICY "Log session" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
