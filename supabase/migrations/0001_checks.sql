-- Stores one row per completed compliance check, tied to the signed-in user.
create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null default 'simpler-recycling',
  answers jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists checks_user_id_idx on public.checks(user_id);

alter table public.checks enable row level security;

create policy "Users can insert their own checks"
  on public.checks for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own checks"
  on public.checks for select
  using (auth.uid() = user_id);
