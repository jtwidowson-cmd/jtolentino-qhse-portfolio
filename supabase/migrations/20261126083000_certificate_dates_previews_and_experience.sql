-- Applied to the production Supabase project on 2026-11-26.
-- Add-only: fills empty fields with dates read from the professional certificates file, links the
-- watermarked/redacted certificate previews in /certs, and adds verified contributions (from the
-- projects table) to empty experience descriptions. Each update only touches rows where the field was null.
alter table public.certifications
  add column if not exists expiry_date text,
  add column if not exists preview_images text[];
-- Data updates (issue_date / expiry_date / preview_images for certification ids 20-42 and experience
-- descriptions for ids 1, 4, 5) were applied in the same migration; see the PR description for the values.
