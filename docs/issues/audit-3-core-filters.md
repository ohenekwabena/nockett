# AUDIT-3 — Core filters: date, actor, entity type, action

- **Type:** Story
- **Mode:** AFK
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** AUDIT-1
- **Labels:** frontend, backend
- **Points:** 3

## What to build

Let an **Admin** narrow the **Audit Log** by the dimensions that matter for an oversight task.

- **Read seam:** extend `audit-service.listEvents` to accept filters — date range (`created_at` from/to), `actor_id`, `entity_type`, `action` — composed so they remain keyset-pagination-compatible.
- **UI:** filter controls in `AuditLogView` (date pickers, actor select, entity-type select, action select) plus a reset; the active filters drive the query and pagination.

## Acceptance criteria

- [ ] Admin can filter by any combination of date range, actor, entity type, and action; results and pagination respect the active filters.
- [ ] No filters = the full log; clearing filters restores it.
- [ ] Newest-first ordering and keyset pagination still hold under every filter combination.
- [ ] `npx tsc --noEmit` is clean; tests cover filter → query mapping.

## Notes

- AUDIT-6 (Excel export) depends on this so the export can honor the active filters.
- Actor select can reuse the users read already available to the app.
