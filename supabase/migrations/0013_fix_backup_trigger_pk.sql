-- backup_deleted_row() assumed every backed-up table has an `id` column.
-- customer_profiles uses `user_id` as its primary key, so deleting a row
-- there (including via an auth.users cascade delete) raised
-- "record OLD has no field id" and blocked the delete entirely. Fall back
-- to user_id when id isn't present.
create or replace function public.backup_deleted_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_id uuid;
begin
  v_row_id := coalesce((to_jsonb(OLD)->>'id')::uuid, (to_jsonb(OLD)->>'user_id')::uuid);
  insert into public.deleted_rows_backup (table_name, row_id, row_data)
  values (TG_TABLE_NAME, v_row_id, to_jsonb(OLD));
  return OLD;
end;
$$;
