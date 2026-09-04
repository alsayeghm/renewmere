-- One business profile per customer, captured once and reused across every
-- obligation — replaces asking the same business/site details on every
-- single item (the "essay per item" problem).
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  company_number text,
  site_address text,
  contact_phone text,
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

create policy "Users can view their own profile"
  on public.customer_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.customer_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.customer_profiles for update
  using (auth.uid() = user_id);

drop trigger if exists backup_before_delete on public.customer_profiles;
create trigger backup_before_delete
  before delete on public.customer_profiles
  for each row execute function public.backup_deleted_row();
