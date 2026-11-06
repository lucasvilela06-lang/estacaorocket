-- EXECUTE NO SQL EDITOR DO SUPABASE
alter table public.coloring_artworks
  add column if not exists builtin_key text,
  add column if not exists is_archived boolean not null default false;
alter table public.coloring_artworks alter column file_path drop not null;
create unique index if not exists coloring_artworks_builtin_key_uidx
  on public.coloring_artworks (builtin_key) where builtin_key is not null;
grant all on table public.coloring_artworks to service_role;
