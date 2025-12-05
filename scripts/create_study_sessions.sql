-- Create a table to track study sessions for the dashboard
create table if not exists study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  room_id uuid, -- optional, if we want to track which room they studied in
  duration_seconds int not null,
  started_at timestamptz default now(),
  completed_at timestamptz default now(),
  type text check (type in ('work', 'short_break', 'long_break', 'custom'))
);

-- Enable RLS
alter table study_sessions enable row level security;

-- Allow users to insert their own sessions
create policy "Users can insert their own study sessions"
  on study_sessions for insert
  with check (auth.uid() = user_id);

-- Allow users to view their own sessions
create policy "Users can view their own study sessions"
  on study_sessions for select
  using (auth.uid() = user_id);
