-- Major sheet → prerequisite graph.
-- Per-user, RLS-protected. A student uploads a degree "major sheet" (any format),
-- an async job extracts it into structured courses + a flat prerequisite edge list.
--
-- Tables:
--   major_sheets  one row per uploaded sheet (status-tracked async parse job)
--   courses       one row per extracted course; prerequisites/corequisites hold
--                 the AND/OR groups (source of truth)
--   course_edges  flat edges DERIVED from the groups — for fast graph queries +
--                 client-side highlight traversal
--
-- Storage: a PRIVATE bucket `major-sheets`; objects live under `{auth.uid()}/...`
-- and RLS lets a user touch only their own prefix.

-- ---------------------------------------------------------------------------
-- major_sheets
-- ---------------------------------------------------------------------------
create table if not exists public.major_sheets (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title            text,
  program_name     text,
  total_credits    int,
  source_file_path text,                       -- storage key in the major-sheets bucket
  source_mime      text,
  status           text not null default 'pending'
                     check (status in ('pending', 'processing', 'ready', 'failed')),
  error            text,
  warnings         jsonb not null default '[]'::jsonb,
  raw_extraction   jsonb,                       -- full model output, kept for debug/re-render
  created_at       timestamptz not null default now()
);

create index if not exists major_sheets_user_idx on public.major_sheets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id                uuid primary key default gen_random_uuid(),
  sheet_id          uuid not null references public.major_sheets (id) on delete cascade,
  course_key        text not null,             -- the schema `id`, e.g. INFS221
  code              text,                       -- display form, e.g. "INFS 221"
  name              text,
  name_ar           text,
  credits           int,
  requirement_group text,
  standing          text,                       -- null | 'junior' | 'senior'
  is_external       boolean not null default false,
  prerequisites     jsonb not null default '[]'::jsonb,  -- AND/OR groups (source of truth)
  corequisites      jsonb not null default '[]'::jsonb,
  also_in           jsonb not null default '[]'::jsonb,
  needs_review      boolean not null default false,
  note              text,
  unique (sheet_id, course_key)
);

create index if not exists courses_sheet_idx on public.courses (sheet_id);

-- ---------------------------------------------------------------------------
-- course_edges (flat, derived from the groups)
-- ---------------------------------------------------------------------------
create table if not exists public.course_edges (
  id             uuid primary key default gen_random_uuid(),
  sheet_id       uuid not null references public.major_sheets (id) on delete cascade,
  source_key     text not null,                -- the prerequisite/corequisite
  target_key     text not null,                -- the course that depends on it
  kind           text not null check (kind in ('prerequisite', 'corequisite')),
  is_alternative boolean not null default false -- true when from a multi-option OR group
);

create index if not exists course_edges_target_idx on public.course_edges (sheet_id, target_key);
create index if not exists course_edges_source_idx on public.course_edges (sheet_id, source_key);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.major_sheets enable row level security;
alter table public.courses      enable row level security;
alter table public.course_edges enable row level security;

-- major_sheets: owner-only, all verbs.
drop policy if exists "major_sheets owner select" on public.major_sheets;
create policy "major_sheets owner select" on public.major_sheets
  for select using (user_id = auth.uid());
drop policy if exists "major_sheets owner insert" on public.major_sheets;
create policy "major_sheets owner insert" on public.major_sheets
  for insert with check (user_id = auth.uid());
drop policy if exists "major_sheets owner update" on public.major_sheets;
create policy "major_sheets owner update" on public.major_sheets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "major_sheets owner delete" on public.major_sheets;
create policy "major_sheets owner delete" on public.major_sheets
  for delete using (user_id = auth.uid());

-- Helper: does the caller own the sheet this row belongs to?
create or replace function public.owns_sheet(p_sheet_id uuid)
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 from public.major_sheets s
    where s.id = p_sheet_id and s.user_id = auth.uid()
  );
$$;

-- courses: every verb joins back to an owned major_sheets row.
drop policy if exists "courses owner select" on public.courses;
create policy "courses owner select" on public.courses
  for select using (public.owns_sheet(sheet_id));
drop policy if exists "courses owner insert" on public.courses;
create policy "courses owner insert" on public.courses
  for insert with check (public.owns_sheet(sheet_id));
drop policy if exists "courses owner update" on public.courses;
create policy "courses owner update" on public.courses
  for update using (public.owns_sheet(sheet_id)) with check (public.owns_sheet(sheet_id));
drop policy if exists "courses owner delete" on public.courses;
create policy "courses owner delete" on public.courses
  for delete using (public.owns_sheet(sheet_id));

-- course_edges: same ownership join.
drop policy if exists "course_edges owner select" on public.course_edges;
create policy "course_edges owner select" on public.course_edges
  for select using (public.owns_sheet(sheet_id));
drop policy if exists "course_edges owner insert" on public.course_edges;
create policy "course_edges owner insert" on public.course_edges
  for insert with check (public.owns_sheet(sheet_id));
drop policy if exists "course_edges owner update" on public.course_edges;
create policy "course_edges owner update" on public.course_edges
  for update using (public.owns_sheet(sheet_id)) with check (public.owns_sheet(sheet_id));
drop policy if exists "course_edges owner delete" on public.course_edges;
create policy "course_edges owner delete" on public.course_edges
  for delete using (public.owns_sheet(sheet_id));

-- ---------------------------------------------------------------------------
-- Storage: private `major-sheets` bucket, objects namespaced by auth.uid()
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('major-sheets', 'major-sheets', false)
on conflict (id) do nothing;

-- The first path segment must equal the caller's uid: `{auth.uid()}/{uuid}.{ext}`.
drop policy if exists "major-sheets read own" on storage.objects;
create policy "major-sheets read own" on storage.objects
  for select using (
    bucket_id = 'major-sheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "major-sheets insert own" on storage.objects;
create policy "major-sheets insert own" on storage.objects
  for insert with check (
    bucket_id = 'major-sheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "major-sheets update own" on storage.objects;
create policy "major-sheets update own" on storage.objects
  for update using (
    bucket_id = 'major-sheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "major-sheets delete own" on storage.objects;
create policy "major-sheets delete own" on storage.objects
  for delete using (
    bucket_id = 'major-sheets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
