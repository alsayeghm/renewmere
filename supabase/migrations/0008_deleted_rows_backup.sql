-- Safety net against accidental data loss (e.g. a bad SQL Editor query, a
-- mistaken admin script, or a user-account cascade delete): every row
-- deleted from a customer data table is captured here first, in full, before
-- it disappears. Only the service role can read this table — it's for admin
-- recovery, not app use. Restore by re-inserting `row_data` into the
-- original table (see scripts/restore-deleted-row.js).
create table if not exists public.deleted_rows_backup (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id uuid not null,
  row_data jsonb not null,
  deleted_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists deleted_rows_backup_lookup_idx
  on public.deleted_rows_backup(table_name, row_id, deleted_at desc);

alter table public.deleted_rows_backup enable row level security;
-- No policies: RLS default-denies all access to anon/authenticated roles.
-- Only the service-role key (used by admin scripts) can read or write it.

create or replace function public.backup_deleted_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deleted_rows_backup (table_name, row_id, row_data)
  values (TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  return OLD;
end;
$$;

drop trigger if exists backup_before_delete on public.orders;
create trigger backup_before_delete
  before delete on public.orders
  for each row execute function public.backup_deleted_row();

drop trigger if exists backup_before_delete on public.checks;
create trigger backup_before_delete
  before delete on public.checks
  for each row execute function public.backup_deleted_row();

drop trigger if exists backup_before_delete on public.fix_requests;
create trigger backup_before_delete
  before delete on public.fix_requests
  for each row execute function public.backup_deleted_row();
