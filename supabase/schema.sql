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

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_suggestions_user_id on public.suggestions(user_id);
create index if not exists idx_suggestions_status on public.suggestions(status);
create index if not exists idx_suggestions_created_at on public.suggestions(created_at desc);
