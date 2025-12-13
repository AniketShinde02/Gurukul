-- 📌 MESSAGE PINNING FEATURE

-- 1. DM Pinned Messages
CREATE TABLE IF NOT EXISTS dm_pinned_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES dm_messages(id) ON DELETE CASCADE NOT NULL,
    pinned_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id) -- Only one pin per message (it's either pinned or not)
);

-- 2. Room Pinned Messages
CREATE TABLE IF NOT EXISTS room_pinned_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE NOT NULL,
    pinned_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id)
);

-- 3. RLS Policies

-- DMs: Allow participants to see pins
ALTER TABLE dm_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view pins"
ON dm_pinned_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM dm_messages m 
        JOIN dm_conversations c ON m.conversation_id = c.id
        WHERE m.id = dm_pinned_messages.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

CREATE POLICY "Participants can pin messages"
ON dm_pinned_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM dm_messages m 
        JOIN dm_conversations c ON m.conversation_id = c.id
        WHERE m.id = dm_pinned_messages.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

CREATE POLICY "Participants can unpin"
ON dm_pinned_messages FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM dm_messages m 
        JOIN dm_conversations c ON m.conversation_id = c.id
        WHERE m.id = dm_pinned_messages.message_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
);

-- Rooms: Everyone can view, Members can pin (Simplified to authenticated for now)
ALTER TABLE room_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone view room pins" ON room_pinned_messages FOR SELECT USING (true);
CREATE POLICY "Auth users pin room messages" ON room_pinned_messages FOR INSERT WITH CHECK (auth.uid() = pinned_by);
CREATE POLICY "Auth users unpin room messages" ON room_pinned_messages FOR DELETE USING (true); -- Allow unpinning by anyone (or restrict to admins later)
