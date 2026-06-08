---
status: accepted
---

# Authorization uses the users.role enum, not a roles/user_roles RBAC model

A User's access level is the `users.role` text column, constrained to `user | admin` by a DB CHECK constraint, and read through the `identity` module. The `roles` and `user_roles` tables (and their CRUD) are removed: they modelled a dynamic role-assignment system that nothing ever read for an access decision, while every real check keys off `users.role`.

## Considered options

- **users.role enum (chosen)** — two fixed access levels, enforced by the DB. Matches what the app actually enforces and reads; simplest to reason about.
- **roles + user_roles junction (rejected)** — dynamic, multi-role-per-user RBAC. Already half-built in the schema but wired to nothing; keeping it would mean migrating authorization onto it and maintaining a second source of truth.

## Consequences

- Re-introducing custom or multiple roles later means re-adding the junction and a real assignment flow — a deliberate cost we accept for current simplicity.
- The `roles` / `user_roles` tables are dropped via migration; `roles-card` / `roles-modal` are deleted, and `roles` is not treated as a reference entity.
