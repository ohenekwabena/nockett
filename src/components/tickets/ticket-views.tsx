"use client";

/**
 * Ticket queue views (design tickets.jsx): sortable list, drag & drop kanban,
 * paged grid. Pure presentation over the normalized ticket rows; all writes go
 * through the callbacks the page passes in.
 */

import { useMemo, useState } from "react";
import type { OptimisticTicket } from "@/hooks/use-optimistic-tickets";
import {
  AvatarStack,
  MIcon,
  PriorityCell,
  StatusBadge,
  STATUS_ORDER,
  fmtDate,
  priorityRank,
  shortTicketNo,
  statusUi,
} from "@/components/nk/ui";

type OpenTicket = (ticket: OptimisticTicket) => void;

/* ---------- List ---------- */
export function TicketListView({
  tickets,
  onOpen,
}: {
  tickets: OptimisticTicket[];
  onOpen: OpenTicket;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: "created", dir: -1 });
  const cols = [
    { key: "num", label: "Ticket" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Urgency" },
    { key: "assignees", label: "Assigned to", nosort: true },
    { key: "created", label: "Created" },
  ];

  const sorted = useMemo(() => {
    const arr = [...tickets];
    const valueOf = (ticket: OptimisticTicket): string | number => {
      switch (sort.key) {
        case "num":
          return ticket.ticket_id || "";
        case "title":
          return ticket.title || "";
        case "status":
          return ticket.status || "";
        case "priority":
          return priorityRank(ticket.ticket_priorities?.name);
        case "created":
        default:
          return ticket.created_at ? new Date(ticket.created_at).getTime() : 0;
      }
    };
    arr.sort((a, b) => {
      const x = valueOf(a);
      const y = valueOf(b);
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * sort.dir;
      return ((x as number) - (y as number)) * sort.dir;
    });
    return arr;
  }, [tickets, sort]);

  return (
    <div className="tk-table" role="table">
      <div className="tk-row tk-head" role="row">
        <span></span>
        {cols.map((col) => (
          <button
            key={col.key}
            type="button"
            className={"tk-th" + (sort.key === col.key ? " on" : "")}
            disabled={col.nosort}
            onClick={() =>
              setSort((previous) => ({
                key: col.key,
                dir: previous.key === col.key ? ((-previous.dir) as 1 | -1) : 1,
              }))
            }
          >
            {col.label}
            {sort.key === col.key && (
              <MIcon name={sort.dir === 1 ? "arrow_upward" : "arrow_downward"} size={13} />
            )}
          </button>
        ))}
      </div>
      {sorted.map((ticket) => (
        <div key={ticket.id} className="tk-row" role="row" onClick={() => onOpen(ticket)}>
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
          <span className="dim tk-date">{fmtDate(ticket.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Kanban ---------- */
export function TicketKanbanView({
  tickets,
  onOpen,
  onStatusChange,
}: {
  tickets: OptimisticTicket[];
  onOpen: OpenTicket;
  onStatusChange: (ticketId: string, status: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  return (
    <div className="kanban">
      {STATUS_ORDER.map((status) => {
        const column = tickets.filter((ticket) => (ticket.status || "").toUpperCase() === status);
        return (
          <div
            key={status}
            className={"kb-col" + (overCol === status ? " over" : "")}
            onDragOver={(event) => {
              event.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(event) => {
              event.preventDefault();
              setOverCol(null);
              if (dragId != null) onStatusChange(dragId, status);
              setDragId(null);
            }}
          >
            <div className="kb-head">
              <span className={"status-badge " + statusUi(status).cls}>
                <MIcon name={statusUi(status).icon} size={15} fill={status === "CLOSED" ? 1 : 0} weight={500} />
                {statusUi(status).label}
              </span>
              <span className="kb-count">{column.length}</span>
            </div>
            <div className="kb-cards">
              {column.map((ticket) => (
                <div
                  key={ticket.id}
                  className="kb-card"
                  draggable
                  onDragStart={() => setDragId(ticket.id)}
                  onClick={() => onOpen(ticket)}
                >
                  <div className="kb-card-top">
                    <span className="tk-num">{shortTicketNo(ticket)}</span>
                    <PriorityCell priority={ticket.ticket_priorities?.name} plain />
                  </div>
                  <div className="kb-card-title">{ticket.title}</div>
                  <div className="kb-card-foot">
                    <span className="chip chip-soft">{ticket.ticket_categories?.name || "Uncategorised"}</span>
                    <AvatarStack names={[ticket.assignee?.name]} size={22} max={2} />
                  </div>
                </div>
              ))}
              {column.length === 0 && <div className="kb-empty">Drop tickets here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Grid ---------- */
export function TicketGridView({
  tickets,
  onOpen,
}: {
  tickets: OptimisticTicket[];
  onOpen: OpenTicket;
}) {
  const PER = 9;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(tickets.length / PER));
  const current = Math.min(page, pages - 1);
  const slice = tickets.slice(current * PER, current * PER + PER);
  return (
    <div>
      <div className="grid-cards">
        {slice.map((ticket) => (
          <div key={ticket.id} className="g-card" onClick={() => onOpen(ticket)}>
            <div className="g-top">
              <span className="tk-num">{shortTicketNo(ticket)}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="g-title">{ticket.title}</div>
            <div className="g-desc">{ticket.description}</div>
            <div className="g-meta">
              {(ticket.siteId || ticket.site) && (
                <span className="chip chip-soft">
                  <MIcon name="location_on" size={12} /> {ticket.siteId || ticket.site}
                </span>
              )}
              <span className="chip chip-soft">{ticket.ticket_categories?.name || "Uncategorised"}</span>
            </div>
            <div className="g-foot">
              <PriorityCell priority={ticket.ticket_priorities?.name} />
              <AvatarStack names={[ticket.assignee?.name]} size={24} max={3} />
            </div>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="pager">
          <button type="button" className="pg-btn" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <MIcon name="chevron_left" size={16} />
          </button>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              className={"pg-btn" + (index === current ? " on" : "")}
              onClick={() => setPage(index)}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            className="pg-btn"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <MIcon name="chevron_right" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
