create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  auth_role text not null check (auth_role in ('USER', 'ADMIN')),
  usage text not null,
  favorite_feature text not null,
  job_role text not null,
  avatar_url text,
  google_id text unique,
  google_email text,
  github_id text unique,
  github_username text,
  totp_secret text,
  totp_enabled boolean not null default false,
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
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read"
  on public.users for select
  using (auth.uid()::text = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update"
  on public.users for update
  using (auth.uid()::text = id);

-- Suggestions: users manage their own; admins see all.
drop policy if exists "suggestions_owner_all" on public.suggestions;
create policy "suggestions_owner_all"
  on public.suggestions for all
  using (auth.uid()::text = user_id);


-- ── Fitness Module ───────────────────────────────────────────

create table if not exists public.fitness_profile (
  user_id            text primary key references public.users(id) on delete cascade,
  monthly_gym_cost   numeric(10,2) not null default 0,
  fitness_goal       text not null default 'general'
                       check (fitness_goal in ('strength','hypertrophy','endurance','general')),
  fitness_badge      text not null default 'Beginner',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.supplements (
  id                text primary key,
  user_id           text not null references public.users(id) on delete cascade,
  name              text not null,
  total_weight_g    numeric(10,2) not null,
  serving_size_g    numeric(10,2) not null,
  servings_per_day  numeric(5,2) not null default 1,
  price             numeric(10,2) not null default 0,
  purchase_date     date not null default current_date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint supplements_total_weight_pos  check (total_weight_g  > 0),
  constraint supplements_serving_size_pos  check (serving_size_g  > 0),
  constraint supplements_spd_pos           check (servings_per_day > 0),
  constraint supplements_price_nn          check (price           >= 0)
);

create table if not exists public.gym_sessions (
  id            text primary key,
  user_id       text not null references public.users(id) on delete cascade,
  date          date not null default current_date,
  duration_min  integer not null default 60,
  workout_type  text not null default 'full_body'
                  check (workout_type in
                    ('push','pull','legs','upper','lower','full_body','cardio','other')),
  volume_kg     numeric(10,2) not null default 0,
  exercises     jsonb not null default '[]'::jsonb,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint gym_sessions_duration_pos check (duration_min > 0),
  constraint gym_sessions_volume_nn    check (volume_kg   >= 0)
);

create index if not exists idx_supplements_user          on public.supplements(user_id);
create index if not exists idx_supplements_user_purchase on public.supplements(user_id, purchase_date desc);
create index if not exists idx_gym_sessions_user_date    on public.gym_sessions(user_id, date desc);
create index if not exists idx_gym_sessions_type         on public.gym_sessions(user_id, workout_type);

create or replace trigger set_fitness_profile_updated_at
  before update on public.fitness_profile
  for each row execute function public.set_updated_at();

create or replace trigger set_supplements_updated_at
  before update on public.supplements
  for each row execute function public.set_updated_at();

create or replace trigger set_gym_sessions_updated_at
  before update on public.gym_sessions
  for each row execute function public.set_updated_at();

alter table public.fitness_profile enable row level security;
alter table public.supplements      enable row level security;
alter table public.gym_sessions     enable row level security;

drop policy if exists "fitness_profile_owner_all" on public.fitness_profile;
create policy "fitness_profile_owner_all"
  on public.fitness_profile for all using (auth.uid()::text = user_id);

drop policy if exists "supplements_owner_all" on public.supplements;
create policy "supplements_owner_all"
  on public.supplements for all using (auth.uid()::text = user_id);

drop policy if exists "gym_sessions_owner_all" on public.gym_sessions;
create policy "gym_sessions_owner_all"
  on public.gym_sessions for all using (auth.uid()::text = user_id);
