-- 015_add_invite_security_definer_functions.sql
--
-- Part 1 of securing public.invites (see 016 for the RLS lockdown).
--
-- The signup flow validates and consumes an invite token BEFORE the user is
-- authenticated, so those calls run as the `anon` role. Once RLS is enabled on
-- invites (016), anon can no longer read or write the table directly. These two
-- SECURITY DEFINER functions are the narrow, safe replacement: a caller must
-- already hold the exact high-entropy token, and only the matched row's safe
-- fields are returned / its `used` flag is set. The invites table — including
-- every other token and email — stays unreadable to anon.
--
-- These are additive and safe to apply on their own: the table still has RLS off
-- at this point, so the currently-deployed routes keep working until the updated
-- routes (which call these functions) are deployed and 016 is applied.
--
-- Being SECURITY DEFINER + granted to anon, these will (intentionally) show up in
-- the "function executable by anon/authenticated" advisor — that is the whole
-- point of the pattern and is the safe alternative to exposing the table.

-- Validate an invite by token: returns the matched invite's safe fields, or no
-- rows if the token is unknown. Callers apply their own used/expiry checks.
create or replace function public.validate_invite(p_token text)
returns table (email text, role text, expires_at timestamptz, used boolean)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, i.role, i.expires_at, i.used
  from public.invites i
  where i.token = p_token;
$$;

revoke all on function public.validate_invite(text) from public;
grant execute on function public.validate_invite(text) to anon, authenticated;

-- Mark an invite consumed by token (no-op if the token is unknown).
create or replace function public.consume_invite(p_token text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.invites set used = true where token = p_token;
$$;

revoke all on function public.consume_invite(text) from public;
grant execute on function public.consume_invite(text) to anon, authenticated;
