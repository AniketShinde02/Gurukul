-- 💥 MESSAGE REACTIONS FEATURE

-- 1. Create PUBLIC ROOM Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 2. Create DM Reactions Table
CREATE TABLE IF NOT EXISTS dm_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES dm_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_message_id ON dm_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user_id ON dm_reactions(user_id);

-- 4. RLS Policies

-- Public Rooms
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can see reactions" ON message_reactions;
CREATE POLICY "Everyone can see reactions" ON message_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reactions" ON message_reactions;
CREATE POLICY "Users can delete own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- DMs
ALTER TABLE dm_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parties can see reactions" ON dm_reactions;
CREATE POLICY "Parties can see reactions" ON dm_reactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM dm_messages m 
        JOIN dm_conversations c ON m.conversation_id = c.id
        WHERE m.id = dm_reactions.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);
DROP POLICY IF EXISTS "Parties can add reactions" ON dm_reactions;
CREATE POLICY "Parties can add reactions" ON dm_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Parties can delete reactions" ON dm_reactions;
CREATE POLICY "Parties can delete reactions" ON dm_reactions FOR DELETE USING (auth.uid() = user_id);

-- 4. Realtime (Optional: Add to publication if you want live updates)
-- ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
