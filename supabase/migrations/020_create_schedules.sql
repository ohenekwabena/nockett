-- 020_create_schedules.sql
--
-- Schedule history. The rota page derives a whole month's schedule
-- deterministically from (year, month, seed) plus the admin's manual cell
-- edits, so a saved schedule is just that tuple -- no need to persist the
-- expanded grid. An admin explicitly "Saves to history"; each save is an
-- immutable point-in-time snapshot the team can reload later.
--
-- Posture mirrors migration 014: any authenticated user may READ saved rosters
-- (the schedules page is viewable by everyone, read-only for non-admins);
-- creating, relabelling, and deleting history entries is admin-only
-- (users.role = 'admin', via public.is_admin() from migration 014).

create table if not exists public.schedules (
  id         uuid primary key default gen_random_uuid(),
  year       integer not null,
  month      integer not null check (month between 1 and 12),
  -- PRNG seed fed to generateMonthSchedule(); regenerates the exact grid.
  seed       bigint not null,
  -- Manual cell edits layered on the generated grid: { "Person|YYYY-MM-DD": "D" | "N" | null }.
  overrides  jsonb not null default '{}'::jsonb,
  -- Optional admin-supplied name; the UI defaults it to the month label.
  label      text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- History listing: newest-first overall, and drill-down by month.
create index if not exists schedules_created_at_desc_idx
  on public.schedules (created_at desc);
create index if not exists schedules_year_month_idx
  on public.schedules (year desc, month desc, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: authenticated read; admin-only write. is_admin() is the SECURITY
-- DEFINER helper from migration 014.
-- ---------------------------------------------------------------------------
alter table public.schedules enable row level security;

drop policy if exists "Allow authenticated users to read schedules" on public.schedules;
drop policy if exists "Allow admins to insert schedules" on public.schedules;
drop policy if exists "Allow admins to update schedules" on public.schedules;
drop policy if exists "Allow admins to delete schedules" on public.schedules;

create policy "Allow authenticated users to read schedules"
  on public.schedules for select
  using (auth.role() = 'authenticated');

create policy "Allow admins to insert schedules"
  on public.schedules for insert
  with check (auth.role() = 'authenticated' and public.is_admin());

create policy "Allow admins to update schedules"
  on public.schedules for update
  using (auth.role() = 'authenticated' and public.is_admin())
  with check (auth.role() = 'authenticated' and public.is_admin());

create policy "Allow admins to delete schedules"
  on public.schedules for delete
  using (auth.role() = 'authenticated' and public.is_admin());
