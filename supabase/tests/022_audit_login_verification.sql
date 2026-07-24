-- 022_audit_login_verification.sql
--
-- Re-runnable verification for migration 022 (login capture, AUDIT-7). Proves the
-- one property that can only be shown against a real Postgres: an insert into
-- auth.sessions (what GoTrue does on sign-in) produces exactly one 'login' Audit
-- Event, with the actor snapshotted from NEW.user_id and the ip / user_agent
-- carried in the payload.
--
-- SAFE: runs inside a transaction that is ROLLED BACK; the DO block raises on a
-- wrong result, so a clean run prints only a "... OK" NOTICE and leaves no trace.
-- Run it in the Supabase SQL editor or via psql.
--
-- Substitute a real user id (one that has a public.users profile, so the actor
-- snapshot is non-null). The default below is the Nockett admin used by the 017
-- test.
--   USER_ID = 423765bb-337a-40e2-8a12-f3ed71f4ff22

-- ===========================================================================
-- Trigger behaviour: a new session -> exactly one 'login' event, correct shape.
-- ===========================================================================
begin;

-- Stand in for GoTrue's session insert on a successful sign-in.
insert into auth.sessions (id, user_id, created_at, updated_at, ip, user_agent)
  values (
    '00000000-0000-0000-0000-00000000105e',
    '423765bb-337a-40e2-8a12-f3ed71f4ff22',
    now(), now(),
    '203.0.113.7'::inet,
    'Mozilla/5.0 (AUDIT-7 verify)'
  );

do $$
declare
  v_count   int;
  v_action  text;
  v_actor   uuid;
  v_email   text;
  v_changes jsonb;
begin
  select count(*), max(action), max(actor_id), max(actor_email), max(changes)
    into v_count, v_action, v_actor, v_email, v_changes
    from public.audit_log
   where entity_type = 'sessions'
     and entity_id = '00000000-0000-0000-0000-00000000105e';

  if v_count <> 1 then
    raise exception 'expected exactly 1 login event, got %', v_count;
  end if;
  if v_action <> 'login' then
    raise exception 'expected action=login, got %', v_action;
  end if;
  if v_actor <> '423765bb-337a-40e2-8a12-f3ed71f4ff22' then
    raise exception 'actor_id not resolved from NEW.user_id: %', v_actor;
  end if;
  if v_email is null then
    raise exception 'actor_email was not snapshotted from public.users';
  end if;
  if v_changes ->> 'ip' <> '203.0.113.7' then
    raise exception 'ip not captured in payload: %', v_changes;
  end if;
  if v_changes ->> 'user_agent' <> 'Mozilla/5.0 (AUDIT-7 verify)' then
    raise exception 'user_agent not captured in payload: %', v_changes;
  end if;

  raise notice 'LOGIN CAPTURE OK: 1 login event, actor snapshotted, payload = %', v_changes;
end $$;

rollback;
