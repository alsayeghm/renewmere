-- Stores a customer's built-up service plan ("shopping cart") once they
-- confirm it — one-time fixes and/or ongoing/annual services, before real
-- Stripe billing is wired in. GoldenPass is notified by email immediately so
-- no lead goes cold waiting on manual follow-up.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_id uuid references public.checks(id) on delete set null,
  items jsonb not null,
  total_one_time_pence integer not null default 0,
  total_annual_pence integer not null default 0,
  total_recurring_pence integer not null default 0,
  status text not null default 'pending_setup',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);

alter table public.orders enable row level security;

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Notify Renewmere by email the moment a customer confirms a plan, same
-- pattern as notify_fix_request.
create or replace function public.notify_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_email text;
begin
  select email into requester_email from auth.users where id = new.user_id;

  perform net.http_post(
    url := 'https://renewmere.com/api/notify-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '4a22e1e8e6850b739e5e0e92ac834b718b27bbdc2f0b0bde'
    ),
    body := jsonb_build_object(
      'order_id', new.id,
      'items', new.items,
      'total_one_time_pence', new.total_one_time_pence,
      'total_annual_pence', new.total_annual_pence,
      'total_recurring_pence', new.total_recurring_pence,
      'requester_email', requester_email,
      'check_id', new.check_id,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists on_order_created on public.orders;

create trigger on_order_created
  after insert on public.orders
  for each row
  execute function public.notify_order();
