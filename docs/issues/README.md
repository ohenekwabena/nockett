# Issues — Admin-only Audit Log

Local backlog for the app-wide **Audit Log** feature. These are tracer-bullet vertical slices: each cuts through every layer (schema → trigger → read seam → UI → tests) and is demoable on its own.

Design of record:
- `CONTEXT.md` — **Audit Event** / **Audit Log** glossary terms
- `docs/adr/0004-audit-log-via-db-triggers.md` — why capture is by DB trigger, not the data seam

## Epic

**Admin-only app-wide Audit Log** — a tamper-proof, append-only record of who-did-what across the app, readable only by Admins, surfaced on a dedicated `/audit` page.

## Slices

| ID | Summary | HITL/AFK | Blocked by | Labels | Pts | Status |
|----|---------|----------|-----------|--------|-----|--------|
| [AUDIT-1](audit-1-foundation.md) | Foundation — capture Ticket changes, view on admin-only `/audit` | **HITL** | — | backend, database, frontend, security | 8 | Done |
| [AUDIT-2](audit-2-broaden-capture.md) | Extend capture to all business tables + cascade txid grouping | AFK | AUDIT-1 | backend, database, frontend | 5 | In progress |
| [AUDIT-3](audit-3-core-filters.md) | Core filters (date, actor, entity type, action) | AFK | AUDIT-1 | frontend, backend | 3 | Todo |
| [AUDIT-4](audit-4-entity-drill-down.md) | Entity drill-down — full trail for one entity | AFK | AUDIT-1 | frontend, backend | 2 | Todo |
| [AUDIT-5](audit-5-full-text-search.md) | Full-text search over Audit Event payloads | AFK | AUDIT-1 | backend, database, frontend | 3 | Todo |
| [AUDIT-6](audit-6-excel-export.md) | Excel export of the filtered Audit Log | AFK | AUDIT-3 | frontend | 2 | Todo |

## Dependency order

```
AUDIT-1 (foundation, HITL)
   ├── AUDIT-2  broaden capture
   ├── AUDIT-3  core filters ──── AUDIT-6  excel export
   ├── AUDIT-4  entity drill-down
   └── AUDIT-5  full-text search
```

Grab AUDIT-1 first; once it merges, 2–5 can be worked in parallel. AUDIT-6 follows AUDIT-3.

## Conventions

- **HITL** = needs human review/sign-off before merge (AUDIT-1 is security-sensitive: RLS, `SECURITY DEFINER`, immutability). **AFK** = implementable and mergeable without human interaction.
- Status values: `Todo` → `In progress` → `Done`. Update the row above when you pick one up.
- Verify with `npx tsc --noEmit` (project lint is broken at config-load).
- These can be pushed to the NOC Jira project later via `/to-issues` if desired.
