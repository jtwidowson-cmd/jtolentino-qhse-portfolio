-- Applied to the production Supabase project on 2026-11-16.
-- Least-privilege grants, server-side validation and anti-spam limits for the contact form.

-- 1. Least privilege for the public (anon) and authenticated roles.
--    Portfolio tables: read only. access_requests: insert of the four form fields only.
revoke all on table public.profile, public.skills, public.certifications, public.approvals,
  public.education, public.experience, public.projects, public.access_requests
  from anon, authenticated;
grant select on table public.profile, public.skills, public.certifications, public.approvals,
  public.education, public.experience, public.projects
  to anon, authenticated;
grant insert (name, email, company, message) on table public.access_requests to anon, authenticated;

-- 2. Server-side validation (the browser limits can be bypassed).
alter table public.access_requests
  add constraint access_requests_name_len    check (char_length(btrim(name)) between 1 and 200),
  add constraint access_requests_email_fmt   check (char_length(email) <= 320 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint access_requests_company_len check (char_length(btrim(company)) between 1 and 200),
  add constraint access_requests_message_len check (message is null or char_length(message) <= 2000);

create index if not exists access_requests_created_at_idx on public.access_requests (created_at);
create index if not exists access_requests_email_created_idx on public.access_requests (lower(email), created_at);

-- 3. Anti-spam guard: server sets status/created_at, and submissions are rate limited
--    (3 per email per hour, 20 in total per 10 minutes).
create or replace function public.access_requests_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.status := 'pending';
  new.created_at := now();
  new.honeypot := null;

  if (select count(*) from public.access_requests
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'RATE_LIMIT_EMAIL: Too many requests from this email. Please try again later.'
      using errcode = 'P0001';
  end if;

  if (select count(*) from public.access_requests
      where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'RATE_LIMIT_GLOBAL: The form is busy. Please try again in a few minutes.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.access_requests_guard() from public, anon, authenticated;

drop trigger if exists access_requests_guard on public.access_requests;
create trigger access_requests_guard
  before insert on public.access_requests
  for each row execute function public.access_requests_guard();
