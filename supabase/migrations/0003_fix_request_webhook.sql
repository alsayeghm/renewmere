-- Notifies Renewmere by email the moment a customer requests help fixing a
-- compliance gap. Uses pg_net (enabled by default on Supabase) to call our
-- own API route, which sends the email via Resend.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_fix_request()
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
    url := 'https://renewmere.com/api/notify-fix-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'afb45edf0873e7050cf924feffdf28425df181a5026af49b'
    ),
    body := jsonb_build_object(
      'obligation_id', new.obligation_id,
      'obligation_title', new.obligation_title,
      'requester_email', requester_email,
      'check_id', new.check_id,
      'created_at', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists on_fix_request_created on public.fix_requests;

create trigger on_fix_request_created
  after insert on public.fix_requests
  for each row
  execute function public.notify_fix_request();
