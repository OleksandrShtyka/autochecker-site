-- Migration v3: Add TOTP two-factor authentication columns to users table
-- Run this against your existing Supabase database.

alter table public.users
  add column if not exists totp_secret text,
  add column if not exists totp_enabled boolean not null default false;
