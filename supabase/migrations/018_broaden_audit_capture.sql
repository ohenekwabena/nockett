-- 018_broaden_audit_capture.sql
--
-- AUDIT-2: broaden Audit Log capture from `tickets` (migration 017) to the rest
-- of the app. There is NO new trigger function -- every table below reuses the
-- generic public.audit_row() from 017, so each is a single
-- `after insert or update or delete ... execute function public.audit_row()`.
-- See docs/adr/0004-audit-log-via-db-triggers.md.
--
-- Precondition for the generic trigger: audit_row() reads (NEW|OLD).id::text as
-- the entity_id, so every audited table MUST have an `id` column. All fifteen
-- below do (verified against the live schema: uuid, integer, or bigint PKs).
--
-- Deliberately NOT audited:
--   * roles, user_roles    -- vestigial dynamic-roles tables (CONTEXT.md / ADR-0001)
--   * ticket_sla_timers    -- system-managed SLA bookkeeping, not a User action
--   * ticket_history       -- dormant per-Ticket operator timeline; explicitly
--                             NOT an Audit Event (CONTEXT.md). Auditing it would
--                             double-log Ticket activity.
--   * knowledge_base       -- not part of the audited surface
--   * audit_log            -- the log itself; a trigger on it would recurse
--
-- Cascade grouping: tickets' child FKs (ticket_comments, ticket_notes,
-- ticket_attachments) are ON DELETE CASCADE, so deleting a Ticket removes them in
-- the SAME transaction. Each child delete fires audit_row() and stamps the same
-- txid_current(), so the whole burst shares one txid and the admin UI collapses
-- it into one expandable group (ADR-0004). ticket_history / ticket_sla_timers
-- also cascade but are unaudited, so they add nothing to the burst.

-- ---------------------------------------------------------------------------
-- Ticket sub-resources (the cascade children that DO get audited).
-- ---------------------------------------------------------------------------
drop trigger if exists audit_ticket_comments on public.ticket_comments;
create trigger audit_ticket_comments
  after insert or update or delete on public.ticket_comments
  for each row execute function public.audit_row();

drop trigger if exists audit_ticket_notes on public.ticket_notes;
create trigger audit_ticket_notes
  after insert or update or delete on public.ticket_notes
  for each row execute function public.audit_row();

drop trigger if exists audit_ticket_attachments on public.ticket_attachments;
create trigger audit_ticket_attachments
  after insert or update or delete on public.ticket_attachments
  for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- People & access. `users` captures Role changes ({role:{old,new}} diff);
-- `invites` captures the invite lifecycle (insert + consume).
-- ---------------------------------------------------------------------------
drop trigger if exists audit_users on public.users;
create trigger audit_users
  after insert or update or delete on public.users
  for each row execute function public.audit_row();

drop trigger if exists audit_invites on public.invites;
create trigger audit_invites
  after insert or update or delete on public.invites
  for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Reference entities (CONTEXT.md): operator-managed lookup lists.
-- ---------------------------------------------------------------------------
drop trigger if exists audit_assignee on public.assignee;
create trigger audit_assignee
  after insert or update or delete on public.assignee
  for each row execute function public.audit_row();

drop trigger if exists audit_ticket_categories on public.ticket_categories;
create trigger audit_ticket_categories
  after insert or update or delete on public.ticket_categories
  for each row execute function public.audit_row();

drop trigger if exists audit_ticket_priorities on public.ticket_priorities;
create trigger audit_ticket_priorities
  after insert or update or delete on public.ticket_priorities
  for each row execute function public.audit_row();

drop trigger if exists audit_departments on public.departments;
create trigger audit_departments
  after insert or update or delete on public.departments
  for each row execute function public.audit_row();

drop trigger if exists audit_demarcations on public.demarcations;
create trigger audit_demarcations
  after insert or update or delete on public.demarcations
  for each row execute function public.audit_row();

drop trigger if exists audit_links on public.links;
create trigger audit_links
  after insert or update or delete on public.links
  for each row execute function public.audit_row();

drop trigger if exists audit_sites on public.sites;
create trigger audit_sites
  after insert or update or delete on public.sites
  for each row execute function public.audit_row();

drop trigger if exists audit_service_types on public.service_types;
create trigger audit_service_types
  after insert or update or delete on public.service_types
  for each row execute function public.audit_row();

drop trigger if exists audit_detection_sources on public.detection_sources;
create trigger audit_detection_sources
  after insert or update or delete on public.detection_sources
  for each row execute function public.audit_row();

drop trigger if exists audit_traffic_impacts on public.traffic_impacts;
create trigger audit_traffic_impacts
  after insert or update or delete on public.traffic_impacts
  for each row execute function public.audit_row();
