-- Admin-picked subset of source selfies to use as Nano Banana character
-- references. Empty array = fall back to the first 4 by alphabetical
-- filename order (the current default behaviour before this feature).
-- Storing full storage paths (not just filenames) so the pipeline can
-- feed them straight to supabaseAdmin.storage.download().
alter table dating_orders
  add column if not exists selected_ref_paths jsonb not null default '[]'::jsonb;
