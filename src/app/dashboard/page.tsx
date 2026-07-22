"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ticketService, type DashboardStats } from "@/services/ticket-service";
import { useAuth } from "@/context/auth-context";
import { getProfile } from "@/lib/identity";
import {
  AvatarStack,
  EmptyState,
  Loading,
  MIcon,
  PriorityCell,
  StatusBadge,
  fmtDate,
  shortTicketNo,
  timeAgo,
  useNkShell,
} from "@/components/nk/ui";

const KPI_TINTS = {
  total: { tint: "var(--accent-soft)", fg: "var(--accent)", dtint: "var(--accent-soft)", dfg: "var(--accent)" },
  open: { tint: "#f1f2f5", fg: "#5b6472", dtint: "#2b3450", dfg: "#aeb8cd" },
  progress: { tint: "#fbeccf", fg: "#925708", dtint: "#3a2f16", dfg: "#f1c570" },
  high: { tint: "#fbdddd", fg: "#b3261e", dtint: "#3a1c1c", dfg: "#f09a9a" },
} as const;

export default function Dashboard() {
  const { user } = useAuth();
  const { openTicket } = useNkShell();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    highPriority: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [loadedStats, recent] = await Promise.all([
        ticketService.getDashboardStats(),
        // Recent tickets are non-critical: keep the dashboard usable if they fail.
        ticketService.readTicketsWithDetails({ limit: 5 }).catch((recentError) => {
          console.error("Error loading recent tickets:", recentError);
          return [];
        }),
      ]);
      setStats(loadedStats);
      setRecentTickets(recent);
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const handleTicketUpdated = () => loadDashboardData();
    window.addEventListener("ticketCreated", handleTicketUpdated);
    return () => window.removeEventListener("ticketCreated", handleTicketUpdated);
  }, [loadDashboardData]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((profile) => setFirstName((profile.name || "").split(" ")[0] || null))
      .catch(() => setFirstName(null));
  }, [user]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Each card deep-links into the ticket queue with the matching filter
  // pre-applied (tickets page reads ?status= / ?priority=). "Total" clears out
  // to the unfiltered queue.
  const kpis = [
    { label: "Total tickets", value: stats.total, icon: "confirmation_number", ...KPI_TINTS.total, href: "/tickets" },
    {
      label: "Open",
      value: stats.open,
      icon: "radio_button_unchecked",
      ...KPI_TINTS.open,
      href: "/tickets?status=OPEN",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: "clock_loader_40",
      ...KPI_TINTS.progress,
      href: "/tickets?status=IN_PROGRESS",
    },
    {
      label: "High priority",
      value: stats.highPriority,
      icon: "priority_high",
      ...KPI_TINTS.high,
      href: "/tickets?priority=HIGH",
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loading label="Loading dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <EmptyState icon="error" title="Something went wrong" body={error} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <h1>
            {greet}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <span className="dim" style={{ fontSize: 13 }}>
          {fmtDate(new Date())}
        </span>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            className="kpi-card"
            onClick={() => router.push(kpi.href)}
            title={`View ${kpi.label.toLowerCase()} tickets`}
          >
            <span
              className="kpi-ic"
              style={
                {
                  "--tint": kpi.tint,
                  "--fg": kpi.fg,
                  "--dtint": kpi.dtint,
                  "--dfg": kpi.dfg,
                } as React.CSSProperties
              }
            >
              <MIcon name={kpi.icon} size={19} weight={500} />
            </span>
            <span className="kpi-meta">
              <span className="kpi-v">{kpi.value}</span>
              <span className="kpi-l">{kpi.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="panel-head">
        <h2>Recent tickets</h2>
        <button type="button" className="link-btn" onClick={() => router.push("/tickets")}>
          View all <MIcon name="arrow_forward" size={13} />
        </button>
      </div>

      {recentTickets.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title="No tickets yet"
          body="Raise the first ticket when an incident lands."
        />
      ) : (
        <div className="tk-table">
          {recentTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="tk-row"
              onClick={() => openTicket(ticket, { onChanged: loadDashboardData })}
            >
              <span className={"row-dot" + (ticket.status === "CLOSED" ? " done" : "")}>
                {ticket.status === "CLOSED" && <MIcon name="check" size={13} weight={600} />}
              </span>
              <span className="tk-num">{shortTicketNo(ticket)}</span>
              <span className="tk-title">{ticket.title}</span>
              <span>
                <StatusBadge status={ticket.status} />
              </span>
              <span>
                <PriorityCell priority={ticket.ticket_priorities?.name} />
              </span>
              <span>
                <AvatarStack names={[ticket.assignee?.name]} size={24} />
              </span>
              <span className="dim tk-date">{timeAgo(ticket.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
