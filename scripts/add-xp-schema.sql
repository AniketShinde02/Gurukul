-- Add XP columns to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Create XP Logs table to track history
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for xp_logs
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp logs"
ON xp_logs FOR SELECT
USING (user_id = auth.uid());
