-- Create a new specific bucket for room assets if it doesn't exist
insert into storage.buckets (id, name, public)
values ('room-assets', 'room-assets', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "Authenticated users can upload room assets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'room-assets' );

-- Allow public access to view images
create policy "Public can view room assets"
on storage.objects for select
to public
using ( bucket_id = 'room-assets' );

-- Allow users to update their own uploads (optional, but good for changing icons)
create policy "Users can update own room assets"
on storage.objects for update
to authenticated
using ( bucket_id = 'room-assets' and auth.uid() = owner );

-- Allow users to delete their own uploads
create policy "Users can delete own room assets"
on storage.objects for delete
to authenticated
using ( bucket_id = 'room-assets' and auth.uid() = owner );
