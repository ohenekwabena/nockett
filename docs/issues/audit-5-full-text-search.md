# AUDIT-5 — Full-text search over Audit Event payloads

- **Type:** Story
- **Mode:** AFK
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** AUDIT-1
- **Labels:** backend, database, frontend
- **Points:** 3

## What to build

Let an **Admin** search *within* the change payloads — e.g. "find every event where status was set to CLOSED" — not just filter by the structured dimensions.

- **Migration:** add a GIN index supporting search over `audit_log.changes` (jsonb). Decide and document the approach: `jsonb_path_ops` GIN for containment, and/or an expression index `to_tsvector('simple', changes::text)` for word search.
- **Read seam:** a search method on `audit-service` using the chosen operator (containment or `websearch_to_tsquery`), composable with AUDIT-3 filters.
- **UI:** a search box in `AuditLogView`.

## Acceptance criteria

- [ ] An Admin can search within change payloads and get matching Audit Events.
- [ ] Search combines with the AUDIT-3 filters (date/actor/entity/action).
- [ ] The query uses the GIN index (verify via `explain` — no sequential scan on a populated table).
- [ ] `npx tsc --noEmit` is clean; tests cover the search query path.

## Notes

- jsonb text search needs care — record the chosen operator class and query operator in the migration so it stays consistent.
- Keep `changes` shape stable (the `{col:{old,new}}` diff from AUDIT-1) so search behaves predictably.
