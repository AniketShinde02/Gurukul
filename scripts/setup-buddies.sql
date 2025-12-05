-- 1. Create study_connections table
CREATE TABLE IF NOT EXISTS study_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_connections_requester ON study_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_study_connections_receiver ON study_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_study_connections_status ON study_connections(status);

-- RLS
ALTER TABLE study_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their connections" ON study_connections;
CREATE POLICY "Users can view their connections" ON study_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert connection requests" ON study_connections;
CREATE POLICY "Users can insert connection requests" ON study_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update their connections" ON study_connections;
CREATE POLICY "Users can update their connections" ON study_connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 2. Update waiting_queue
ALTER TABLE waiting_queue ADD COLUMN IF NOT EXISTS match_mode TEXT DEFAULT 'buddies_first' CHECK (match_mode IN ('buddies_first', 'global'));
