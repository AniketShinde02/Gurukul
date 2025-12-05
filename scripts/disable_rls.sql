-- Disable RLS for Whiteboard and Timers (Emergency Fix)
ALTER TABLE whiteboard_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_timers DISABLE ROW LEVEL SECURITY;
