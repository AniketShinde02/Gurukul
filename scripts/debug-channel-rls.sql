-- Debug: Allow all operations on room_channels for authenticated users
DROP POLICY IF EXISTS "Users can insert channels" ON room_channels;
DROP POLICY IF EXISTS "Users can update channels" ON room_channels;
DROP POLICY IF EXISTS "Users can delete channels" ON room_channels;

CREATE POLICY "Debug: Allow all insert" ON room_channels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Debug: Allow all update" ON room_channels FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Debug: Allow all delete" ON room_channels FOR DELETE USING (auth.role() = 'authenticated');
