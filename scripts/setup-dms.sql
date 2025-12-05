-- 1. Create dm_conversations table
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  UNIQUE(user1_id, user2_id)
);

-- 2. Create dm_messages table
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'system', 'image', 'file')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1 ON dm_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2 ON dm_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_updated ON dm_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created ON dm_messages(created_at);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "Users can view their conversations" ON dm_conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert conversations if connected" ON dm_conversations
  FOR INSERT WITH CHECK (
    (auth.uid() = user1_id OR auth.uid() = user2_id) AND
    EXISTS (
      SELECT 1 FROM study_connections
      WHERE (requester_id = user1_id AND receiver_id = user2_id AND status = 'accepted')
      OR (requester_id = user2_id AND receiver_id = user1_id AND status = 'accepted')
    )
  );

CREATE POLICY "Users can update their conversations" ON dm_conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations" ON dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = dm_messages.conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON dm_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages (read status)" ON dm_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_conversations;
