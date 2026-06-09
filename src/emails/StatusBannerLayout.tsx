import * as React from "react";

/**
 * Direction B — "Status Banner" (from the Nockett Ticket Emails design bundle).
 *
 * A bold colour banner keyed to the ticket's new status, an activity log with
 * event dots showing the old -> new transition, a compact meta strip, and a
 * "View ticket" CTA. Rendered to an HTML string by `@react-email/render` and
 * sent through Resend.
 *
 * This layout is shared by the two status-change notifications that fire today —
 * {@link TicketUpdatedEmail} (any non-terminal status) and {@link TicketClosedEmail} —
 * so every status change a recipient sees looks the same. All visual values
 * (palette, banner colours, pill colours, the 600px shell, the responsive
 * stacking) are lifted verbatim from the design's light theme. We deliberately
 * keep the design's email-safe serif (Georgia) for the slab headings rather than
 * the preview's web font, since email clients can't reliably load web fonts.
 */

// ---- Type fonts (email-safe stacks, straight from the design's email-core) ----
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', Times, serif";

// ---- Light-theme palette (design's email-core `palettes.light`) ----
const C = {
  pageBg: "#eceef6",
  cardBg: "#ffffff",
  ink: "#1d2739",
  body: "#414b5e",
  muted: "#7a8499",
  faint: "#9aa3b5",
  border: "#e4e7f0",
  hair: "#eef0f6",
  subtle: "#f6f7fb",
  accent: "#4f46e5",
  btnBg: "#1d2739",
  btnText: "#ffffff",
};

/** Fallback banner colour for an unrecognised status (design's BRAND_BOLD). */
const BRAND_BANNER = "#4b46d6";

interface StatusStyle {
  label: string;
  /** Solid banner colour (design's STATUS_BOLD). */
  banner: string;
  /** [foreground, background] for the soft status pill (design's STATUS light). */
  pill: [string, string];
}

/** Keyed by the app's normalised status enum (OPEN, IN_PROGRESS, ...). */
const STATUS: Record<string, StatusStyle> = {
  OPEN: { label: "Open", banner: "#5b6b85", pill: ["#475569", "#eef1f7"] },
  IN_PROGRESS: { label: "In Progress", banner: "#b9770e", pill: ["#925708", "#fbeccf"] },
  WAITING: { label: "Waiting", banner: "#5a4bb3", pill: ["#5a4bb3", "#ece9fb"] },
  ON_HOLD: { label: "On Hold", banner: "#5a4bb3", pill: ["#5a4bb3", "#ece9fb"] },
  RESOLVED: { label: "Resolved", banner: "#1f8a4c", pill: ["#176534", "#daf1e1"] },
  CLOSED: { label: "Closed", banner: "#5b6b85", pill: ["#475569", "#eef1f7"] },
};

/** Priority pill colours (design's PRIORITY light) — used when a priority is supplied. */
const PRIORITY: Record<string, [string, string]> = {
  LOW: ["#176534", "#daf1e1"],
  MEDIUM: ["#1e4fae", "#e1eafb"],
  HIGH: ["#b23c0d", "#fbe5d8"],
  URGENT: ["#b3261e", "#fbdddd"],
};

function normalize(status: string): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function titleCase(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function styleFor(status: string): StatusStyle {
  return (
    STATUS[normalize(status)] || {
      label: titleCase(status) || "Updated",
      banner: BRAND_BANNER,
      pill: ["#475569", "#eef1f7"],
    }
  );
}

function priorityPill(priority: string): [string, string] {
  return PRIORITY[normalize(priority)] || ["#475569", "#eef1f7"];
}

/** Whether this is a brand-new ticket or a change to an existing one. */
export type BannerIntent = "status-change" | "created";

// ---- Banner copy, derived from the intent + new status (design's per-scenario `tag`/`title`) ----
function bannerTag(intent: BannerIntent, newKey: string): string {
  if (intent === "created") return "New ticket";
  if (newKey === "CLOSED") return "Ticket closed";
  if (newKey === "RESOLVED") return "Ticket resolved";
  return "Status updated";
}

function bannerTitle(intent: BannerIntent, newKey: string, newLabel: string): string {
  if (intent === "created") return "New ticket opened";
  if (newKey === "CLOSED") return "Ticket closed";
  if (newKey === "RESOLVED") return "Marked as Resolved";
  return `Moved to ${newLabel}`;
}

function summaryText(
  intent: BannerIntent,
  newKey: string,
  newLabel: string,
  oldLabel: string | null,
  actor?: string,
): string {
  const a = actor && actor.trim();
  if (intent === "created") return a ? `${a} opened this ticket.` : "A new ticket was opened.";
  if (newKey === "CLOSED") return a ? `${a} closed this ticket.` : "This ticket was closed.";
  if (newKey === "RESOLVED") return a ? `${a} resolved this ticket.` : "This ticket was resolved.";
  if (oldLabel) {
    return a
      ? `${a} moved this ticket from ${oldLabel} to ${newLabel}.`
      : `This ticket was moved from ${oldLabel} to ${newLabel}.`;
  }
  return a ? `${a} set this ticket to ${newLabel}.` : `This ticket is now ${newLabel}.`;
}

// ---- Atoms ----
function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 11px",
        borderRadius: "999px",
        backgroundColor: bg,
        color: fg,
        fontFamily: SANS,
        fontSize: "11px",
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "11px",
        height: "11px",
        borderRadius: "999px",
        backgroundColor: color,
      }}
    />
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span
        style={{
          display: "inline-block",
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          backgroundColor: "#dfe3f5",
          color: "#3a4796",
          fontFamily: SANS,
          fontSize: "11px",
          fontWeight: 700,
          lineHeight: "24px",
          textAlign: "center",
          verticalAlign: "middle",
        }}
      >
        {initials(name)}
      </span>
      <span
        style={{
          paddingLeft: "9px",
          fontFamily: SANS,
          fontSize: "14px",
          fontWeight: 600,
          color: C.ink,
          verticalAlign: "middle",
        }}
      >
        {name}
      </span>
    </span>
  );
}

function Button({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: C.btnBg,
        color: C.btnText,
        fontFamily: SANS,
        fontSize: "15px",
        fontWeight: 700,
        lineHeight: "48px",
        textAlign: "center",
        textDecoration: "none",
        borderRadius: "8px",
        padding: "0 32px",
        minWidth: "180px",
      }}
    >
      {label}
    </a>
  );
}

/** One row of the activity log: event dot | label + detail | time. */
function ActivityRow({
  dotColor,
  label,
  time,
  last,
  children,
}: {
  dotColor: string;
  label: string;
  time?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  const borderBottom = last ? "none" : `1px solid ${C.hair}`;
  return (
    <tr>
      <td width={14} style={{ verticalAlign: "top", padding: "2px 0 18px", borderBottom }}>
        <Dot color={dotColor} />
      </td>
      <td style={{ verticalAlign: "top", padding: "0 0 18px 14px", borderBottom }}>
        <div style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 700, color: C.ink }}>{label}</div>
        {children ? <div style={{ paddingTop: "8px" }}>{children}</div> : null}
      </td>
      <td
        style={{
          verticalAlign: "top",
          padding: "1px 0 18px 10px",
          borderBottom,
          whiteSpace: "nowrap",
          textAlign: "right",
          fontFamily: SANS,
          fontSize: "12px",
          color: C.faint,
        }}
      >
        {time || ""}
      </td>
    </tr>
  );
}

export interface StatusBannerEmailProps {
  /** New status (app enum or label) — drives the banner colour, tag, and title. */
  newStatus: string;
  /** Prior status, when known — drives the "from -> to" transition. */
  oldStatus?: string;
  /** Brand-new ticket vs. a change to an existing one. Defaults to "status-change". */
  intent?: BannerIntent;
  /** Body copy for the activity log (e.g. the ticket description on a new ticket). */
  bodyText?: string;
  /** Ticket subject / title. */
  subject: string;
  /** Who performed the change (updater / closer). */
  actorName?: string;
  /** Human ticket id, e.g. "NCK-2481". */
  ticketId?: string;
  /** Absolute URL to view the ticket; powers the CTA. */
  ticketUrl?: string;
  /** Requester / opener name, for the activity-log context row. */
  requesterName?: string;
  /** Formatted ticket-open date, e.g. "Jun 7". */
  createdDate?: string;
  /** Formatted change time, e.g. "2:14 PM". */
  eventTime?: string;
  /** Current priority, for the meta strip (optional). */
  priority?: string;
  /** Current assignee name, for the meta strip (optional). */
  assignee?: string;
}

const RESPONSIVE_CSS =
  "@media (max-width:620px){" +
  ".em-shell{width:100%!important}" +
  ".em-pad{padding-left:22px!important;padding-right:22px!important}" +
  ".em-stack{display:block!important;width:100%!important;border-right:0!important}" +
  "}";

export function StatusBannerEmail({
  newStatus,
  oldStatus,
  intent = "status-change",
  bodyText,
  subject,
  actorName,
  ticketId,
  ticketUrl,
  requesterName,
  createdDate,
  eventTime,
  priority,
  assignee,
}: StatusBannerEmailProps) {
  const newKey = normalize(newStatus);
  const newStyle = styleFor(newStatus);
  const isCreated = intent === "created";
  const hasOld = !isCreated && Boolean(oldStatus && oldStatus.trim());
  const oldStyle = hasOld ? styleFor(oldStatus as string) : null;
  const banner = newStyle.banner;
  const url = ticketUrl || "#";

  const tag = bannerTag(intent, newKey);
  const title = bannerTitle(intent, newKey, newStyle.label);
  const summary = summaryText(intent, newKey, newStyle.label, oldStyle ? oldStyle.label : null, actorName);

  // Compact meta strip: always Status; add Priority / Assignee when supplied;
  // backfill with a timestamp so the strip never renders a lone cell.
  const metaCells: { label: string; node: React.ReactNode }[] = [
    { label: "Status", node: <Pill label={newStyle.label} fg={newStyle.pill[0]} bg={newStyle.pill[1]} /> },
  ];
  if (priority) {
    const [pfg, pbg] = priorityPill(priority);
    metaCells.push({ label: "Priority", node: <Pill label={titleCase(priority)} fg={pfg} bg={pbg} /> });
  }
  if (assignee) {
    metaCells.push({ label: "Assignee", node: <Avatar name={assignee} /> });
  }
  const backfillValue = isCreated ? createdDate || eventTime : eventTime;
  if (metaCells.length < 2 && backfillValue) {
    metaCells.push({
      label: isCreated ? "Opened" : "Last updated",
      node: <span style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 600, color: C.ink }}>{backfillValue}</span>,
    });
  }
  const metaWidth = `${Math.round(100 / metaCells.length)}%`;

  return (
    <div style={{ backgroundColor: C.pageBg, margin: 0, padding: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />

      {/* Hidden inbox preview text */}
      <div
        style={{
          display: "none",
          maxHeight: 0,
          overflow: "hidden",
          fontSize: "1px",
          lineHeight: "1px",
          color: "transparent",
          opacity: 0,
        }}
      >
        {`${title}${ticketId ? ` · ${ticketId}` : ""} — ${subject}`}
      </div>

      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ backgroundColor: C.pageBg, borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: "28px 12px 40px" }}>
              {/* Card */}
              <table
                role="presentation"
                width="600"
                className="em-shell"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{
                  width: "600px",
                  maxWidth: "600px",
                  margin: "0 auto",
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "16px",
                  borderCollapse: "separate",
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <tbody>
                  {/* Colored banner */}
                  <tr>
                    <td
                      className="em-pad"
                      style={{ backgroundColor: banner, padding: "26px 40px 30px" }}
                    >
                      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                        <tbody>
                          <tr>
                            <td style={{ verticalAlign: "middle" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "7px",
                                  backgroundColor: "#ffffff",
                                  color: C.ink,
                                  fontFamily: SERIF,
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  lineHeight: "26px",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                N
                              </span>
                              <span
                                style={{
                                  paddingLeft: "9px",
                                  fontFamily: SERIF,
                                  fontSize: "17px",
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  verticalAlign: "middle",
                                }}
                              >
                                Nockett
                              </span>
                            </td>
                            <td
                              style={{
                                verticalAlign: "middle",
                                textAlign: "right",
                                fontFamily: SANS,
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,.78)",
                              }}
                            >
                              {tag}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div
                        style={{
                          fontFamily: SERIF,
                          fontSize: "27px",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          color: "#ffffff",
                          letterSpacing: "-0.01em",
                          paddingTop: "22px",
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: "rgba(255,255,255,.85)",
                          paddingTop: "9px",
                        }}
                      >
                        {summary}
                      </div>
                    </td>
                  </tr>

                  {/* Ticket subject */}
                  <tr>
                    <td className="em-pad" style={{ padding: "26px 40px 6px" }}>
                      {ticketId ? (
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: C.faint,
                          }}
                        >
                          {ticketId}
                        </div>
                      ) : null}
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontSize: "18px",
                          lineHeight: 1.4,
                          fontWeight: 700,
                          color: C.ink,
                          paddingTop: ticketId ? "5px" : 0,
                        }}
                      >
                        {subject}
                      </div>
                    </td>
                  </tr>

                  {/* Activity log */}
                  <tr>
                    <td className="em-pad" style={{ padding: "20px 40px 2px" }}>
                      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                        <tbody>
                          {isCreated ? (
                            <ActivityRow
                              dotColor={banner}
                              label="Ticket opened"
                              time={createdDate || eventTime}
                              last
                            >
                              {bodyText ? (
                                <div
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: "15px",
                                    lineHeight: 1.6,
                                    color: C.body,
                                  }}
                                >
                                  {bodyText}
                                </div>
                              ) : (
                                <Pill label={newStyle.label} fg={newStyle.pill[0]} bg={newStyle.pill[1]} />
                              )}
                            </ActivityRow>
                          ) : (
                            <>
                              <ActivityRow
                                dotColor={banner}
                                label="Status changed"
                                time={eventTime}
                                last={!requesterName}
                              >
                                <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                                  <tbody>
                                    <tr>
                                      {oldStyle ? (
                                        <>
                                          <td>
                                            <Pill label={oldStyle.label} fg={oldStyle.pill[0]} bg={oldStyle.pill[1]} />
                                          </td>
                                          <td
                                            style={{
                                              padding: "0 9px",
                                              fontFamily: SANS,
                                              fontSize: "15px",
                                              color: C.faint,
                                            }}
                                          >
                                            →
                                          </td>
                                        </>
                                      ) : null}
                                      <td>
                                        <Pill label={newStyle.label} fg={newStyle.pill[0]} bg={newStyle.pill[1]} />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </ActivityRow>

                              {requesterName ? (
                                <ActivityRow
                                  dotColor={C.faint}
                                  label={`Opened by ${requesterName}`}
                                  time={createdDate}
                                  last
                                />
                              ) : null}
                            </>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Meta strip */}
                  <tr>
                    <td className="em-pad" style={{ padding: "8px 40px 4px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        border={0}
                        style={{
                          backgroundColor: C.subtle,
                          border: `1px solid ${C.border}`,
                          borderRadius: "12px",
                          borderCollapse: "separate",
                        }}
                      >
                        <tbody>
                          <tr>
                            {metaCells.map((cell, i) => (
                              <td
                                key={cell.label}
                                className="em-stack"
                                width={metaWidth}
                                style={{
                                  verticalAlign: "top",
                                  width: metaWidth,
                                  padding: "16px 18px",
                                  borderRight:
                                    i < metaCells.length - 1 ? `1px solid ${C.hair}` : "none",
                                }}
                              >
                                <div
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    color: C.faint,
                                    paddingBottom: "9px",
                                  }}
                                >
                                  {cell.label}
                                </div>
                                {cell.node}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* CTA */}
                  <tr>
                    <td className="em-pad" style={{ padding: "24px 40px 34px" }}>
                      <Button href={url} label="View ticket" />
                      <span style={{ display: "inline-block", width: "14px" }}>&nbsp;</span>
                      <a
                        href={`${url}#reply`}
                        style={{
                          fontFamily: SANS,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: C.accent,
                          lineHeight: "48px",
                        }}
                      >
                        Reply
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <table
                role="presentation"
                width="600"
                className="em-shell"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "600px", maxWidth: "600px", margin: "0 auto", borderCollapse: "collapse" }}
              >
                <tbody>
                  <tr>
                    <td
                      className="em-pad"
                      style={{
                        padding: "26px 40px 8px",
                        fontFamily: SANS,
                        fontSize: "12px",
                        lineHeight: 1.7,
                        color: C.faint,
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontFamily: SERIF, fontWeight: 700, color: C.muted, fontSize: "13px" }}>
                        Nockett
                      </span>
                      {`  ·  You're receiving this because you follow ticket ${ticketId || "this ticket"}.`}
                      <br />
                      <a href={url} style={{ color: C.muted, textDecoration: "underline" }}>
                        Notification settings
                      </a>
                      {"  ·  "}
                      <a href={url} style={{ color: C.muted, textDecoration: "underline" }}>
                        Unfollow ticket
                      </a>
                      <br />
                      <br />
                      <span style={{ color: C.faint }}>Nockett, Inc. · 500 Howard St, San Francisco, CA 94105</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
