-- 017_audit_log_verification.sql
--
-- Re-runnable verification for migration 017 (Audit Log foundation, AUDIT-1).
-- Covers the two properties that can only be proven against a real Postgres:
-- the capture trigger and the RLS posture. The TS read seam is covered
-- separately by src/lib/audit-service.test.ts (vitest).
--
-- SAFE: every block runs inside a transaction that is ROLLED BACK, and each
-- DO block raises on a wrong result, so a clean run prints only "... OK" NOTICEs
-- and leaves no trace. Run it in the Supabase SQL editor or via psql.
--
-- Substitute two real user ids for your environment. The defaults below are an
-- admin and a non-admin User in the Nockett project.
--   ADMIN_ID    = 423765bb-337a-40e2-8a12-f3ed71f4ff22
--   NONADMIN_ID = 1e70e8f1-a243-4e0d-9289-3d067d24cbf6

-- ===========================================================================
-- A. Trigger behaviour: insert/update/delete a Ticket as an authenticated admin
--    actor -> exactly one Audit Event each, correct shape, changed-columns diff.
-- ===========================================================================
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';

insert into public.tickets (id, title, status)
  values ('00000000-0000-0000-0000-0000000a1d17', 'AUDIT-1 verify', 'OPEN');
update public.tickets set status = 'CLOSED'
  where id = '00000000-0000-0000-0000-0000000a1d17';
delete from public.tickets
  where id = '00000000-0000-0000-0000-0000000a1d17';

reset role; -- back to the table owner to inspect every captured row

do $$
declare
  v_count   int;
  v_actions text;
  v_update  jsonb;
  v_actor   uuid;
  v_email   text;
begin
  select count(*),
         string_agg(action, ',' order by id),
         max(actor_id),
         max(actor_email)
    into v_count, v_actions, v_actor, v_email
    from public.audit_log
   where entity_id = '00000000-0000-0000-0000-0000000a1d17'
     and entity_type = 'tickets';

  if v_count <> 3 then
    raise exception 'expected exactly 3 events, got %', v_count;
  end if;
  if v_actions <> 'insert,update,delete' then
    raise exception 'expected insert,update,delete; got %', v_actions;
  end if;
  if v_actor <> '423765bb-337a-40e2-8a12-f3ed71f4ff22' then
    raise exception 'actor_id not resolved from auth.uid(): %', v_actor;
  end if;
  if v_email is null then
    raise exception 'actor_email was not snapshotted from public.users';
  end if;

  select changes into v_update
    from public.audit_log
   where entity_id = '00000000-0000-0000-0000-0000000a1d17' and action = 'update';
  -- jsonb equality ignores key order
  if v_update <> '{"status":{"old":"OPEN","new":"CLOSED"}}'::jsonb then
    raise exception 'unexpected update diff: %', v_update;
  end if;

  raise notice 'A. TRIGGER OK: 3 events (insert,update,delete), actor snapshotted, update diff = %', v_update;
end $$;
rollback;

-- ===========================================================================
-- B. RLS reads: a non-admin sees ZERO rows; an admin sees the log.
-- ===========================================================================
begin;
insert into public.audit_log (entity_type, entity_id, action, changes)
  values ('tickets', 'rls-seed', 'insert', '{}'::jsonb);

set local role authenticated;

set local request.jwt.claims = '{"sub":"1e70e8f1-a243-4e0d-9289-3d067d24cbf6","role":"authenticated"}';
do $$
declare v_count int;
begin
  select count(*) into v_count from public.audit_log;
  if v_count <> 0 then
    raise exception 'non-admin must see 0 rows, saw %', v_count;
  end if;
  raise notice 'B1. RLS READ OK: non-admin sees 0 rows';
end $$;

set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';
do $$
declare v_count int;
begin
  select count(*) into v_count from public.audit_log;
  if v_count < 1 then
    raise exception 'admin must see the seeded row, saw %', v_count;
  end if;
  raise notice 'B2. RLS READ OK: admin sees % row(s)', v_count;
end $$;

reset role;
rollback;

-- ===========================================================================
-- C. No direct writes: insert/update/delete are denied even for an admin
--    (no write policy + write grants revoked). Each must raise 42501.
-- ===========================================================================
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';

do $$
begin
  begin
    insert into public.audit_log (entity_type, entity_id, action) values ('tickets', 'deny', 'insert');
    raise exception 'FAIL: direct INSERT was not denied';
  exception when insufficient_privilege then raise notice 'C1. WRITE DENIED OK: INSERT (42501)';
  end;

  begin
    update public.audit_log set action = 'update' where id = -1;
    raise exception 'FAIL: direct UPDATE was not denied';
  exception when insufficient_privilege then raise notice 'C2. WRITE DENIED OK: UPDATE (42501)';
  end;

  begin
    delete from public.audit_log where id = -1;
    raise exception 'FAIL: direct DELETE was not denied';
  exception when insufficient_privilege then raise notice 'C3. WRITE DENIED OK: DELETE (42501)';
  end;
end $$;

reset role;
rollback;
