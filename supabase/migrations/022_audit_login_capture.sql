-- 022_audit_login_capture.sql
--
-- AUDIT-7: capture sign-ins in the Audit Log.
--
-- Until now the log recorded only data mutations on public tables (017 tickets,
-- 018 the rest). ADR-0004 declared login/logout "out of scope" on the premise
-- that auth-schema events are invisible to triggers -- that premise is wrong. A
-- successful sign-in inserts exactly one row into `auth.sessions` (GoTrue), and a
-- trigger on that table sees it. So a login is captured the SAME way every other
-- Audit Event is: by a SECURITY DEFINER trigger inside the change's own
-- transaction, actor resolved server-side, unforgeable and unskippable from the
-- app. This keeps the whole log on one mechanism (ADR-0004) rather than adding a
-- client-driven auth-side write. ADR-0004 is amended to match.
--
-- Depends only on migration 017 (the audit_log table + append-only RLS). It does
-- NOT depend on 018-021.
--
-- Scope: LOGINS only. Logout is deliberately not captured -- sessions are also
-- deleted by GoTrue's background expiry reaper (no actor, high volume), so a
-- DELETE trigger would flood the log with system noise. Revisit separately if an
-- explicit sign-out event is wanted.

-- ---------------------------------------------------------------------------
-- 1. Allow the new action value.
--
-- 017 defined `action` with an inline single-column CHECK, which PostgreSQL
-- auto-names `audit_log_action_check`. Widen it to admit 'login' alongside the
-- three DML actions. Existing rows all satisfy the wider set, so this validates
-- without a rewrite.
-- ---------------------------------------------------------------------------
alter table public.audit_log drop constraint if exists audit_log_action_check;
alter table public.audit_log
  add constraint audit_log_action_check
  check (action in ('insert', 'update', 'delete', 'login'));

-- ---------------------------------------------------------------------------
-- 2. Capture function.
--
-- Unlike audit_row() (017) this resolves the actor from NEW.user_id, NOT
-- auth.uid(): the INSERT is performed by GoTrue as `supabase_auth_admin`, so
-- there is no end-user JWT in scope and auth.uid() would be NULL. NEW.user_id is
-- the authenticated user's id (== public.users.id), which we snapshot for a
-- legible actor and stash the sign-in context (ip, user_agent) in `changes`.
--
-- CRITICAL: the whole body is wrapped so it can NEVER abort the session insert.
-- This trigger runs inside GoTrue's login transaction; an unhandled exception
-- here would roll that back and break authentication for the entire app. The
-- inner block therefore catches everything and downgrades it to a WARNING -- a
-- missing audit row is acceptable, a broken login is not.
--
--   * SECURITY DEFINER so it writes audit_log (which the app cannot) as the
--     owner, bypassing the log's append-only RLS -- same posture as audit_row().
--   * set search_path = public pins name resolution; auth.* stays qualified.
--   * host(NEW.ip) yields the bare address text (host() is strict, so NULL ip ->
--     NULL -> stripped). jsonb_strip_nulls keeps the payload clean when GoTrue
--     recorded no ip/user_agent (e.g. a server-side session).
-- ---------------------------------------------------------------------------
create or replace function public.audit_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name  text;
begin
  begin
    select u.email, u.name
      into v_email, v_name
      from public.users u
     where u.id = new.user_id;

    insert into public.audit_log
      (entity_type, entity_id, action, actor_id, actor_email, actor_name, changes)
    values (
      'sessions',
      new.id::text,
      'login',
      new.user_id,
      v_email,
      v_name,
      jsonb_strip_nulls(jsonb_build_object(
        'ip',         host(new.ip),
        'user_agent', new.user_agent
      ))
    );
  exception when others then
    -- Never let audit capture break sign-in. Swallow and continue.
    raise warning 'audit_login: skipped audit for session % (user %): %',
      new.id, new.user_id, sqlerrm;
  end;

  return null; -- AFTER trigger: return value is ignored
end;
$$;

-- Mirror 017: no role needs EXECUTE to fire a trigger (PostgreSQL does not check
-- EXECUTE on trigger functions against the DML-performing role), so revoke the
-- default public grant as defence in depth.
revoke all on function public.audit_login() from public;

-- ---------------------------------------------------------------------------
-- 3. Wire capture: one row per sign-in.
--
-- A password / OAuth / magic-link sign-in, and the auto-session from signup or a
-- password-recovery link, each insert one auth.sessions row -> one 'login' event.
-- A token refresh does NOT insert a session (it rotates within the existing one),
-- so refreshes are not counted.
-- ---------------------------------------------------------------------------
drop trigger if exists audit_sessions_login on auth.sessions;
create trigger audit_sessions_login
  after insert on auth.sessions
  for each row execute function public.audit_login();
