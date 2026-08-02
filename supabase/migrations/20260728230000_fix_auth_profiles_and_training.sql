-- Athlos AI: estrutura mínima, relacionamentos e políticas RLS.
create extension if not exists pgcrypto;

create table if not exists public.athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  birth_date date,
  sex text,
  height_cm numeric,
  current_weight numeric,
  target_weight numeric,
  max_heart_rate integer,
  resting_heart_rate integer,
  ftp integer,
  cycling_level text default 'intermediate',
  preferred_bike text,
  terrain text,
  weekly_hours numeric,
  goal text,
  cycling_years integer,
  main_cycling_type text,
  training_frequency integer,
  longest_recent_ride_km numeric,
  average_speed_kmh numeric,
  has_heart_rate_monitor boolean not null default false,
  has_power_meter boolean not null default false,
  has_cadence_sensor boolean not null default false,
  has_speed_sensor boolean not null default false,
  has_indoor_trainer boolean not null default false,
  has_gps_computer boolean not null default false,
  does_strength_training boolean not null default false,
  strength_days_per_week integer,
  physical_limitations text,
  preferred_training_time text,
  available_days text[] not null default '{}',
  available_minutes_by_day jsonb not null default '{}'::jsonb,
  gym_days text[] not null default '{}',
  goal_details text,
  target_event_name text,
  target_event_date date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garante colunas também quando as tabelas já existiam antes desta migração.
alter table public.athlete_profiles add column if not exists full_name text;
alter table public.athlete_profiles add column if not exists birth_date date;
alter table public.athlete_profiles add column if not exists sex text;
alter table public.athlete_profiles add column if not exists height_cm numeric;
alter table public.athlete_profiles add column if not exists current_weight numeric;
alter table public.athlete_profiles add column if not exists target_weight numeric;
alter table public.athlete_profiles add column if not exists max_heart_rate integer;
alter table public.athlete_profiles add column if not exists resting_heart_rate integer;
alter table public.athlete_profiles add column if not exists ftp integer;
alter table public.athlete_profiles add column if not exists cycling_level text default 'intermediate';
alter table public.athlete_profiles add column if not exists preferred_bike text;
alter table public.athlete_profiles add column if not exists terrain text;
alter table public.athlete_profiles add column if not exists weekly_hours numeric;
alter table public.athlete_profiles add column if not exists goal text;
alter table public.athlete_profiles add column if not exists cycling_years integer;
alter table public.athlete_profiles add column if not exists main_cycling_type text;
alter table public.athlete_profiles add column if not exists training_frequency integer;
alter table public.athlete_profiles add column if not exists longest_recent_ride_km numeric;
alter table public.athlete_profiles add column if not exists average_speed_kmh numeric;
alter table public.athlete_profiles add column if not exists has_heart_rate_monitor boolean not null default false;
alter table public.athlete_profiles add column if not exists has_power_meter boolean not null default false;
alter table public.athlete_profiles add column if not exists has_cadence_sensor boolean not null default false;
alter table public.athlete_profiles add column if not exists has_speed_sensor boolean not null default false;
alter table public.athlete_profiles add column if not exists has_indoor_trainer boolean not null default false;
alter table public.athlete_profiles add column if not exists has_gps_computer boolean not null default false;
alter table public.athlete_profiles add column if not exists does_strength_training boolean not null default false;
alter table public.athlete_profiles add column if not exists strength_days_per_week integer;
alter table public.athlete_profiles add column if not exists physical_limitations text;
alter table public.athlete_profiles add column if not exists preferred_training_time text;
alter table public.athlete_profiles add column if not exists available_days text[] not null default '{}';
alter table public.athlete_profiles add column if not exists available_minutes_by_day jsonb not null default '{}'::jsonb;
alter table public.athlete_profiles add column if not exists gym_days text[] not null default '{}';
alter table public.athlete_profiles add column if not exists goal_details text;
alter table public.athlete_profiles add column if not exists target_event_name text;
alter table public.athlete_profiles add column if not exists target_event_date date;
alter table public.athlete_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.athlete_profiles add column if not exists created_at timestamptz not null default now();
alter table public.athlete_profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal text,
  weeks integer not null default 1,
  level text,
  status text not null default 'active',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, start_date, end_date)
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.athlete_profiles(id) on delete cascade,
  plan_id uuid references public.training_plans(id) on delete cascade,
  title text not null,
  description text,
  scheduled_date date not null,
  duration_minutes integer not null default 60,
  completed_duration_minutes integer,
  zone text not null default 'Z2',
  status text not null default 'planned',
  perceived_effort integer,
  athlete_feedback text,
  average_heart_rate integer,
  max_heart_rate integer,
  distance_km numeric,
  average_speed numeric,
  cadence integer,
  calories integer,
  elevation_gain integer,
  generated_by_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_zone_check check (zone in ('Z1','Z2','Z3','Z4','Z5','Z6')),
  constraint training_status_check check (status in ('planned','in_progress','completed','missed','cancelled'))
);

alter table public.training_sessions add column if not exists completed_duration_minutes integer;
alter table public.training_sessions add column if not exists perceived_effort integer;
alter table public.training_sessions add column if not exists athlete_feedback text;
alter table public.training_sessions add column if not exists average_heart_rate integer;
alter table public.training_sessions add column if not exists max_heart_rate integer;
alter table public.training_sessions add column if not exists distance_km numeric;
alter table public.training_sessions add column if not exists average_speed numeric;
alter table public.training_sessions add column if not exists cadence integer;
alter table public.training_sessions add column if not exists calories integer;
alter table public.training_sessions add column if not exists elevation_gain integer;
alter table public.training_sessions add column if not exists generated_by_ai boolean not null default false;
alter table public.training_sessions add column if not exists updated_at timestamptz not null default now();

create index if not exists training_sessions_profile_date_idx
  on public.training_sessions(profile_id, scheduled_date);
create index if not exists training_sessions_plan_idx
  on public.training_sessions(plan_id);

alter table public.athlete_profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;

drop policy if exists "athlete_profiles_select_own" on public.athlete_profiles;
create policy "athlete_profiles_select_own" on public.athlete_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "athlete_profiles_insert_own" on public.athlete_profiles;
create policy "athlete_profiles_insert_own" on public.athlete_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "athlete_profiles_update_own" on public.athlete_profiles;
create policy "athlete_profiles_update_own" on public.athlete_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "athlete_profiles_delete_own" on public.athlete_profiles;
create policy "athlete_profiles_delete_own" on public.athlete_profiles
  for delete using (auth.uid() = user_id);

drop policy if exists "training_plans_all_own" on public.training_plans;
create policy "training_plans_all_own" on public.training_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "training_sessions_select_own" on public.training_sessions;
create policy "training_sessions_select_own" on public.training_sessions
  for select using (
    exists (
      select 1 from public.athlete_profiles p
      where p.id = training_sessions.profile_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "training_sessions_insert_own" on public.training_sessions;
create policy "training_sessions_insert_own" on public.training_sessions
  for insert with check (
    exists (
      select 1 from public.athlete_profiles p
      where p.id = training_sessions.profile_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "training_sessions_update_own" on public.training_sessions;
create policy "training_sessions_update_own" on public.training_sessions
  for update using (
    exists (
      select 1 from public.athlete_profiles p
      where p.id = training_sessions.profile_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.athlete_profiles p
      where p.id = training_sessions.profile_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "training_sessions_delete_own" on public.training_sessions;
create policy "training_sessions_delete_own" on public.training_sessions
  for delete using (
    exists (
      select 1 from public.athlete_profiles p
      where p.id = training_sessions.profile_id and p.user_id = auth.uid()
    )
  );

-- Cria um perfil inicial assim que uma conta é criada.
create or replace function public.handle_new_athlos_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.athlete_profiles (user_id, full_name, onboarding_completed)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_athlos on auth.users;
create trigger on_auth_user_created_athlos
  after insert on auth.users
  for each row execute procedure public.handle_new_athlos_user();
