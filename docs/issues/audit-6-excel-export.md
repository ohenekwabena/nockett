# AUDIT-6 — Excel export of the filtered Audit Log

- **Type:** Story
- **Mode:** AFK
- **Epic:** Admin-only app-wide Audit Log
- **Blocked by:** AUDIT-3
- **Labels:** frontend
- **Points:** 2

## What to build

Let an **Admin** export the current filtered **Audit Log** view to an Excel (`.xlsx`) file for off-platform review or retention.

- **Export helper:** `exportAuditEventsToExcel(events, filename)` mirroring the existing `ExportService` (`src/lib/export-service.ts`) — reuse its `setupHeaders`, `autoFitColumns`, and client-side `downloadWorkbook` (Blob) pattern with `exceljs` (already a dependency).
- **UI:** an Export button in `AuditLogView` that exports the **currently filtered** events (hence the AUDIT-3 dependency).

## Acceptance criteria

- [ ] An Admin can export the current filtered Audit Log to `.xlsx` via the existing `ExportService` download pattern.
- [ ] Exported columns: timestamp, actor (email + name), action, entity type, entity id, and a readable change summary.
- [ ] The export reflects the active filters (and search, if AUDIT-5 is merged).
- [ ] `npx tsc --noEmit` is clean; a basic test covers the row transform.

## Notes

- Do not add a new spreadsheet dependency — `exceljs` and the `ExportService` pattern already exist.
- Export operates on the filtered result set in the client; for very large exports, consider a future server-side streaming export (out of scope here).
