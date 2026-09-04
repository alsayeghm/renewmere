-- Stores a lead when a user asks Renewmere to fix a specific compliance gap for them.
create table if not exists public.fix_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_id uuid references public.checks(id) on delete set null,
  obligation_id text not null,
  obligation_title text not null,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create index if not exists fix_requests_user_id_idx on public.fix_requests(user_id);

alter table public.fix_requests enable row level security;

create policy "Users can insert their own fix requests"
  on public.fix_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own fix requests"
  on public.fix_requests for select
  using (auth.uid() = user_id);
