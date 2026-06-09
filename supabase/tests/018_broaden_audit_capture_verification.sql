-- 018_broaden_audit_capture_verification.sql
--
-- Re-runnable verification for migration 018 (AUDIT-2, broaden audit capture).
-- Proves the properties that only a real Postgres can show: the generic
-- audit_row() trigger now fires for the newly-wired tables with the right
-- entity_type / diff, and a Ticket cascade delete produces a child Audit Event
-- burst that shares ONE txid. The UI's same-txid collapse is covered separately
-- by src/components/audit/audit-log-view.test.ts (vitest).
--
-- SAFE: every block runs inside a transaction that is ROLLED BACK, and each DO
-- block raises on a wrong result, so a clean run prints only "... OK" NOTICEs and
-- leaves no trace. Run it in the Supabase SQL editor or via psql.
--
-- These blocks write as the table OWNER (no `set local role authenticated`) but
-- still set request.jwt.claims, so auth.uid() resolves the actor for the
-- snapshot while the writes stay free of each table's own RLS -- the property
-- under test is the trigger (entity_type, diff, txid, actor), which is
-- independent of the writer's role. The RLS posture of audit_log itself is
-- proven by 017_audit_log_verification.sql.
--   ADMIN_ID = 423765bb-337a-40e2-8a12-f3ed71f4ff22  (a real admin User)

-- ===========================================================================
-- A. users Role change -> one update Audit Event, entity_type 'users',
--    changes = {role:{old,new}}, actor snapshotted from auth.uid().
-- ===========================================================================
begin;
set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';

-- A self-contained throwaway User starting at role 'user' (default), so the diff
-- is deterministic regardless of seed data. The insert also logs an Audit Event;
-- we assert only on the update below.
insert into public.users (id, name, email)
  values ('aaaaaaaa-0000-0000-0000-000000000002', 'AUDIT-2 verify', 'audit2-verify@example.test');
update public.users set role = 'admin'
  where id = 'aaaaaaaa-0000-0000-0000-000000000002';

do $$
declare
  v_action text;
  v_diff   jsonb;
  v_actor  uuid;
  v_email  text;
begin
  select action, changes, actor_id, actor_email
    into v_action, v_diff, v_actor, v_email
    from public.audit_log
   where entity_type = 'users'
     and entity_id = 'aaaaaaaa-0000-0000-0000-000000000002'
     and action = 'update';

  if v_action is null then
    raise exception 'no update Audit Event captured for the users Role change';
  end if;
  -- jsonb equality ignores key order
  if v_diff <> '{"role":{"old":"user","new":"admin"}}'::jsonb then
    raise exception 'unexpected Role-change diff: %', v_diff;
  end if;
  if v_actor <> '423765bb-337a-40e2-8a12-f3ed71f4ff22' then
    raise exception 'actor_id not resolved from auth.uid(): %', v_actor;
  end if;
  if v_email is null then
    raise exception 'actor_email was not snapshotted from public.users';
  end if;

  raise notice 'A. users OK: Role change diff = %, actor snapshotted', v_diff;
end $$;
rollback;

-- ===========================================================================
-- B. invites insert -> one insert Audit Event, entity_type 'invites', the
--    changes payload is the full new row (to_jsonb(NEW)).
-- ===========================================================================
begin;
set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';

insert into public.invites (email, token, expires_at)
  values ('audit2-invitee@example.test', 'audit2-verify-token', now() + interval '7 days');

do $$
declare
  v_count int;
  v_diff  jsonb;
  v_actor uuid;
begin
  select count(*), max(changes), max(actor_id)
    into v_count, v_diff, v_actor
    from public.audit_log
   where entity_type = 'invites'
     and action = 'insert'
     and changes ->> 'token' = 'audit2-verify-token';

  if v_count <> 1 then
    raise exception 'expected exactly 1 invites insert event, got %', v_count;
  end if;
  if v_diff ->> 'email' <> 'audit2-invitee@example.test' then
    raise exception 'invites Audit Event did not capture the full row: %', v_diff;
  end if;
  if v_actor <> '423765bb-337a-40e2-8a12-f3ed71f4ff22' then
    raise exception 'actor_id not resolved from auth.uid(): %', v_actor;
  end if;

  raise notice 'B. invites OK: insert captured full row, entity_type=invites, actor snapshotted';
end $$;
rollback;

-- ===========================================================================
-- C. Ticket cascade delete -> the delete burst is exactly tickets +
--    ticket_comments + ticket_notes + ticket_attachments, all sharing ONE txid;
--    the unaudited cascade children (ticket_history, ticket_sla_timers) add
--    nothing. We isolate THIS test's burst with `txid = txid_current()` (stable
--    within the single transaction) and action = 'delete'.
-- ===========================================================================
begin;
set local request.jwt.claims = '{"sub":"423765bb-337a-40e2-8a12-f3ed71f4ff22","role":"authenticated"}';

insert into public.tickets (id, title, status)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'AUDIT-2 cascade', 'OPEN');
insert into public.ticket_comments (ticket_id, content)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'a comment');
insert into public.ticket_notes (ticket_id, content)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'a note');
insert into public.ticket_attachments (ticket_id, url, filename)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'path/to/file', 'file.pdf');
-- an UNAUDITED cascade child: it must stay silent in the burst below
insert into public.ticket_history (ticket_id, action)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'created');

delete from public.tickets where id = 'aaaaaaaa-0000-0000-0000-000000000001';

do $$
declare
  v_count    int;
  v_txids    int;
  v_entities text;
  v_unaudited int;
begin
  select count(*),
         count(distinct txid),
         string_agg(entity_type, ',' order by entity_type)
    into v_count, v_txids, v_entities
    from public.audit_log
   where action = 'delete' and txid = txid_current();

  if v_count <> 4 then
    raise exception 'expected 4 delete events (tickets+comments+notes+attachments), got %', v_count;
  end if;
  if v_txids <> 1 then
    raise exception 'the delete burst must share ONE txid, saw % distinct', v_txids;
  end if;
  if v_entities <> 'ticket_attachments,ticket_comments,ticket_notes,tickets' then
    raise exception 'unexpected delete entity set: %', v_entities;
  end if;

  select count(*) into v_unaudited
    from public.audit_log
   where action = 'delete' and txid = txid_current()
     and entity_type in ('ticket_history', 'ticket_sla_timers');
  if v_unaudited <> 0 then
    raise exception 'unaudited cascade children must produce no Audit Event, saw %', v_unaudited;
  end if;

  raise notice 'C. CASCADE OK: 4 delete events share 1 txid; unaudited children silent';
end $$;
rollback;
