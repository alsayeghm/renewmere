-- Lets a customer give GoldenPass what's actually needed to do the work
-- (previously had to happen entirely over email). One free-text field plus
-- file uploads per obligation, visible to the admin fulfillment view.
alter table public.order_items
  add column if not exists customer_intake_text text,
  add column if not exists customer_intake_submitted_at timestamptz;

create table if not exists public.order_item_files (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists order_item_files_order_item_id_idx on public.order_item_files(order_item_id);

alter table public.order_item_files enable row level security;

create policy "Users can view their own order item files"
  on public.order_item_files for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_files.order_item_id and o.user_id = auth.uid()
    )
  );
-- No insert/update policy — uploads go through the server API route (service
-- role) after it verifies the requesting user owns the order item.

drop trigger if exists backup_before_delete on public.order_item_files;
create trigger backup_before_delete
  before delete on public.order_item_files
  for each row execute function public.backup_deleted_row();

-- Private storage bucket for the uploaded files. No storage.objects policies
-- are added — RLS defaults to deny-all for anon/authenticated, so files can
-- only be written/read via the service-role key in the API routes.
insert into storage.buckets (id, name, public)
values ('intake-files', 'intake-files', false)
on conflict (id) do nothing;
