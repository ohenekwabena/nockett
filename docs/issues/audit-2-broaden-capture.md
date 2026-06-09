# AUDIT-2 — Extend audit capture to all business tables + cascade txid grouping

- **Type:** Story
- **Mode:** AFK
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** AUDIT-1
- **Labels:** backend, database, frontend
- **Points:** 5

## What to build

Broaden coverage from Tickets to the whole app by attaching the **existing** generic `audit_row()` trigger to the remaining business tables, and make a cascade delete read as a single grouped entry in the UI.

- **Migration:** add `AFTER INSERT OR UPDATE OR DELETE` triggers (reusing `public.audit_row()`) to:
  - `ticket_comments`, `ticket_notes`, `ticket_attachments`
  - `users` (captures role changes), `invites`
  - all **Reference entity** tables: `assignee`, `ticket_categories`, `ticket_priorities`, `departments`, `demarcations`, `links`, `sites`, `service_types`, `detection_sources`, `traffic_impacts`
  - **Exclude** vestigial `roles` / `user_roles` (ADR-0001) and system `ticket_sla_timers`.
- **UI:** `AuditLogView` collapses consecutive Audit Events sharing a `txid` into one expandable group — e.g. "Alice deleted Ticket#20260609001 (+18 related rows)" — expanding reveals the child events.

## Acceptance criteria

- [ ] Each in-scope table fires an **Audit Event** on insert/update/delete with the correct `entity_type`.
- [ ] `roles`, `user_roles`, and `ticket_sla_timers` are **not** audited.
- [ ] A **User** role change records a diff `{role:{old,new}}` with an actor snapshot.
- [ ] Deleting a **Ticket** produces child Audit Events sharing the parent delete's `txid`; the page collapses them into one expandable group.
- [ ] `npx tsc --noEmit` is clean; tests cover a representative subset (e.g. a `users` role change and an `invites` insert) plus cascade `txid` grouping.

## Notes

- No new trigger function — this is `CREATE TRIGGER` per table plus a UI grouping change. See ADR-0004 (cascade decision: audit all, group by `txid`).
- Ticket deletion is Admin-only, so the cascade burst is bounded; "keep forever" retention stands.
