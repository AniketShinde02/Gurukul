-- Fix RLS Policies for Matching System

-- 1. Waiting Queue
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can join queue" ON waiting_queue;
CREATE POLICY "Users can join queue" 
ON waiting_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave queue" ON waiting_queue;
CREATE POLICY "Users can leave queue" 
ON waiting_queue FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view queue" ON waiting_queue;
CREATE POLICY "Users can view queue" 
ON waiting_queue FOR SELECT 
USING (true);

-- 2. Chat Sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their sessions" ON chat_sessions;
CREATE POLICY "Users can view their sessions" 
ON chat_sessions FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create sessions" ON chat_sessions;
CREATE POLICY "Users can create sessions" 
ON chat_sessions FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update their sessions" ON chat_sessions;
CREATE POLICY "Users can update their sessions" 
ON chat_sessions FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their sessions" ON messages;
CREATE POLICY "Users can view messages in their sessions" 
ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE id = messages.session_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages to their sessions" ON messages;
CREATE POLICY "Users can send messages to their sessions" 
ON messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE id = messages.session_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- 4. Grant permissions to authenticated users
GRANT ALL ON waiting_queue TO authenticated;
GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON messages TO authenticated;
