-- Applied to the production Supabase project on 2026-11-26.
-- Add-only: recruitment details on enquiries, owner-only review access, private CV storage.
-- (The admin check was moved to private.is_admin() by the next migration.)

alter table public.access_requests
  add column if not exists job_title text,
  add column if not exists job_location text,
  add column if not exists enquiry_type text,
  add column if not exists job_description text;

alter table public.access_requests
  add constraint access_requests_job_title_len check (job_title is null or char_length(job_title) <= 200),
  add constraint access_requests_job_location_len check (job_location is null or char_length(job_location) <= 200),
  add constraint access_requests_enquiry_type_valid check (enquiry_type is null or enquiry_type in (
    'Employment Opportunity', 'Recruitment / Job Offer', 'Project Opportunity',
    'EPC / Contractor Enquiry', 'Professional Collaboration', 'Other')),
  add constraint access_requests_job_description_len check (job_description is null or char_length(job_description) <= 5000),
  add constraint access_requests_status_valid check (status in ('pending', 'reviewed', 'approved', 'declined'));

grant insert (job_title, job_location, enquiry_type, job_description) on table public.access_requests to anon, authenticated;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;

grant select on table public.access_requests to authenticated;
grant update (status) on table public.access_requests to authenticated;

-- Private CV storage: never public, no public URL; only the signed-in owner can read or replace it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-cv', 'private-cv', false, 10485760,
        array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false;
