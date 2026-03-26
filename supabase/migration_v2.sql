-- Migration v2: Add avatar and OAuth provider columns to users table
-- Run this against your existing Supabase database.

alter table public.users
  add column if not exists avatar_url text,
  add column if not exists google_id text unique,
  add column if not exists google_email text,
  add column if not exists github_id text unique,
  add column if not exists github_username text;

-- Storage: create the avatars bucket (run in Supabase Dashboard > Storage, or via CLI)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
