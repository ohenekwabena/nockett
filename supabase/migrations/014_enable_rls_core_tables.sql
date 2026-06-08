-- 014_enable_rls_core_tables.sql
--
-- Enable Row Level Security and add policies on the core application tables that
-- were left fully exposed to the anon/authenticated roles (Supabase advisory:
-- "rls_disabled"). Before this, anyone holding the project anon key could read
-- or modify every row in these tables.
--
-- Posture mirrors the existing reference-entity tables (002-007) and
-- ticket_attachments (012): any authenticated user may use the app; per-user
-- owned rows (notes, comments) and destructive ticket/user actions are scoped to
-- the owner or an admin. "admin" is users.role = 'admin' (ADR-0001).
--
-- NOTE: public.invites is intentionally NOT handled here. Its signup-time
-- validate/consume runs pre-authentication (anon), so locking it down requires a
-- SECURITY DEFINER path plus a coordinated deploy of the invite route changes.
-- That lives in a separate migration (015) shipped together with those routes.

-- Admin-check helper. SECURITY DEFINER so a policy can ask "is the caller an
-- admin?" by reading public.users without that read being subject to (and
-- recursing through) users' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and lower(coalesce(u.role, '')) = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- tickets: read/insert/update for any authenticated user; delete admins only.
-- (Replaces the prior dormant "read for all users" / "insert for authenticated"
-- policies, and closes the anon read hole.)
-- ---------------------------------------------------------------------------
alter table public.tickets enable row level security;

drop policy if exists "Enable read access for all users" on public.tickets;
drop policy if exists "Enable insert for authenticated users only" on public.tickets;
drop policy if exists "Allow authenticated users to read tickets" on public.tickets;
drop policy if exists "Allow authenticated users to insert tickets" on public.tickets;
drop policy if exists "Allow authenticated users to update tickets" on public.tickets;
drop policy if exists "Allow admins to delete tickets" on public.tickets;

create policy "Allow authenticated users to read tickets"
  on public.tickets for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert tickets"
  on public.tickets for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update tickets"
  on public.tickets for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Allow admins to delete tickets"
  on public.tickets for delete
  using (auth.role() = 'authenticated' and public.is_admin());

-- ---------------------------------------------------------------------------
-- users: everyone authenticated can read (names/avatars/joins); a user may
-- insert only their own profile row (id = auth.uid(), which the signup flow
-- satisfies since email confirmation is off and a session exists at insert);
-- update self or (admin) anyone; delete admins only.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "Allow authenticated users to read users" on public.users;
drop policy if exists "Allow users to insert their own profile" on public.users;
drop policy if exists "Allow self or admins to update users" on public.users;
drop policy if exists "Allow admins to delete users" on public.users;

create policy "Allow authenticated users to read users"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "Allow users to insert their own profile"
  on public.users for insert
  with check (auth.role() = 'authenticated' and id = auth.uid());

create policy "Allow self or admins to update users"
  on public.users for update
  using (auth.role() = 'authenticated' and (id = auth.uid() or public.is_admin()))
  with check (auth.role() = 'authenticated' and (id = auth.uid() or public.is_admin()));

create policy "Allow admins to delete users"
  on public.users for delete
  using (auth.role() = 'authenticated' and public.is_admin());

-- ---------------------------------------------------------------------------
-- ticket_notes & ticket_comments: read for any authenticated user; insert your
-- own (user_id = auth.uid() or null); update/delete owner or admin. Mirrors the
-- ticket_attachments ownership model (012).
-- ---------------------------------------------------------------------------
alter table public.ticket_notes enable row level security;

drop policy if exists "Allow authenticated users to read ticket_notes" on public.ticket_notes;
drop policy if exists "Allow authenticated users to insert own ticket_notes" on public.ticket_notes;
drop policy if exists "Allow owners or admins to update ticket_notes" on public.ticket_notes;
drop policy if exists "Allow owners or admins to delete ticket_notes" on public.ticket_notes;

create policy "Allow authenticated users to read ticket_notes"
  on public.ticket_notes for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert own ticket_notes"
  on public.ticket_notes for insert
  with check (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()));

create policy "Allow owners or admins to update ticket_notes"
  on public.ticket_notes for update
  using (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()))
  with check (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()));

create policy "Allow owners or admins to delete ticket_notes"
  on public.ticket_notes for delete
  using (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()));

alter table public.ticket_comments enable row level security;

drop policy if exists "Allow authenticated users to read ticket_comments" on public.ticket_comments;
drop policy if exists "Allow authenticated users to insert own ticket_comments" on public.ticket_comments;
drop policy if exists "Allow owners or admins to update ticket_comments" on public.ticket_comments;
drop policy if exists "Allow owners or admins to delete ticket_comments" on public.ticket_comments;

create policy "Allow authenticated users to read ticket_comments"
  on public.ticket_comments for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert own ticket_comments"
  on public.ticket_comments for insert
  with check (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()));

create policy "Allow owners or admins to update ticket_comments"
  on public.ticket_comments for update
  using (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()))
  with check (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()));

create policy "Allow owners or admins to delete ticket_comments"
  on public.ticket_comments for delete
  using (auth.role() = 'authenticated' and (user_id = auth.uid() or public.is_admin()));

-- ---------------------------------------------------------------------------
-- ticket_history: append-only audit. Authenticated users may read and insert;
-- no update/delete policy (immutable). FK cascade from a ticket delete is a
-- system action and is not subject to these policies.
-- ---------------------------------------------------------------------------
alter table public.ticket_history enable row level security;

drop policy if exists "Allow authenticated users to read ticket_history" on public.ticket_history;
drop policy if exists "Allow authenticated users to insert ticket_history" on public.ticket_history;

create policy "Allow authenticated users to read ticket_history"
  on public.ticket_history for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert ticket_history"
  on public.ticket_history for insert
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Reference & internal tables that follow the house pattern (002-007): any
-- authenticated user may read and write. One FOR ALL policy per table.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tbls text[] := array[
    'assignee',
    'ticket_categories',
    'ticket_priorities',
    'departments',
    'roles',
    'user_roles',
    'knowledge_base',
    'ticket_sla_timers'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "Allow authenticated full access" on public.%I;', t);
    execute format(
      'create policy "Allow authenticated full access" on public.%I '
      || 'for all using (auth.role() = ''authenticated'') '
      || 'with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;
