-- Turns each purchased obligation into a real checklist ("project") the
-- admin builds and updates as they do the work, instead of one flat status
-- plus an open-ended "tell us everything" box. Steps are admin-authored (the
-- person doing the compliance work knows the real steps for that obligation)
-- — the customer only ever sees a specific, targeted ask on the one step
-- that's actually waiting on them.
create table if not exists public.order_item_steps (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  description text,
  status text not null default 'not_started', -- not_started | in_progress | waiting_on_customer | done
  customer_prompt text, -- the specific ask shown to the customer when status = waiting_on_customer
  customer_response_text text,
  customer_response_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_item_steps_order_item_id_idx on public.order_item_steps(order_item_id);

alter table public.order_item_steps enable row level security;

create policy "Users can view steps on their own order items"
  on public.order_item_steps for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_steps.order_item_id and o.user_id = auth.uid()
    )
  );
-- No insert/update policy for the authenticated role — steps are authored by
-- admin and customer responses are written via the service-role API route
-- after it verifies ownership (same pattern as order_item_files).

drop trigger if exists backup_before_delete on public.order_item_steps;
create trigger backup_before_delete
  before delete on public.order_item_steps
  for each row execute function public.backup_deleted_row();

-- Let an uploaded file attach to a specific step instead of only the item as
-- a whole (nullable — existing item-level files stay valid).
alter table public.order_item_files
  add column if not exists step_id uuid references public.order_item_steps(id) on delete cascade;
