-- Add channel_id to room_events (link event to a voice/video channel)
ALTER TABLE room_events 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES room_channels(id) ON DELETE SET NULL;

-- Create room_event_participants table to track attendance
CREATE TABLE IF NOT EXISTS room_event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES room_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_id, user_id)
);

-- RLS Policies for room_event_participants
ALTER TABLE room_event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event participants"
ON room_event_participants FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM room_events
        JOIN room_participants ON room_participants.room_id = room_events.room_id
        WHERE room_events.id = room_event_participants.event_id
        AND room_participants.user_id = auth.uid()
    )
);

CREATE POLICY "Users can join events"
ON room_event_participants FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM room_events
        JOIN room_participants ON room_participants.room_id = room_events.room_id
        WHERE room_events.id = room_event_participants.event_id
        AND room_participants.user_id = auth.uid()
    )
);

CREATE POLICY "Users can leave events"
ON room_event_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_events_channel_id ON room_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_room_event_participants_event_id ON room_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_room_event_participants_user_id ON room_event_participants(user_id);

-- Create a view for event status (upcoming/active/past)
CREATE OR REPLACE VIEW room_events_with_status AS
SELECT 
    e.*,
    CASE 
        WHEN e.start_time > NOW() THEN 'upcoming'
        WHEN e.start_time <= NOW() AND (e.end_time IS NULL OR e.end_time > NOW()) THEN 'active'
        ELSE 'past'
    END as status,
    COUNT(DISTINCT p.user_id) as participant_count
FROM room_events e
LEFT JOIN room_event_participants p ON p.event_id = e.id AND p.left_at IS NULL
GROUP BY e.id;
