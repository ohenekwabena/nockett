-- 016_enable_rls_invites.sql
--
-- Part 2 of securing public.invites (see 015 for the SECURITY DEFINER functions).
--
-- DEPLOY ORDER: apply this ONLY AFTER the updated invite routes
-- (src/app/api/auth/invite/validate/route.ts) — which validate/consume via the
-- 015 RPCs instead of reading the table directly — are deployed. Applying it
-- before that deploy will break signup, because the old routes read the table as
-- anon and this migration blocks exactly that.
--
-- After this:
--   * anon/authenticated signup path  -> goes through validate_invite/consume_invite (015)
--   * creating/listing invites        -> admins only, directly on the table
--   * anon can no longer read tokens/emails or tamper with invites

alter table public.invites enable row level security;

drop policy if exists "Allow admins to read invites"   on public.invites;
drop policy if exists "Allow admins to insert invites"  on public.invites;
drop policy if exists "Allow admins to update invites"  on public.invites;
drop policy if exists "Allow admins to delete invites"  on public.invites;

-- Admin (users.role = 'admin') manages invites directly; everyone else uses the
-- SECURITY DEFINER functions for the pre-auth signup path. public.is_admin() is
-- defined in migration 014.
create policy "Allow admins to read invites"
  on public.invites for select
  using (auth.role() = 'authenticated' and public.is_admin());

create policy "Allow admins to insert invites"
  on public.invites for insert
  with check (auth.role() = 'authenticated' and public.is_admin());

create policy "Allow admins to update invites"
  on public.invites for update
  using (auth.role() = 'authenticated' and public.is_admin())
  with check (auth.role() = 'authenticated' and public.is_admin());

create policy "Allow admins to delete invites"
  on public.invites for delete
  using (auth.role() = 'authenticated' and public.is_admin());
