-- ===========================================
-- USER PROVIDED LEGACY QUERIES DUMP
-- ===========================================
-- This file contains a collection of SQL queries the user ran previously.
-- Saved for reference to understand potential database state.
-- NOTE: Many of these conflict with the current clean schema.

-- [SAFE SUPABASE SCHEMA]
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (users) - with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id TEXT UNIQUE,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    is_student BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    total_chats INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE
);

-- [ADDITIONAL COLUMNS]
-- Add gender, is_student, onboarding_completed if missing...

-- [CHAT SESSIONS]
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    session_type TEXT DEFAULT 'random' CHECK (session_type IN ('random', 'video', 'text')),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user1_id, user2_id)
);

-- [MESSAGES]
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    is_moderated BOOLEAN DEFAULT FALSE
);

-- [REPORTS & MODERATION]
CREATE TABLE IF NOT EXISTS reports (...);
CREATE TABLE IF NOT EXISTS moderation_queue (...);

-- [FUNCTIONS & TRIGGERS]
CREATE OR REPLACE FUNCTION public.handle_new_user()...

-- [COMPLEX MATCHING COLUMNS]
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender_preference TEXT...
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS major TEXT;

-- [DUPLICATE TABLES]
CREATE TABLE IF NOT EXISTS chat_messages (...); -- Duplicate of messages
CREATE TABLE IF NOT EXISTS typing_indicators (...); -- Bad practice, use Presence

-- [PERFORMANCE FIXES]
-- Various RLS policy drops and recreates...
-- Various Index creations...

-- [MY CLEAN SCRIPT]
-- (The script provided in the previous turn)
