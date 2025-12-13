-- Create table for message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_room ON message_read_receipts(room_id);

-- Enable RLS
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view read receipts in their rooms
CREATE POLICY "Read receipts visible to room members"
ON message_read_receipts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_id = message_read_receipts.room_id
        AND user_id = auth.uid()
    )
);

-- Policy: Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON message_read_receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE message_read_receipts IS 'Tracks which messages have been read by which users';
