-- Applied to the production Supabase project on 2026-11-26.
-- Owner-only access policies; the admin check lives in a schema the public API does not expose.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create policy "admin read access_requests" on public.access_requests
  for select to authenticated using (private.is_admin());
create policy "admin update access_requests status" on public.access_requests
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "admin read private-cv" on storage.objects
  for select to authenticated using (bucket_id = 'private-cv' and private.is_admin());
create policy "admin upload private-cv" on storage.objects
  for insert to authenticated with check (bucket_id = 'private-cv' and private.is_admin());
create policy "admin update private-cv" on storage.objects
  for update to authenticated using (bucket_id = 'private-cv' and private.is_admin()) with check (bucket_id = 'private-cv' and private.is_admin());
create policy "admin delete private-cv" on storage.objects
  for delete to authenticated using (bucket_id = 'private-cv' and private.is_admin());

grant select on table public.admins to authenticated;
create policy "read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());
