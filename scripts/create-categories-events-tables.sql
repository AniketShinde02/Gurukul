-- Create room_categories table for organizing channels
CREATE TABLE IF NOT EXISTS room_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    UNIQUE(room_id, name)
);

-- Create room_events table for scheduled events
CREATE TABLE IF NOT EXISTS room_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT, -- Can be a channel ID or external link
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT, -- For future: RRULE format
    max_participants INTEGER,
    cover_image_url TEXT
);

-- Add category_id to room_channels (optional, for organizing channels)
ALTER TABLE room_channels 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES room_categories(id) ON DELETE SET NULL;

-- Add description to room_channels
ALTER TABLE room_channels 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add is_private to room_channels
ALTER TABLE room_channels 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- RLS Policies for room_categories
ALTER TABLE room_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their rooms"
ON room_categories FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_participants.room_id = room_categories.room_id
        AND room_participants.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can create categories"
ON room_categories FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_categories.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

CREATE POLICY "Admins can update categories"
ON room_categories FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_categories.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

CREATE POLICY "Admins can delete categories"
ON room_categories FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_categories.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

-- RLS Policies for room_events
ALTER TABLE room_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their rooms"
ON room_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM room_participants
        WHERE room_participants.room_id = room_events.room_id
        AND room_participants.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can create events"
ON room_events FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_events.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

CREATE POLICY "Admins can update events"
ON room_events FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_events.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

CREATE POLICY "Admins can delete events"
ON room_events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM study_rooms
        WHERE study_rooms.id = room_events.room_id
        AND study_rooms.created_by = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_categories_room_id ON room_categories(room_id);
CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_room_events_start_time ON room_events(start_time);
CREATE INDEX IF NOT EXISTS idx_room_channels_category_id ON room_channels(category_id);
