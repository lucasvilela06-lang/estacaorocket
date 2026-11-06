-- EXECUTE NO SQL EDITOR DO PROJETO SUPABASE
create table if not exists public.coloring_artworks (
  id uuid primary key,
  title text not null,
  description text,
  age_groups text[] not null default '{}',
  difficulty text not null default 'medium',
  category text not null default 'ESPAÇO',
  file_path text not null unique,
  width integer not null default 1024,
  height integer not null default 1024,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.coloring_artworks enable row level security;
drop policy if exists "Public can read published coloring artworks" on public.coloring_artworks;
create policy "Public can read published coloring artworks"
  on public.coloring_artworks for select
  using (published = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rocket-coloring', 'rocket-coloring', true, 12582912, array['image/png'])
on conflict (id) do update set public = true, file_size_limit = 12582912,
  allowed_mime_types = array['image/png'];
