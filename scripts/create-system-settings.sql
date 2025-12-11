-- Create system_settings table to control global app behavior
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Turn on RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to READ settings (public)
CREATE POLICY "Everyone can read system settings"
    ON public.system_settings FOR SELECT
    USING (true);

-- Allow only ADMINS to UPDATE settings
-- Note: You'll need to define who is an admin. 
-- For now, we'll allow authenticated users to update if they claim to be admin 
-- (You should replace this with a proper is_admin check function later)
CREATE POLICY "Admins can update system settings"
    ON public.system_settings FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default matchmaking setting
INSERT INTO public.system_settings (key, value)
VALUES 
    ('matchmaking_config', '{"mode": "supabase", "ws_url": "ws://localhost:8080"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT UPDATE ON public.system_settings TO authenticated;
