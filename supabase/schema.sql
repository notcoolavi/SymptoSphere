-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Saved checks: each row belongs to one user. Row Level Security stops anyone else reading it.
create table if not exists public.checks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  symptoms    text[] not null,
  top_results jsonb not null,          -- only name, score and confidence are stored
  note        text check (char_length(note) <= 1000),
  photo_path  text
);

alter table public.checks enable row level security;

create policy "own checks: read"   on public.checks for select using (auth.uid() = user_id);
create policy "own checks: insert" on public.checks for insert with check (auth.uid() = user_id);
create policy "own checks: delete" on public.checks for delete using (auth.uid() = user_id);

-- Private photo bucket. Files live in a folder named after the user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('symptom-photos', 'symptom-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "own photos: read"   on storage.objects for select
  using (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos: upload" on storage.objects for insert
  with check (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos: delete" on storage.objects for delete
  using (bucket_id = 'symptom-photos' and (storage.foldername(name))[1] = auth.uid()::text);
