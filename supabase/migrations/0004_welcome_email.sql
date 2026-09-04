-- Sends a welcome email the moment someone signs up.
create or replace function public.notify_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://renewmere.com/api/welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'afb45edf0873e7050cf924feffdf28425df181a5026af49b'
    ),
    body := jsonb_build_object(
      'email', new.email
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_welcome on auth.users;

create trigger on_auth_user_created_welcome
  after insert on auth.users
  for each row
  execute function public.notify_welcome_email();
