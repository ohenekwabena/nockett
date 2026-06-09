import * as React from "react";

export interface TicketUpdatedEmailProps {
  title: string;
  oldStatus: string;
  newStatus: string;
  updaterName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#2563eb",
  IN_PROGRESS: "#d97706",
  ON_HOLD: "#6b7280",
  RESOLVED: "#059669",
  CLOSED: "#4b5563",
};

function StatusBadge({ status }: { status: string }) {
  const bg = STATUS_COLORS[status?.toUpperCase()] ?? "#6b7280";
  return (
    <span
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        padding: "3px 10px",
        borderRadius: "9999px",
        backgroundColor: bg,
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {status || "—"}
    </span>
  );
}

export function TicketUpdatedEmail({ title, oldStatus, newStatus, updaterName }: TicketUpdatedEmailProps) {
  const hasTransition = Boolean(oldStatus);

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: "#f4f4f5",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          border: "1px solid #e4e4e7",
          borderRadius: "12px",
          padding: "28px",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#6366f1",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Ticket updated
        </p>

        <h1 style={{ margin: "0 0 18px", fontSize: "18px", lineHeight: 1.4, color: "#18181b" }}>{title}</h1>

        <div style={{ margin: "0 0 18px" }}>
          {hasTransition && (
            <>
              <StatusBadge status={oldStatus} />
              <span style={{ display: "inline-block", margin: "0 8px", color: "#a1a1aa", verticalAlign: "middle" }}>
                &rarr;
              </span>
            </>
          )}
          <StatusBadge status={newStatus} />
        </div>

        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#52525b" }}>
          {hasTransition ? "Status changed" : `Status is now ${newStatus}`}
          {updaterName ? ` by ${updaterName}` : ""}.
        </p>
      </div>

      <p
        style={{
          maxWidth: "480px",
          margin: "16px auto 0",
          fontSize: "12px",
          color: "#a1a1aa",
          textAlign: "center",
        }}
      >
        You're receiving this because you're a member of the Nockett workspace.
      </p>
    </div>
  );
}
