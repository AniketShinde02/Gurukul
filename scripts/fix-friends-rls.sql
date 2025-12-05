-- Enable RLS
ALTER TABLE study_connections ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can view their own connections" ON study_connections;
DROP POLICY IF EXISTS "Users can create connections" ON study_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON study_connections;

-- Create unified view policy
CREATE POLICY "Users can view their own connections"
ON study_connections FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Create insert policy
CREATE POLICY "Users can create connections"
ON study_connections FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Create update policy (accept/reject)
CREATE POLICY "Users can update their own connections"
ON study_connections FOR UPDATE
USING (auth.uid() = receiver_id OR auth.uid() = requester_id);
