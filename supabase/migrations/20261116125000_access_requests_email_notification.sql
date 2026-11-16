-- Applied to the production Supabase project on 2026-11-16.
-- Email notification for new contact-form requests.
-- After each insert the database calls the notify-access-request Edge Function with the row id only.
-- The function re-reads the row with the service role, checks it is recent and not yet notified,
-- claims it (notified_at) and sends the email, so the endpoint cannot be used to send arbitrary mail.
create extension if not exists pg_net with schema extensions;

alter table public.access_requests add column if not exists notified_at timestamptz;

create or replace function public.access_requests_notify()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  begin
    perform net.http_post(
      url := 'https://lpvqaelyddzuolpkokaq.supabase.co/functions/v1/notify-access-request',
      body := jsonb_build_object('id', new.id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 10000
    );
  exception when others then
    -- Never block a submission because the notification could not be queued.
    raise warning 'access_requests_notify: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke all on function public.access_requests_notify() from public, anon, authenticated;

drop trigger if exists access_requests_notify on public.access_requests;
create trigger access_requests_notify
  after insert on public.access_requests
  for each row execute function public.access_requests_notify();
