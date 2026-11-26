-- The owner prefers email-only handling: remove the private dashboard's database access.
-- The empty private-cv bucket keeps no access policies (unreachable through the API); delete it from the
-- Storage dashboard if wanted (direct SQL deletion of storage buckets is blocked by Supabase).
-- Recruitment fields, validation, rate limiting and the email notification stay.
drop policy if exists "admin read private-cv" on storage.objects;
drop policy if exists "admin upload private-cv" on storage.objects;
drop policy if exists "admin update private-cv" on storage.objects;
drop policy if exists "admin delete private-cv" on storage.objects;

drop policy if exists "admin read access_requests" on public.access_requests;
drop policy if exists "admin update access_requests status" on public.access_requests;
revoke select, update on table public.access_requests from authenticated;

drop table if exists public.admins;
drop function if exists private.is_admin();
drop schema if exists private;
