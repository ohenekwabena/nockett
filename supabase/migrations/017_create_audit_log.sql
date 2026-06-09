-- 017_create_audit_log.sql
--
-- Audit Log foundation (AUDIT-1). Implements docs/adr/0004-audit-log-via-db-triggers.md:
-- Audit Events are written by a SECURITY DEFINER trigger inside the same
-- transaction as the change they record, never by the TypeScript data seam.
-- The actor is resolved server-side from auth.uid() (the JWT 'sub'), so a client
-- cannot forge, skip, or omit a row. The table is append-only and tamper-proof
-- from the app: clients get an admin-only SELECT and no write at all (RLS with
-- no write policy + write grants revoked).
--
-- This migration wires capture for `tickets` only -- the irreducible end-to-end
-- slice. AUDIT-2 attaches the SAME audit_row() function to the other business
-- tables with one CREATE TRIGGER line each.
--
-- Reuses public.is_admin() (migration 014) for the read policy.

-- ---------------------------------------------------------------------------
-- Table: append-only record of who-did-what.
--   id          surrogate identity PK
--   txid        groups the burst of rows from one transaction (cascade deletes)
--   entity_type the audited table name (TG_TABLE_NAME)
--   entity_id   the row's id AS TEXT, so one generic trigger covers any PK type
--   action      insert | update | delete (derived from TG_OP)
--   actor_*     snapshot of the acting User; nullable because pre-auth paths
--               (consume_invite), seeds, and migrations have no auth.uid()
--   changes     insert/delete -> full row; update -> {col:{old,new}} diff
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  txid        bigint not null default txid_current(),
  entity_type text,
  entity_id   text,
  action      text check (action in ('insert', 'update', 'delete')),
  actor_id    uuid,
  actor_email text,
  actor_name  text,
  changes     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Keyset paging (newest-first) and entity drill-down (AUDIT-4).
create index if not exists audit_log_created_at_id_desc_idx
  on public.audit_log (created_at desc, id desc);
create index if not exists audit_log_entity_idx
  on public.audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- RLS: admins may read; nobody may write through the API.
--
-- No INSERT/UPDATE/DELETE policy exists, so those are denied for every
-- non-owner role (deny-by-default). We additionally revoke the write grants
-- (defense in depth: "clients are granted no write" -- ADR-0004). Rows are
-- written only by audit_row() below, which runs as the table owner and so
-- bypasses RLS.
--
-- NB: do NOT `force row level security` here -- forcing would subject the
-- SECURITY DEFINER trigger (which runs as the owner) to RLS and block the
-- insert. Owner-bypasses-RLS is exactly what lets the trigger write while the
-- app cannot.
-- ---------------------------------------------------------------------------
alter table public.audit_log enable row level security;

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

drop policy if exists "Admins can read the audit log" on public.audit_log;
create policy "Admins can read the audit log"
  on public.audit_log for select
  using (auth.role() = 'authenticated' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Generic capture trigger. One function, attached to many tables.
--   * SECURITY DEFINER so it can insert into audit_log despite the app having
--     no write grant, and so auth.uid() is resolved server-side from the JWT.
--   * set search_path = public pins name resolution (injection-safe); anything
--     outside public (auth.uid) is schema-qualified.
--   * entity_id uses (NEW|OLD).id::text -- every audited table has an id column.
-- ---------------------------------------------------------------------------
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action    text;
  v_actor_id  uuid := auth.uid();
  v_email     text;
  v_name      text;
  v_old       jsonb;
  v_new       jsonb;
  v_changes   jsonb;
  v_entity_id text;
begin
  v_action := lower(tg_op);

  if tg_op = 'INSERT' then
    v_changes   := to_jsonb(new);
    v_entity_id := new.id::text;
  elsif tg_op = 'DELETE' then
    v_changes   := to_jsonb(old);
    v_entity_id := old.id::text;
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    -- changed-columns diff: {col: {old, new}} for every column that differs
    select coalesce(
             jsonb_object_agg(key, jsonb_build_object('old', v_old -> key, 'new', v_new -> key)),
             '{}'::jsonb)
      into v_changes
      from jsonb_object_keys(v_new) as cols(key)
     where (v_new -> key) is distinct from (v_old -> key);
    v_entity_id := new.id::text;
  end if;

  -- Snapshot the actor so the log stays legible after the User is deleted.
  if v_actor_id is not null then
    select u.email, u.name
      into v_email, v_name
      from public.users u
     where u.id = v_actor_id;
  end if;

  insert into public.audit_log (entity_type, entity_id, action, actor_id, actor_email, actor_name, changes)
  values (tg_table_name, v_entity_id, v_action, v_actor_id, v_email, v_name, v_changes);

  return null; -- AFTER trigger: return value is ignored
end;
$$;

revoke all on function public.audit_row() from public;

-- ---------------------------------------------------------------------------
-- Wire capture for tickets only (this slice). AUDIT-2 adds the rest.
-- ---------------------------------------------------------------------------
drop trigger if exists audit_tickets on public.tickets;
create trigger audit_tickets
  after insert or update or delete on public.tickets
  for each row execute function public.audit_row();
