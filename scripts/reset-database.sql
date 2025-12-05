-- ChitChat Database Reset & Setup Script
-- WARNING: THIS WILL DELETE ALL EXISTING DATA IN THE TABLES
-- Run this in your Supabase SQL Editor to ensure a clean slate that matches the code

-- 1. Drop existing objects to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_online_status();

DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS waiting_queue CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create profiles table (Updated to match Chat App requirements)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  total_chats INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  -- Fields from the original plan (optional, keeping for future use)
  study_goals JSONB,
  subjects TEXT[]
);

-- 4. Create chat_sessions table
CREATE TABLE chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'reported')),
  ended_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 5. Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  file_url TEXT,
  file_name TEXT,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create waiting_queue table
CREATE TABLE waiting_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB
);

-- 7. Create reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved'))
);

-- 8. Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_online ON profiles(is_online);
CREATE INDEX idx_chat_sessions_user1 ON chat_sessions(user1_id);
CREATE INDEX idx_chat_sessions_user2 ON chat_sessions(user2_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_waiting_queue_joined_at ON waiting_queue(joined_at);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);

-- 9. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat Sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can insert chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages
CREATE POLICY "Users can view messages from their sessions" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND (chat_sessions.user1_id = auth.uid() OR chat_sessions.user2_id = auth.uid())
    )
  );
CREATE POLICY "Users can insert messages to their sessions" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = session_id
      AND (chat_sessions.user1_id = auth.uid() OR chat_sessions.user2_id = auth.uid())
      AND status = 'active'
    )
  );

-- Waiting Queue
CREATE POLICY "Users can manage own queue entry" ON waiting_queue
  FOR ALL USING (user_id = auth.uid());

-- Reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 11. Functions and Triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    'Anonymous' || EXTRACT(EPOCH FROM NOW())::INTEGER
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
