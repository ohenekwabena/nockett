# AUDIT-4 — Entity drill-down: full trail for one entity

- **Type:** Story
- **Mode:** AFK
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** AUDIT-1
- **Labels:** frontend, backend
- **Points:** 2

## What to build

Let an **Admin** see the complete chronological **Audit** trail for a single entity — e.g. everything that ever happened to one **Ticket**.

- **Read seam:** `audit-service.getEventsForEntity(entityType, entityId)`, served by the `(entity_type, entity_id)` index from AUDIT-1.
- **UI:** from any Audit Event row, a "view this entity's trail" affordance; plus a lookup input where an Admin can enter a **Ticket Number** (resolved to its uuid) and see that Ticket's trail.

## Acceptance criteria

- [ ] From any Audit Event row, an Admin can open that entity's full chronological trail.
- [ ] An Admin can look up an entity by **Ticket Number** (resolved to its uuid) and see its trail.
- [ ] The query is served by the `(entity_type, entity_id)` index (no sequential scan) — confirm via `explain`.
- [ ] `npx tsc --noEmit` is clean; tests cover `getEventsForEntity` and the Ticket Number → uuid resolution.

## Notes

- `entity_id` is stored as the entity uuid (as text). The **Ticket Number** (`Ticket#YYYYMMDD###`) is a separate human identifier (ADR-0003) — resolve it to the uuid before querying.
- Small slice; could be folded into AUDIT-3 if you prefer one combined filtering story.
