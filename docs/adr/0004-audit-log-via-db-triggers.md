---
status: accepted
---

# The Audit Log is captured by database triggers, not the data-access seam

Audit Events are written by `SECURITY DEFINER` trigger functions on the audited tables, inside the same transaction as the change they record — not by the TypeScript data-access seam that performs every other write (ADR-0002). The trigger stamps the actor from `auth.uid()` (resolved by the database from the JWT), diffs `to_jsonb(OLD)` against `to_jsonb(NEW)`, and inserts into `audit_log`. Clients are granted no write on `audit_log` and only an admin `SELECT`; the table has no `UPDATE`/`DELETE` policy, so it is append-only and tamper-proof from the app.

The forcing constraint is that there is no service-role client — every client-side write is RLS-subject and runs as the acting User (see the Supabase auth/RLS model). An audit row written by that same client could be omitted, forged with another User's id, or left un-written when the mutation succeeds. An audit log the actor controls is not an audit log.

## Considered options

- **DB triggers (chosen)** — atomic with the change, actor resolved server-side, unskippable and immutable. Cost: capture logic lives in PL/pgSQL, away from the TS seam.
- **Client-side seam write (rejected)** — matches ADR-0002 and is easy to test, but spoofable, skippable, and non-atomic. Fails the one property an audit log exists to provide.
- **Hybrid: triggers + client-supplied context (rejected for v1)** — only warranted when capturing context the database cannot see (e.g. a human-entered reason). No such need yet; revisit if one appears.

## Consequences

- The data-access seam's audit role is **read-only**: an `audit-service` lists/filters/paginates Audit Events for the admin page, but never writes them. This is a deliberate, documented exception to ADR-0002's "the seam performs writes" expectation.
- One generic trigger function is attached to many tables (`tickets`, `ticket_comments`, `ticket_notes`, `ticket_attachments`, `users`, `invites`, and the reference entities); each new audited table is one `CREATE TRIGGER` line. It reuses `public.is_admin()` (migration 014) for the read policy.
- Cascade deletes (e.g. deleting a Ticket) produce a burst of child Audit Events sharing one `txid_current()`; the admin UI collapses them by that txid.
- The actor's identity (`actor_email`, `actor_name`) is snapshotted into each row so the log stays legible after a User is deleted; `actor_id` is nullable (pre-auth `consume_invite`, seeds, and migrations have no `auth.uid()`).
- Sign-ins **are** captured (AUDIT-7, migration 022), by the same mechanism: a `SECURITY DEFINER` trigger on `auth.sessions` writes one `login` Audit Event per session created. An earlier revision of this ADR declared auth-session events out of scope on the premise that triggers can't see the `auth` schema — that premise was wrong (a trigger on `auth.sessions` is the same pattern as the canonical `auth.users` trigger, and it writes to `public.audit_log` as the owner with no service role). The actor is resolved from `sessions.user_id` rather than `auth.uid()` (GoTrue performs the insert as `supabase_auth_admin`, with no end-user JWT in scope), and the capture is wrapped so it can never abort the sign-in transaction. **Logout stays out of scope**: sessions are also deleted by GoTrue's background expiry reaper (no actor, high volume), so a DELETE trigger would log system noise rather than user intent.
- Reversing this (moving capture into the app) means accepting a forgeable, skippable log — the cost we are explicitly refusing.
