# PRD — Nockett (As-Built Functional Specification)

This PRD is retrospective: it records the functionality already implemented across the Nockett application, page by page, so the team has a single canonical description of the product as it exists today. It follows the project's domain language (Ticket Number, reference lists/entities, seams, Audit Log) and the decisions in the ADRs.

## Problem Statement

The NOC team at Afriwave Telecom handles network incidents across many sites, links, and providers. Before Nockett, incident intake, triage, escalation timing, root-cause capture, and post-incident reporting lived in spreadsheets and email threads. There was no single place to see open incidents, no consistent incident record (detection time, provider notification, downtime, RFO), no controlled vocabulary for sites/links/categories, no accountability trail for who changed what, and no controlled way to add teammates to the tool. Shift planning for the NOC roster was also done by hand, which made it easy to violate working-hour constraints.

## Solution

Nockett is an invite-only, role-aware ticket management web application for the NOC team. It provides a full ticket lifecycle (create → work → close) with telecom-specific incident fields, three ways to view the queue (grid, kanban, list), Excel import/export, email notifications with deep links back into the app, self-service management of all lookup vocabularies ("Entities"), an admin-only immutable Audit Log of every write in the system, and a constraint-respecting shift schedule generator for the NOC roster.

### Pages built

| Route | Page | Access |
|---|---|---|
| `/` | Landing splash with "Go to Dashboard" CTA | Authenticated (gated by middleware) |
| `/dashboard` | KPI overview + 5 most recent tickets | Authenticated |
| `/tickets` | Primary ticket workspace (grid / kanban / list, search, filters, import/export, deep links) | Authenticated |
| `/entities` | Reference-list management (10 lookup vocabularies) | Authenticated |
| `/schedules` | NOC shift rota generator and viewer | Authenticated (not linked in navigation) |
| `/audit` | Audit Log feed, filters, entity trails, export | Admin only |
| `/settings` | Settings hub; admin-only Invite User card | Authenticated |
| `/auth/login` | Email/password sign-in | Public |
| `/auth/signup` | Invite-gated account creation | Public (requires valid invite token) |
| `/auth/forgot-password` | Request password-reset email | Public |
| `/auth/reset-password` | Complete password reset from emailed link | Public (requires recovery session) |

### API routes built

| Route | Purpose |
|---|---|
| `POST /api/auth/invite` | Create an invite (token, 24h expiry, role) and email the signup link |
| `GET/PATCH /api/auth/invite/validate` | Validate an invite token pre-auth / mark it consumed |
| `POST /api/email/ticket` | Server-side email transport: renders a ticket email template and sends via Resend |

## User Stories

### Authentication & access
1. As an admin, I want to invite a teammate by email and choose their role (User or Admin), so that only vetted colleagues join the workspace with the right permissions.
2. As an admin, I want each invite to be a single-use, high-entropy token that expires after 24 hours, so that stale or leaked links cannot be abused.
3. As an invited teammate, I want to receive an email with my signup link, so that I can join without asking anyone for a URL.
4. As an invited teammate, I want my email pre-filled and locked on the signup form, so that my account matches the invitation.
5. As an invited teammate, I want a clear error when my invite link is missing, invalid, already used, or expired, so that I know to request a new one.
6. As a new user, I want to provide my first name, last name, and password to complete signup, so that my profile is identifiable to teammates.
7. As a new user, I want to be sent to the login page with a success banner after signup, so that I sign in with my new credentials from the start.
8. As a user, I want to sign in with email and password, so that I can access the workspace.
9. As a user, I want to show or hide my password while typing, so that I can avoid typos on shared screens.
10. As a user, I want to be returned to the exact page I originally requested after logging in, so that emailed ticket links land me on the right ticket.
11. As a user, I want to request a password reset email, so that I can regain access if I forget my password.
12. As a user, I want the reset flow to avoid revealing whether an email is registered, so that accounts cannot be enumerated.
13. As a user, I want to set a new password (minimum 6 characters, entered twice) from the emailed recovery link, so that I can complete the reset safely.
14. As a user, I want the recovery session discarded once my password is updated, so that the emailed link cannot be reused.
15. As an authenticated user, I want to be redirected to the dashboard if I visit the login or signup pages, so that I don't re-authenticate needlessly.
16. As an unauthenticated visitor, I want every app page to bounce me to login (with my destination preserved), so that workspace data is never exposed.

### Navigation, layout & feedback
17. As a user, I want a persistent sidebar with Dashboard, Tickets, Entities, and Settings, so that I can move between areas in one click.
18. As an admin, I want an Audit entry in the sidebar that regular users never see, so that the audit surface stays admin-only.
19. As a user, I want to collapse or expand the sidebar and have my choice remembered, so that I control my screen space.
20. As a mobile user, I want a drawer menu with the same navigation, so that the app works on my phone.
21. As a user, I want a light/dark theme toggle that persists and applies without a flash, so that the app matches my environment.
22. As a user, I want a logout action with a confirmation dialog, so that I don't sign out accidentally.
23. As a user, I want a global "Add New" button available on every page, so that I can raise a ticket the moment an incident lands.
24. As a user, I want toast feedback on every action (success and failure), so that I always know whether my change stuck.
25. As a user, I want open pages to refresh automatically when a ticket is created anywhere in the app, so that lists never show stale counts.

### Dashboard
26. As a NOC operator, I want KPI cards for Total, Open, In Progress, and High Priority tickets, so that I can gauge the queue at a glance.
27. As a NOC operator, I want to see the five most recent tickets, so that I can spot what just came in.
28. As a NOC operator, I want to open any recent ticket straight into its detail modal, so that triage is one click away.
29. As a NOC operator, I want the KPIs to render even if the recent-tickets fetch fails, so that a partial outage doesn't blank the page.

### Tickets — browsing & finding
30. As a NOC operator, I want grid, kanban, and list views of the same ticket set, so that I can work the way the task demands.
31. As a NOC operator, I want to drag tickets between Open, In Progress, and Closed kanban columns, so that status changes are one gesture (with automatic revert if the save fails).
32. As a NOC operator, I want a sortable list table (ID, title, status, priority, assignee, created), so that I can order the queue by what matters now.
33. As a NOC operator, I want free-text search across ticket number, title, description, status, site, system, error code, and the joined category/priority/assignee/creator names, so that I can find any ticket from whatever fragment I remember.
34. As a NOC operator, I want multi-select filters for status, category, and priority with removable chips and a clear-all, so that I can slice the queue precisely.
35. As a NOC operator, I want paging in the grid view with a numbered pager, so that large queues stay navigable.
36. As a NOC operator, I want distinct empty states for "no tickets yet" versus "nothing matches my search/filters" with one-click clears, so that I'm never stuck wondering where the data went.
37. As an email recipient, I want the "View ticket" link in a notification to open that exact ticket in the app — even if I have to log in first — so that follow-up takes seconds.

### Tickets — creating & editing
38. As a NOC operator, I want a create-ticket form with title (required), description, an initial note, and drag-and-drop attachments, so that intake captures everything in one pass.
39. As a NOC operator, I want every new ticket to get a human-readable Ticket Number (Ticket#YYYYMMDD###) automatically, so that incidents are referenceable in conversation and reports.
40. As a NOC operator, I want to set category, priority, status, and assignee from controlled dropdowns, so that ticket metadata stays consistent.
41. As a NOC operator, I want telecom incident fields on each ticket — incident date, issue start/cleared, detection, escalation, provider-notified, and restoration-confirmed times, gross and provider downtime minutes, SLA impacted, redundancy available, partner impacted, RFO received — so that post-incident reports come straight from the record.
42. As a NOC operator, I want entity fields — demarcation, link, site, service type, detection source, traffic impact — sourced from the managed reference lists, so that reporting can aggregate cleanly.
43. As a NOC operator, I want inline editing of title, description, root cause (level 1 and 2), and preventive action in the detail modal, so that enrichment doesn't require a separate edit screen.
44. As a NOC operator, I want edits applied optimistically with automatic revert on failure, so that the UI feels instant but never lies.
45. As a NOC operator, I want to add and delete comments and internal notes on a ticket (with a short confirm delay on delete), so that discussion and working notes stay attached to the incident.
46. As a NOC operator, I want to upload and remove attachments (up to 10MB, allowed file types) stored durably, so that evidence like RFOs and screenshots lives with the ticket.
47. As an admin, I want ticket deletion restricted to admins — enforced in the database, not just hidden in the UI — so that records can't be destroyed casually.

### Tickets — Excel import/export
48. As a NOC operator, I want to export all tickets (with assignee, category, priority, creator, and notes resolved) to a date-stamped Excel file, so that I can build reports offline.
49. As a NOC operator, I want a downloadable import template whose columns carry dropdown validation from the live reference lists, so that bulk data arrives clean.
50. As a NOC operator, I want to import tickets from Excel with per-row validation, an optional strict mode, and a summary of created/failed/aborted rows, so that migrations and bulk loads are safe and debuggable.

### Email notifications
51. As a ticket creator, I want a confirmation email when my ticket is created, so that I have a receipt with a link back to it.
52. As a team, we want a status-change email sent to the support inbox with all workspace users BCC'd whenever a ticket's status actually changes, so that everyone sees movement without subscribing to anything.
53. As a team, we want a distinct closure email when a ticket reaches Closed, so that resolution is unambiguous.
54. As an email reader, I want the message to show the old → new status transition, who made the change, who opened the ticket, and current status/priority/assignee, so that I can judge relevance without opening the app.
55. As an email reader, I want a consistent, branded status-banner layout across created/updated/closed emails with a "View ticket" call to action, so that notifications are recognizable and actionable.

### Entities (reference lists)
56. As a NOC operator, I want one page that manages all ten lookup vocabularies — categories, priorities, assignees, departments, demarcations, links, sites, service types, detection sources, traffic impacts — so that controlled vocabulary lives in one place.
57. As a NOC operator, I want each list shown as a card previewing its first entries with a count of the rest, so that I can scan the vocabulary at a glance.
58. As a NOC operator, I want to add, rename, and delete entries in a modal (Enter to submit, confirmation dialog on delete), so that upkeep is fast and safe.
59. As a NOC operator, I want edits and deletes applied optimistically with revert on failure, so that list management feels immediate.
60. As a NOC operator, I want new reference values available immediately in ticket forms and filters, so that vocabulary changes take effect without a deploy.

### Schedules
61. As a NOC shift planner, I want a generated 4-week day/night rota for the eight NOC personnel, so that coverage planning takes seconds instead of hours.
62. As a NOC shift planner, I want the generator to respect hard constraints — no more than 2 consecutive nights, at most 4 working days per week, at most 180 hours per month, balanced day/night distribution — so that every published rota is compliant.
63. As a NOC shift planner, I want a Regenerate button that produces a different valid rota, so that I can offer alternatives.
64. As a NOC shift planner, I want per-person statistics (day/night counts, total hours, max consecutive nights) with pass/fail badges per constraint, so that compliance is visible, not assumed.
65. As a NOC shift planner, I want the constraint rules listed on the page, so that the rota is auditable by anyone.

### Audit Log (admin)
66. As an admin, I want an immutable, chronological feed of every write (insert/update/delete) across tickets, sub-resources, users, invites, and all reference lists, so that I can answer "who changed what, when."
67. As an admin, I want every audit row written by the database itself with unforgeable actor attribution (id, email, name snapshotted at write time), so that the trail cannot be spoofed or bypassed by the app.
68. As an admin, I want cascading changes that share a transaction grouped under one expandable row, so that a ticket delete with its comments and attachments reads as one event.
69. As an admin, I want filters for date range, actor, entity type, and action, plus full-text search over the change payloads, so that I can investigate quickly.
70. As an admin, I want a per-entity trail showing field-level old → new diffs for updates and the full row for inserts/deletes, so that I can reconstruct any record's history.
71. As an admin, I want to look up a ticket's trail by its Ticket Number, so that I don't need internal ids.
72. As an admin, I want "Load more" pagination that preserves my active filters, so that deep investigation stays coherent.
73. As an admin, I want to export the filtered audit feed to Excel, so that evidence can leave the tool when compliance asks.
74. As an admin, I want the audit page itself to redirect non-admins away before any data loads — with database row security as the real backstop — so that the trail is genuinely admin-only.

### Security & roles
75. As a workspace owner, I want a two-role model (user/admin) stored on the user profile and enforced by database row-level security, so that permissions hold even against a bypassed UI.
76. As a workspace owner, I want comments, notes, and attachments editable only by their owner or an admin, so that records stay attributable.
77. As a workspace owner, I want the invites table unreadable to unauthenticated visitors, with validation and consumption possible only through token-gated database functions, so that invite data never leaks pre-auth.
78. As a workspace owner, I want the post-login redirect parameter validated against open-redirect abuse, so that login links can't bounce users to attacker sites.
79. As a workspace owner, I want the email provider API key kept strictly server-side behind an API route, so that credentials never ship to the browser.

## Implementation Decisions

- **Architecture:** Next.js 16 App Router, client-heavy. Pages are client components backed by service singletons that call Supabase directly from the browser; only invites and email sending go through server API routes. The Audit page is the one server-rendered, force-dynamic page (server-side role gate + SSR of the first page of events).
- **Auth gate:** the Next 16 proxy (middleware) entrypoint refreshes the Supabase session on every request and redirects unauthenticated users to login with the original path+query preserved as a validated redirect parameter. Auth pages, the error page, and the invite endpoints are the only unauthenticated surfaces.
- **Data-access seam (ADR-0002):** all reads/writes go through service classes (ticket, assignee, department, auth, audit) that unwrap Supabase's data/error envelope and throw on failure. UI components never see raw Supabase responses.
- **Identity seam & roles (ADR-0001):** a single identity module owns profile reads and idempotent profile creation; role is the `role` column on the users profile (user/admin), enforced by a database CHECK and consumed via an auth context exposing `isAdmin`. The legacy roles/user_roles junction is dead.
- **Ticket Number (ADR-0003):** the human-readable Ticket#YYYYMMDD### identifier is generated at create time and is unique; audit drill-down resolves it to the row uuid. (Note: ADR-0003's column rename was never migrated — the live value is stored in the original column.)
- **Audit Log (ADR-0004):** capture is a generic SECURITY DEFINER database trigger attached to 16 tables; it snapshots the actor from the authenticated session, diffs changed columns into JSONB, and stamps the transaction id for grouping. The app has a strictly read-only audit seam; RLS grants SELECT to admins only and no one — including the app — holds write policies. Full-text search runs over a generated tsvector column; pagination is keyset (created_at desc, id desc).
- **Invites:** invite creation inserts a 32-byte hex token with 24-hour expiry and a role; validation/consumption for anonymous signup happens exclusively through SECURITY DEFINER RPCs so the invites table stays unreadable to the anon role. Signup consumes the invite, creates the profile with the invited role, then discards the auto-session and forces a fresh login.
- **Email pipeline:** a browser-side notification-policy module decides who is told and with which template (creator on create; support inbox + all-users BCC on status change; closed variant when status reaches Closed), then POSTs to the server email route, which renders React Email templates (a shared status-banner layout) and sends via Resend. All ticket emails deep-link back to the ticket workspace.
- **Freshness model:** no Supabase Realtime. Cross-page freshness uses a window-level "ticket created" custom event plus optimistic updates with snapshot revert on failure.
- **Excel:** a single export/import service (ExcelJS) owns ticket export, audit export, the 32-column import template with live dropdown validation, and header-alias-tolerant import with strict mode and per-row failure reporting.
- **Schedules:** a pure, seeded constraint-solver module (no database) generates the 4-week rota; regeneration is a new seed. Personnel and constraints are currently hard-coded.
- **Storage:** attachments live in a Supabase Storage bucket with authenticated read/upload/delete policies plus a row per attachment linked to its ticket (cascade on ticket delete).

## Testing Decisions

- A good test exercises a module's external behavior through its public interface — inputs in, observable outcomes out — and never asserts on implementation details (internal state, call order, private helpers).
- The codebase already has this pattern established with Vitest unit tests for four deep modules: the identity seam, the ticket-intake orchestration, audit transaction grouping, and the reference-list store. New tests should follow that prior art.
- Modules that are good candidates for the same treatment (pure or seam-shaped, testable without a browser): the schedule constraint solver (constraint satisfaction per seed), the safe-redirect guard (open-redirect cases), the audit filter/export helpers, the Excel header-mapping and row-validation logic, and the notification policy's recipient/template resolution.
- Page components and modals are intentionally not unit-tested; their logic is being progressively extracted into the seams above, which is where coverage belongs.

## Out of Scope

The following are explicitly not part of the as-built product (some exist as placeholders or dormant schema):

- In-app notifications: no notifications table, bell, inbox, or unread badges; email is the only cross-user channel. The "Notification settings" / "Unfollow ticket" links in email footers are non-functional placeholders.
- Live data sync: no Supabase Realtime subscriptions, presence, or live-updating tables.
- Settings beyond invites: no profile editing, preferences, or tabbed settings layout — the page renders a heading and (for admins) the Invite User card.
- "Remember me for 30 days" on login is cosmetic; it does not affect session duration.
- OAuth sign-in: the auth service supports Google/GitHub/Discord providers but no UI exposes them.
- User administration UI: no screen to list, edit, re-role, or deactivate existing users (the user service supports it; nothing renders it).
- Knowledge base, ticket history timeline, and SLA timers: tables exist but are dormant — no UI reads or writes them, and they are deliberately excluded from audit capture.
- Schedules persistence: rotas are generated client-side and not saved; the page is also not linked from either navigation menu.
- Landing page content: the root page is a static splash with a single CTA.

## Further Notes

Known gaps and drift observed while cataloging (candidates for follow-up tickets, not part of this PRD's scope):

1. **Invite creation relies on RLS alone.** The invite-creation route performs no explicit admin check, and the middleware exempts it from the auth gate; database row security on the invites table is the only enforcement. (Separately noted: production is one migration behind the repo on invites RLS.)
2. **The email-sending route is unauthenticated** — any caller who can reach it can send templated ticket emails.
3. **Generated database types are stale** relative to migrations (missing the role column, invites, entity tables, and most incident columns), so several modules intersect types manually.
4. **The mobile drawer omits the admin Audit link**, so admins on mobile must navigate to `/audit` manually.
5. The invite email's "invited by" name is never populated (the client doesn't send it), and the shared email footer carries a placeholder company address.
6. Root HTML metadata is still the framework boilerplate ("Create Next App").
7. Dashboard computes a Closed count that is not rendered as a card.
