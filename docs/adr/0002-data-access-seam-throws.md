---
status: accepted
---

# The data-access seam returns unwrapped values and throws on error

Service methods (`ticket-service`, `identity`, …) return domain values directly — a `Ticket`, a `Demarcation[]` — and throw on a Postgres error, rather than handing callers Supabase's `{ data, error }` envelope. The seam also normalizes joined relations to plain fields internally, so a Ticket's priority/assignee is always a field, never `T | T[]`. This makes the interface deep: a caller gets the value or an exception, not the database's representation.

## Considered options

- **Throw + unwrapped (chosen)** — happy path reads linearly; errors surface via try/catch and Next.js error boundaries; matches the style the (now-removed) `user-service` already used.
- **Result<T> discriminated union (rejected)** — explicit and exception-free, but adds ceremony at ~20+ call sites and TypeScript won't force callers to check it.
- **Keep {data,error} (rejected)** — the status quo; every caller re-decides what an error means. That leak is exactly what we are removing.

## Consequences

- A reader expecting Supabase's native `{ data, error }` shape will be surprised — hence this record.
- Callers that genuinely want "continue on failure" (e.g. render an empty list) must catch locally and choose that explicitly, rather than it being the silent default.
