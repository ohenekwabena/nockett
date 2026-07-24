# Nockett vs. Jira Service Management — the case for building on what we own

**Decision-support companion to the JIRA & NetBox project plan · Prepared for Jesse Adjei-Asare (PM) · 24 July 2026**

All Atlassian figures in this document are taken from the fact-checked presentation (20 claims verified against live vendor pages on 24 July 2026); claim numbers reference that report. Nockett capabilities are taken from the as-built PRD (`docs/prd-nockett-as-built.md`) and the current codebase.

## Executive summary

The JSM proposal solves real problems: one incident queue, timed escalation, end-of-shift reporting, and a request channel for the commercial team. But we already own a tool purpose-built for the largest of those problems — **Nockett**, our in-house NOC ticketing system, in use today with telecom-specific incident records, an immutable audit trail, and a shift-rota generator encoding our exact roster rules.

What Nockett lacks is not capability; it is **automation we have not built yet**. Closing that gap is a one-time 6–10 engineering weeks. The alternative is a per-agent subscription starting at **$1,920/year** (JSM Standard, 8 agents) that realistically becomes **$4,936/year** at Phase 2, because change management — RFCs and maintenance windows — is Premium-only ($51.42/agent/mo, fact-check #4).

**Recommendation:** run the NOC on Nockett, invest the first year of JSM budget in closing the gaps, keep the commercial-portal decision open behind a week-6 gate, and proceed with NetBox exactly as planned.

## 1. We already own most of Phase 1

| Phase-1 need | JSM | Nockett today |
|---|---|---|
| Incident intake and queue (grid / kanban / list, filters, search) | Configure | **Built** |
| Telecom incident record — detection → escalation → provider-notified → restoration timestamps, gross/provider downtime, SLA-impacted, redundancy, partner impact, RFO, root cause L1/L2, preventive action | Custom fields to configure | **Built** — native schema |
| Controlled vocabularies (sites, links, demarcations, service types, detection sources, traffic impact, categories, priorities…) | Configure | **Built** — 10 managed lists, live-editable |
| Email notifications with deep links | Built-in | **Built** — creator receipt, support-inbox + all-user BCC on status change, closure variant |
| Excel reporting and bulk import | Export + marketplace | **Built** — export plus validated 32-column import template |
| Immutable audit trail | Partial on Standard | **Built** — database-trigger audit log, unforgeable actor attribution, full-text search, Excel export |
| NOC shift rota (max 2 consecutive nights, no day-after-night, Wednesday 3-up, pro-rated 180h cap, stable pairs) | Not a JSM feature — Premium on-call ≠ rota planning | **Built** — constraint solver, admin overrides, saved history, published-roster Excel export |
| 15-min no-response escalation (#13) | Standard automation (runs metered) | Gap — build (§7) |
| End-of-shift report (#14) | Configure automation | Gap — build |
| SMS alerts (#4) | Standard | Gap — build (local gateway) |
| Commercial-team request portal (#3, #12) | Standard (requesters free) | Gap — build |
| AI ticket summaries (#5) | Rovo, credit-free | Gap — build (LLM API) |
| Alert ingestion + AI grouping (#6) | Premium | Deferred — see §6 |

## 2. Exact fit beats configuration

Every JSM feature we would use requires configuring a generic tool toward what Nockett already **is**. Our incident record *is* the RFO workflow — the fields the post-incident report needs are the ticket schema, not custom-field bolt-ons. The rota generator encodes constraints JSM cannot express at any tier: exactly 3 on days every Wednesday, pro-rated 180-hour monthly caps, no day shift after a night, stable pairs — and it exports the published paper roster byte-for-byte. When our workflow changes, Nockett changes at the speed of our own repository, not at the speed of a vendor's configuration surface.

## 3. The per-agent meter never starts

- **No per-seat licences.** Every new agent in JSM is $240/yr (Standard) to $617/yr (Premium). In Nockett a new user is a free invite. The commercial team's "requesters are free" advantage (#3) is matched trivially: in Nockett *everyone* is free.
- **No automation caps.** JSM Standard pools 5,000 automation runs/month site-wide; our own deck estimates Phase-1 load at 1,500–2,500 runs (#13) — it fits, but it is metered headroom and the deck itself calls it "one more quiet argument for Premium at Phase 2." Nockett automations run on our own infrastructure, unmetered.
- **No Premium cliff.** RFCs, maintenance windows, and problem management moved Premium-only on 16 Oct 2024 (#4) — that single need multiplies the subscription by 2.6×. In Nockett, change-request approvals are a one-time ~3–4-week build we then own outright.

## 4. Ownership: no tier-shuffles, no forced migrations

The fact-check report itself documents the platform risk:

- **16 Oct 2024** — change management, problem management, and advanced incident management migrated from Standard to Premium/Enterprise mid-life (#4). Features customers relied on moved up a paywall.
- **28 Mar 2029** — Data Center reaches end of life; every self-hosted licence expires and becomes read-only (#7). Atlassian is ending self-hosting entirely; the future is cloud-only, repriced at renewal on their terms.

Two verified precedents that the platform moves under its tenants. Nockett is our stack — Next.js + Supabase/Postgres — hostable anywhere, including the deck's own DigitalOcean fallback ($24–48/mo droplets, #11) or in-country infrastructure. Incident data, customer-impact records, and audit trails stay under our control.

## 5. An audit trail beyond JSM Standard

Nockett's Audit Log is written by the database itself: SECURITY DEFINER triggers on 16 tables, actor identity snapshotted at write time, transaction-grouped cascades, full-text search, and Excel export for compliance. No one — including the application — holds a write policy on it. This is compliance-grade "who changed what, when" that JSM Standard does not match out of the box.

## 6. Where JSM is genuinely ahead — and what we would do about it

| JSM advantage | Our position |
|---|---|
| Alert ingestion + AI grouping (Premium, #6) | Real gap. At our volume (1–5 tickets/day) AIOps is not load-bearing; Phase 2 option is a webhook intake from monitoring into Nockett tickets. |
| Native mobile apps | Nockett is responsive web — adequate for a staffed NOC; no offline field use today. |
| Marketplace of integrations | We integrate only what we actually need (SMS gateway, chat) directly, rather than paying for the long tail. |
| Vendor support and zero build time | Real. Mitigated by the time-boxed roadmap in §7 — and by the fact that JSM Standard remains available later at no penalty if we miss the gate. Waiting costs nothing; there is no migration lock-in accruing. |
| No maintenance burden | Nockett is ours to maintain. Mitigation: tests already cover the deep modules, the PRD/ADRs are current, and we staff at least two maintainers. |

## 7. Gap-closure roadmap (6–10 weeks, one-time)

| # | Work | Effort |
|---|---|---|
| 0 | Security hardening: authenticate the email route, admin-check the invite route, regenerate DB types | 1 wk |
| 1 | Job infrastructure: pg_cron + Supabase Edge Functions — the one architectural addition that unlocks every automation below | 1–2 wks |
| 2 | 15-min no-response escalation on SLA timers (schema already exists, dormant) with on-shift routing from the saved rota | 1–2 wks |
| 3 | End-of-shift report: scheduled query → existing email pipeline, with engineer sign-off | 1 wk |
| 4 | SMS alerts via a local gateway (Hubtel / Africa's Talking) | 1 wk |
| 5 | Commercial-team requester role + simplified portal | 2–3 wks |
| 6 | AI ticket summaries on the detail view | 1 wk |

Pre-Phase-2 (deferred): change-request approvals + maintenance-window calendar (~3–4 wks); knowledge base (~2 wks).

## 8. Three-year cost picture (8 agents)

| Option | Year 1 | 3 years | Notes |
|---|---|---|---|
| JSM Standard | $1,920 | $5,760 | Plus Premium pressure at Phase 2; automation runs metered |
| JSM Premium | $4,936 | $14,808 | Required for change mgmt / maintenance windows (#4) |
| Nockett | ~$600–960 infra | ~$1,800–2,900 | Plus one-time 6–10 engineering weeks and ~0.1 FTE ongoing maintenance |

Sensitivity to growth: at 15 agents JSM Standard is $3,600/yr and Premium $9,256/yr; Nockett's cost is unchanged. JSM prices are list, exclude tax, and assume monthly billing (annual saves up to 17%, #1).

## 9. Honest failure modes

- **The build slips.** Time-box it: decision gate at week 6. JSM Standard remains fully available as the fallback, at the same price, with nothing lost by having waited.
- **Key-person dependency.** Two named maintainers, the existing test suite, and current ADRs/PRD are the mitigation — this is a staffing commitment the plan must include.
- **Scope creep.** We build only what the deck's Phase 1 needs. Alert AIOps is explicitly deferred, not implicitly promised.

## 10. Recommendation

1. Adopt Nockett as the NOC's system of record now — functionally, it already is.
2. Approve the 6–10-week gap-closure roadmap with a decision gate at week 6.
3. Hold the commercial-team portal decision until the gate: on track → build it in Nockett; slipping → buy JSM Standard for that use case only.
4. Proceed with NetBox Community exactly as planned — this choice does not touch it.
5. Re-evaluate against JSM at the gate with delivery data, not projections.
