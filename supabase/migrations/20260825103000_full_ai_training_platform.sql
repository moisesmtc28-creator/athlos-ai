-- Athlos AI v3: musculação estruturada, check-in, reagendamento e memória esportiva.

alter table public.training_sessions add column if not exists session_type text not null default 'bike';
alter table public.training_sessions add column if not exists original_scheduled_date date;
alter table public.training_sessions add column if not exists reschedule_reason text;
alter table public.training_sessions add column if not exists missed_reason text;

do $$ begin
  alter table public.training_sessions add constraint training_session_type_check
    check (session_type in ('bike','strength','recovery'));
exception when duplicate_object then null; end $$;

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.athlete_profiles(id) on delete cascade,
  checkin_date date not null,
  sleep_hours numeric,
  sleep_quality integer,
  fatigue integer,
  muscle_soreness integer,
  motivation integer,
  resting_heart_rate integer,
  body_weight numeric,
  notes text,
  readiness_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, checkin_date)
);

create table if not exists public.strength_workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.athlete_profiles(id) on delete cascade,
  training_session_id uuid not null unique references public.training_sessions(id) on delete cascade,
  workout_label text not null default 'Treino',
  focus text,
  status text not null default 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strength_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.strength_workouts(id) on delete cascade,
  exercise_name text not null,
  muscle_group text,
  exercise_order integer not null default 1,
  target_sets integer not null default 3,
  target_reps text not null default '10',
  target_load_kg numeric,
  rest_seconds integer not null default 90,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.strength_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.strength_exercises(id) on delete cascade,
  set_number integer not null,
  planned_reps integer,
  performed_reps integer,
  planned_load_kg numeric,
  performed_load_kg numeric,
  rpe numeric,
  rir numeric,
  completed boolean not null default false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exercise_id, set_number)
);

create table if not exists public.athlete_memory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.athlete_profiles(id) on delete cascade,
  memory_key text not null,
  memory_value text not null,
  confidence numeric not null default 0.7,
  source text not null default 'ai',
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, memory_key)
);

create index if not exists daily_checkins_profile_date_idx on public.daily_checkins(profile_id, checkin_date desc);
create index if not exists strength_workouts_profile_idx on public.strength_workouts(profile_id, created_at desc);
create index if not exists strength_exercises_workout_idx on public.strength_exercises(workout_id, exercise_order);
create index if not exists strength_sets_exercise_idx on public.strength_sets(exercise_id, set_number);
create index if not exists athlete_memory_profile_idx on public.athlete_memory(profile_id, updated_at desc);

alter table public.daily_checkins enable row level security;
alter table public.strength_workouts enable row level security;
alter table public.strength_exercises enable row level security;
alter table public.strength_sets enable row level security;
alter table public.athlete_memory enable row level security;

-- Check-ins
drop policy if exists "daily_checkins_all_own" on public.daily_checkins;
create policy "daily_checkins_all_own" on public.daily_checkins for all
using (exists (select 1 from public.athlete_profiles p where p.id = daily_checkins.profile_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.athlete_profiles p where p.id = daily_checkins.profile_id and p.user_id = auth.uid()));

-- Workouts
drop policy if exists "strength_workouts_all_own" on public.strength_workouts;
create policy "strength_workouts_all_own" on public.strength_workouts for all
using (exists (select 1 from public.athlete_profiles p where p.id = strength_workouts.profile_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.athlete_profiles p where p.id = strength_workouts.profile_id and p.user_id = auth.uid()));

-- Exercises
drop policy if exists "strength_exercises_all_own" on public.strength_exercises;
create policy "strength_exercises_all_own" on public.strength_exercises for all
using (exists (
  select 1 from public.strength_workouts w
  join public.athlete_profiles p on p.id = w.profile_id
  where w.id = strength_exercises.workout_id and p.user_id = auth.uid()
))
with check (exists (
  select 1 from public.strength_workouts w
  join public.athlete_profiles p on p.id = w.profile_id
  where w.id = strength_exercises.workout_id and p.user_id = auth.uid()
));

-- Sets
drop policy if exists "strength_sets_all_own" on public.strength_sets;
create policy "strength_sets_all_own" on public.strength_sets for all
using (exists (
  select 1 from public.strength_exercises e
  join public.strength_workouts w on w.id = e.workout_id
  join public.athlete_profiles p on p.id = w.profile_id
  where e.id = strength_sets.exercise_id and p.user_id = auth.uid()
))
with check (exists (
  select 1 from public.strength_exercises e
  join public.strength_workouts w on w.id = e.workout_id
  join public.athlete_profiles p on p.id = w.profile_id
  where e.id = strength_sets.exercise_id and p.user_id = auth.uid()
));

-- Memory
drop policy if exists "athlete_memory_all_own" on public.athlete_memory;
create policy "athlete_memory_all_own" on public.athlete_memory for all
using (exists (select 1 from public.athlete_profiles p where p.id = athlete_memory.profile_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.athlete_profiles p where p.id = athlete_memory.profile_id and p.user_id = auth.uid()));
