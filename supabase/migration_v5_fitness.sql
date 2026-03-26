-- ============================================================
-- Migration v5 — Fitness Module
-- Tables: supplements, gym_sessions, fitness_profile
-- RLS, indexes, triggers, RPC functions
-- ============================================================


-- ── 0. Ensure set_updated_at() exists ──────────────────────
-- Already defined in schema.sql; recreated here so this
-- migration can run standalone without errors.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. fitness_profile ──────────────────────────────────────
-- One row per user. Stores global fitness settings like
-- monthly gym membership cost (needed for ROI calculation).

create table if not exists public.fitness_profile (
  user_id            text primary key references public.users(id) on delete cascade,
  monthly_gym_cost   numeric(10,2) not null default 0,
  fitness_goal       text not null default 'general'
                       check (fitness_goal in ('strength','hypertrophy','endurance','general')),
  fitness_badge      text not null default 'Beginner',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);


-- ── 2. supplements ──────────────────────────────────────────
-- Each row is one container/bag of a supplement.
-- Depletion is calculated from purchase_date + usage rate —
-- no need to manually update remaining weight.

create table if not exists public.supplements (
  id                    text primary key,
  user_id               text not null references public.users(id) on delete cascade,
  name                  text not null,                        -- "Whey Protein", "Creatine", ...
  total_weight_g        numeric(10,2) not null,               -- total grams when full
  serving_size_g        numeric(10,2) not null,               -- grams per serving
  servings_per_day      numeric(5,2) not null default 1,      -- how many servings daily
  price                 numeric(10,2) not null default 0,     -- purchase price
  purchase_date         date not null default current_date,   -- when opened / bought
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint supplements_total_weight_pos  check (total_weight_g  > 0),
  constraint supplements_serving_size_pos  check (serving_size_g  > 0),
  constraint supplements_spd_pos           check (servings_per_day > 0),
  constraint supplements_price_nn          check (price           >= 0)
);


-- ── 3. gym_sessions ─────────────────────────────────────────
-- One row per workout. `exercises` stores the full lift list
-- as JSONB so we can add sets/reps/weight without extra tables.
-- Schema for each exercise object:
--   { "name": "Bench Press", "sets": 4, "reps": 8, "weight_kg": 80 }

create table if not exists public.gym_sessions (
  id            text primary key,
  user_id       text not null references public.users(id) on delete cascade,
  date          date not null default current_date,
  duration_min  integer not null default 60,                  -- session length in minutes
  workout_type  text not null default 'full_body'
                  check (workout_type in
                    ('push','pull','legs','upper','lower','full_body','cardio','other')),
  volume_kg     numeric(10,2) not null default 0,             -- total tonnage
  exercises     jsonb not null default '[]'::jsonb,           -- array of exercise objects
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint gym_sessions_duration_pos check (duration_min > 0),
  constraint gym_sessions_volume_nn    check (volume_kg   >= 0)
);


-- ── Indexes ─────────────────────────────────────────────────

create index if not exists idx_supplements_user
  on public.supplements(user_id);

create index if not exists idx_supplements_user_purchase
  on public.supplements(user_id, purchase_date desc);

create index if not exists idx_gym_sessions_user_date
  on public.gym_sessions(user_id, date desc);

create index if not exists idx_gym_sessions_type
  on public.gym_sessions(user_id, workout_type);


-- ── updated_at triggers ─────────────────────────────────────

create or replace trigger set_fitness_profile_updated_at
  before update on public.fitness_profile
  for each row execute function public.set_updated_at();

create or replace trigger set_supplements_updated_at
  before update on public.supplements
  for each row execute function public.set_updated_at();

create or replace trigger set_gym_sessions_updated_at
  before update on public.gym_sessions
  for each row execute function public.set_updated_at();


-- ── Row Level Security ──────────────────────────────────────

alter table public.fitness_profile enable row level security;
alter table public.supplements      enable row level security;
alter table public.gym_sessions     enable row level security;

-- fitness_profile: owner only
drop policy if exists "fitness_profile_owner_all" on public.fitness_profile;
create policy "fitness_profile_owner_all"
  on public.fitness_profile for all
  using (auth.uid()::text = user_id);

-- supplements: owner only
drop policy if exists "supplements_owner_all" on public.supplements;
create policy "supplements_owner_all"
  on public.supplements for all
  using (auth.uid()::text = user_id);

-- gym_sessions: owner only
drop policy if exists "gym_sessions_owner_all" on public.gym_sessions;
create policy "gym_sessions_owner_all"
  on public.gym_sessions for all
  using (auth.uid()::text = user_id);


-- ── RPC: supplement_status ──────────────────────────────────
-- Returns remaining_pct, remaining_g, days_left, depletion_date
-- for a single supplement row.
-- All calculations are purely arithmetic — no external data needed.

create or replace function public.supplement_status(p_id text)
returns table (
  remaining_pct   numeric,   -- 0..100
  remaining_g     numeric,
  days_left       integer,
  depletion_date  date,
  cost_per_serving numeric
)
language sql stable as $$
  select
    greatest(0,
      round(
        100 - (
          (current_date - s.purchase_date) *
          s.servings_per_day * s.serving_size_g
        ) / s.total_weight_g * 100
      , 1)
    )                                                                   as remaining_pct,

    greatest(0,
      s.total_weight_g -
      (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
    )                                                                   as remaining_g,

    greatest(0,
      floor(
        (
          s.total_weight_g -
          (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
        ) / (s.serving_size_g * s.servings_per_day)
      )
    )::integer                                                          as days_left,

    current_date + greatest(0,
      floor(
        (
          s.total_weight_g -
          (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
        ) / (s.serving_size_g * s.servings_per_day)
      )
    )::integer                                                          as depletion_date,

    round(
      s.price / (s.total_weight_g / s.serving_size_g)
    , 2)                                                                as cost_per_serving

  from public.supplements s
  where s.id = p_id;
$$;


-- ── RPC: gym_roi ─────────────────────────────────────────────
-- Returns sessions_count and cost_per_session for a given month.
-- p_month: any date inside the target month, e.g. '2025-01-01'

create or replace function public.gym_roi(p_user_id text, p_month date)
returns table (
  sessions_count   integer,
  monthly_cost     numeric,
  cost_per_session numeric
)
language sql stable as $$
  select
    count(gs.id)::integer                                         as sessions_count,
    fp.monthly_gym_cost                                           as monthly_cost,
    case
      when count(gs.id) = 0 then fp.monthly_gym_cost
      else round(fp.monthly_gym_cost / count(gs.id), 2)
    end                                                           as cost_per_session
  from public.fitness_profile fp
  left join public.gym_sessions gs
    on  gs.user_id = fp.user_id
    and date_trunc('month', gs.date) = date_trunc('month', p_month)
  where fp.user_id = p_user_id
  group by fp.monthly_gym_cost;
$$;


-- ── RPC: supplement_statuses (bulk) ─────────────────────────
-- Returns status for ALL supplements of a user at once.
-- Used by the inventory dashboard to avoid N+1 calls.

create or replace function public.supplement_statuses(p_user_id text)
returns table (
  id               text,
  name             text,
  remaining_pct    numeric,
  remaining_g      numeric,
  days_left        integer,
  depletion_date   date,
  cost_per_serving numeric
)
language sql stable as $$
  select
    s.id,
    s.name,
    greatest(0,
      round(
        100 - (
          (current_date - s.purchase_date) *
          s.servings_per_day * s.serving_size_g
        ) / s.total_weight_g * 100
      , 1)
    )                                                                  as remaining_pct,
    greatest(0,
      s.total_weight_g -
      (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
    )                                                                  as remaining_g,
    greatest(0,
      floor(
        (
          s.total_weight_g -
          (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
        ) / (s.serving_size_g * s.servings_per_day)
      )
    )::integer                                                         as days_left,
    current_date + greatest(0,
      floor(
        (
          s.total_weight_g -
          (current_date - s.purchase_date) * s.servings_per_day * s.serving_size_g
        ) / (s.serving_size_g * s.servings_per_day)
      )
    )::integer                                                         as depletion_date,
    round(s.price / (s.total_weight_g / s.serving_size_g), 2)         as cost_per_serving
  from public.supplements s
  where s.user_id = p_user_id
  order by s.purchase_date desc;
$$;
