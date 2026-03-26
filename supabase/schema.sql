create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  auth_role text not null check (auth_role in ('USER', 'ADMIN')),
  usage text not null,
  favorite_feature text not null,
  job_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  area text not null,
  summary text not null,
  impact text not null,
  status text not null check (status in ('NEW', 'REVIEWING', 'PLANNED', 'SHIPPED', 'REJECTED')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
-- Note: idx_users_email is omitted — the unique constraint already creates one.
create index if not exists idx_suggestions_status on public.suggestions(status);
-- Composite index covers both user lookup and date ordering in one scan.
create index if not exists idx_suggestions_user_created on public.suggestions(user_id, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace trigger set_suggestions_updated_at
  before update on public.suggestions
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.users enable row level security;
alter table public.suggestions enable row level security;

-- Users: each user can read and update only their own row.
-- Service role key (used by the API) bypasses RLS entirely.
create policy if not exists "users_self_read"
  on public.users for select
  using (auth.uid()::text = id);

create policy if not exists "users_self_update"
  on public.users for update
  using (auth.uid()::text = id);

-- Suggestions: users manage their own; admins see all.
create policy if not exists "suggestions_owner_all"
  on public.suggestions for all
  using (auth.uid()::text = user_id);
