# AUDIT-1 — Audit Log foundation: capture Ticket changes, view on admin-only `/audit`

- **Type:** Story (tracer bullet)
- **Mode:** HITL — security-sensitive; the RLS posture, `SECURITY DEFINER` trigger, and immutability need a human review before merge
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** —
- **Labels:** backend, database, frontend, security
- **Points:** 8

## What to build

The irreducible end-to-end slice: a **Ticket** change anywhere in the app lands as an **Audit Event**, and an **Admin** can see it on a dedicated, access-controlled `/audit` page. This proves the whole pipeline (trigger → RLS → read seam → server-guarded page → nav) for one entity; later slices add breadth and page features.

- **Migration `017_create_audit_log.sql`:**
  - `audit_log` table: `id` (identity PK), `txid bigint not null default txid_current()`, `entity_type text`, `entity_id text`, `action text check (action in ('insert','update','delete'))`, `actor_id uuid` (nullable), `actor_email text`, `actor_name text`, `changes jsonb not null default '{}'`, `created_at timestamptz not null default now()`.
  - Indexes: `(created_at desc, id desc)` (keyset paging) and `(entity_type, entity_id)` (drill-down, used by AUDIT-4).
  - RLS: enable; **admin-only `SELECT`** via `public.is_admin()` (migration 014). **No** insert/update/delete policy — the table is append-only and unwritable from the app.
  - `public.audit_row()` — generic `SECURITY DEFINER` trigger fn (`set search_path = public`): derives `action` from `TG_OP`; builds `changes` (insert → `to_jsonb(NEW)`; delete → `to_jsonb(OLD)`; update → changed-columns diff `{col:{old,new}}`); sets `entity_type = TG_TABLE_NAME`, `entity_id = (NEW|OLD).id::text`; resolves the actor from `auth.uid()` and snapshots `actor_email`/`actor_name` from `public.users`; inserts the row.
  - `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH ROW` trigger on **`tickets` only**.
- **Regenerate** `src/types/database.types.ts` to include `audit_log`.
- **Read seam** `src/lib/audit-service.ts` (ADR-0002 style — returns unwrapped values, throws): `listEvents({ limit, cursor })`, newest-first, keyset over `(created_at, id)`. **Read-only** (no writes — see ADR-0004).
- **Page** `src/app/audit/page.tsx` — Server Component: read the session role, `redirect()` non-admins; SSR the first page; render a client `AuditLogView` with a minimal list (timestamp, actor, action, entity).
- **Nav** — make `src/components/layout/side-nav.tsx` role-aware (wire in `useAuth().isAdmin`) and add an Audit item shown only to Admins.

## Acceptance criteria

- [ ] Creating, updating, or deleting a **Ticket** inserts exactly one **Audit Event** with correct `action`, `entity_type='tickets'`, `entity_id` = ticket uuid, actor snapshot, and a changed-columns diff for updates.
- [ ] `audit_log` has RLS enabled: an Admin can `SELECT`; a non-admin gets zero rows; **no** client (admin or not) can `INSERT`/`UPDATE`/`DELETE` directly.
- [ ] `/audit` redirects non-admins away; Admins see Audit Events newest-first with working keyset pagination.
- [ ] The Audit nav item renders only for Admins.
- [ ] `npx tsc --noEmit` is clean; tests cover trigger behaviour (insert/update/delete diff + actor) and RLS (non-admin read denied, all direct writes denied).

## Notes

- Implements `docs/adr/0004-audit-log-via-db-triggers.md`. Reuses `public.is_admin()` from migration 014.
- `actor_id` is nullable by design (pre-auth `consume_invite`, seeds, migrations have no `auth.uid()`).
- `entity_id` is `text` so the one generic trigger covers tables regardless of PK type.
- Verify the Server Component + `redirect` API against the installed **Next 16.1.6** before coding (`AGENTS.md`); the in-repo docs path that `AGENTS.md` references does not exist in this version — read the installed package types/source.
