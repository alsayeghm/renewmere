-- Fulfillment tracking, one row per obligation on an order. `orders.status`
-- tracks Stripe billing state (trialing/active/paid/canceled); this tracks
-- whether the actual compliance work has been delivered — a separate
-- lifecycle the app previously had no record of at all.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_key text not null,
  title text not null,
  module_name text not null,
  billing text not null,
  price_pence integer not null,
  fulfillment_status text not null default 'not_started',
  admin_notes text,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_status_idx on public.order_items(fulfillment_status);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
-- No insert/update policy for the authenticated role — only the service-role
-- admin client (webhook, checkout-session creation, admin tools) writes here.

-- Backfill from existing orders' jsonb item snapshots.
insert into public.order_items (order_id, item_key, title, module_name, billing, price_pence)
select o.id, item->>'key', item->>'title', item->>'moduleName', item->>'billing', (item->>'pricePence')::integer
from public.orders o, jsonb_array_elements(o.items) as item
where not exists (select 1 from public.order_items oi where oi.order_id = o.id);

drop trigger if exists backup_before_delete on public.order_items;
create trigger backup_before_delete
  before delete on public.order_items
  for each row execute function public.backup_deleted_row();
