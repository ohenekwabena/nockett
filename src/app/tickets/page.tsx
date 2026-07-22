"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useOptimisticTickets, type OptimisticTicket } from "@/hooks/use-optimistic-tickets";
import { ticketService } from "@/services/ticket-service";
import { ExportService } from "@/lib/export-service";
import {
  Btn,
  Chip,
  EmptyState,
  Loading,
  MIcon,
  Popover,
  SegTabs,
  STATUS_ORDER,
  statusUi,
  useNkShell,
  usePersistentState,
} from "@/components/nk/ui";
import { TicketGridView, TicketKanbanView, TicketListView } from "@/components/tickets/ticket-views";

interface Filters {
  status: string[];
  category: string[];
  priority: string[];
}

const NO_FILTERS: Filters = { status: [], category: [], priority: [] };

function ticketMatches(ticket: OptimisticTicket, query: string): boolean {
  if (!query.trim()) return true;
  const hay = [
    ticket.id,
    ticket.ticket_id,
    ticket.title,
    ticket.description,
    ticket.status,
    ticket.site,
    ticket.siteId,
    ticket.linkName,
    ticket.serviceType,
    ticket.detectionSource,
    ticket.system,
    ticket.error_code,
    ticket.ticket_number,
    ticket.ticket_categories?.name,
    ticket.ticket_priorities?.name,
    ticket.assignee?.name,
    ticket.users?.name,
    ticket.users?.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}

export default function TicketsPage() {
  const { search, setSearch, openTicket } = useNkShell();
  const { tickets, loading, error, loadTickets, updateTicketWithOptimism, deleteTicketWithOptimism } =
    useOptimisticTickets();

  const [view, setView] = usePersistentState<"list" | "kanban" | "grid">("nk-view", "list");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  // Deep-link target from an email "View ticket" link (/tickets?ticket=<id>).
  const [deepLinkKey, setDeepLinkKey] = useState<string | null>(null);
  // Priority deep-link from a dashboard KPI card, held until the priority
  // options load so it can resolve to the exact stored option name.
  const [pendingPriority, setPendingPriority] = useState<string | null>(null);
  const filterBtn = useRef<HTMLSpanElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTickets();
    const handleTicketCreated = () => loadTickets();
    window.addEventListener("ticketCreated", handleTicketCreated);
    return () => window.removeEventListener("ticketCreated", handleTicketCreated);
  }, [loadTickets]);

  useEffect(() => {
    Promise.all([ticketService.getTicketCategories(), ticketService.getTicketPriorities()])
      .then(([categories, priorities]) => {
        setCategoryOptions(categories.map((item) => item.name));
        setPriorityOptions(priorities.map((item) => item.name));
      })
      .catch((err) => console.error("Error loading filter options:", err));
  }, []);

  // Deep link: capture ?ticket=<id> on mount; resolved once the list is loaded.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("ticket");
    if (key) setDeepLinkKey(key);
  }, []);

  // Filter deep-link from a dashboard KPI card (/tickets?status=OPEN,
  // ?priority=HIGH). Apply status immediately (fixed enum); defer priority until
  // its options load. Strip the params so a refresh/back doesn't re-apply them.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    const priorityParam = params.get("priority");
    if (!statusParam && !priorityParam) return;

    const status = (statusParam || "").toUpperCase();
    if (STATUS_ORDER.includes(status as (typeof STATUS_ORDER)[number])) {
      setFilters((previous) => ({ ...previous, status: [status] }));
    }
    if (priorityParam) setPendingPriority(priorityParam);

    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    url.searchParams.delete("priority");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  // Resolve a pending priority deep-link case-insensitively against the loaded
  // option names, so the KPI card's ?priority=HIGH matches however the priority
  // is actually stored ("High", "HIGH", …).
  useEffect(() => {
    if (!pendingPriority || priorityOptions.length === 0) return;
    // Canonicalise against the loaded names; fall back to the raw value so an
    // unknown priority filters to an empty result rather than to all tickets.
    const match = priorityOptions.find((name) => name.toLowerCase() === pendingPriority.toLowerCase()) ?? pendingPriority;
    setFilters((previous) =>
      previous.priority.includes(match) ? previous : { ...previous, priority: [...previous.priority, match] },
    );
    setPendingPriority(null);
  }, [pendingPriority, priorityOptions]);

  const panelApi = useMemo(
    () => ({ update: updateTicketWithOptimism, remove: deleteTicketWithOptimism }),
    [updateTicketWithOptimism, deleteTicketWithOptimism],
  );

  useEffect(() => {
    if (!deepLinkKey || tickets.length === 0) return;
    const lower = deepLinkKey.toLowerCase();
    const match = tickets.find(
      (ticket) => ticket.ticket_id?.toLowerCase() === lower || ticket.id?.toLowerCase() === lower,
    );
    if (match) {
      openTicket(match, panelApi);
    } else {
      toast.error(`Ticket "${deepLinkKey}" was not found.`);
    }
    setDeepLinkKey(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("ticket");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkKey, tickets]);

  const filtered = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticketMatches(ticket, search) &&
          (filters.status.length === 0 || filters.status.includes((ticket.status || "").toUpperCase())) &&
          (filters.category.length === 0 ||
            (ticket.ticket_categories?.name && filters.category.includes(ticket.ticket_categories.name))) &&
          (filters.priority.length === 0 ||
            (ticket.ticket_priorities?.name && filters.priority.includes(ticket.ticket_priorities.name))),
      ),
    [tickets, search, filters],
  );

  const nFilters = filters.status.length + filters.category.length + filters.priority.length;

  const toggleFilter = (key: keyof Filters, value: string) =>
    setFilters((previous) => ({
      ...previous,
      [key]: previous[key].includes(value)
        ? previous[key].filter((item) => item !== value)
        : [...previous[key], value],
    }));

  const activeChips: Array<{ key: keyof Filters; value: string; label: string }> = [];
  (Object.keys(filters) as Array<keyof Filters>).forEach((key) =>
    filters[key].forEach((value) =>
      activeChips.push({ key, value, label: key === "status" ? statusUi(value).label : value }),
    ),
  );

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      // The read seam returns the rows and throws on failure (ADR-0002).
      const enrichedData = await ticketService.getTicketsForExport();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exportData = enrichedData.map((item: any) => ({
        ticket: item.ticket,
        assigneeName: item.assigneeName,
        categoryName: item.categoryName,
        priorityName: item.priorityName,
        creatorName: item.creatorName,
        notes: item.notes,
      }));
      const timestamp = new Date().toISOString().split("T")[0];
      await ExportService.exportTicketsToExcel(exportData, `tickets_export_${timestamp}.xlsx`);
      toast.success(`Exported ${exportData.length} tickets successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export tickets");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await ExportService.downloadImportTemplate();
      toast.success("Import template downloaded");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to download import template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImportFromExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcelFile =
      file.type === "application/vnd.ms-excel" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.toLowerCase().endsWith(".xls") ||
      file.name.toLowerCase().endsWith(".xlsx");
    if (!isExcelFile) {
      toast.error("Please upload a valid Excel file (.xls or .xlsx)");
      event.target.value = "";
      return;
    }

    const loadingToastId = toast.loading("Importing tickets from Excel…");
    setIsImporting(true);
    try {
      const result = await ExportService.importTicketsFromExcel(file, { strictMode: false });
      await loadTickets();

      if (result.aborted) {
        const failedPreview = result.failedRows
          .slice(0, 3)
          .map((failedRow: { rowNumber: number; reason: string }) => `Row ${failedRow.rowNumber}: ${failedRow.reason}`)
          .join(" | ");
        toast.error(
          `Import aborted in strict mode. ${result.failedRows.length} rows failed validation. ${failedPreview}`,
          { id: loadingToastId },
        );
      } else if (result.createdCount === 0 && result.failedRows.length > 0) {
        toast.error(`No tickets were imported. ${result.failedRows.length} rows failed.`, { id: loadingToastId });
      } else if (result.failedRows.length > 0) {
        const failedPreview = result.failedRows
          .slice(0, 3)
          .map((failedRow: { rowNumber: number; reason: string }) => `Row ${failedRow.rowNumber}: ${failedRow.reason}`)
          .join(" | ");
        toast.warning(
          `Imported ${result.createdCount} of ${result.totalRows} rows. ${result.failedRows.length} failed. ${failedPreview}`,
          { id: loadingToastId },
        );
      } else {
        toast.success(`Imported ${result.createdCount} tickets successfully!`, { id: loadingToastId });
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import tickets from Excel", { id: loadingToastId });
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || (ticket.status || "").toUpperCase() === status) return;
    try {
      // updateTicket owns the status-change notification emails.
      await updateTicketWithOptimism(ticketId, { status }, { status });
      toast.success(`Status → ${statusUi(status).label}`);
    } catch (err) {
      console.error("Error changing status:", err);
      toast.error("Failed to change status");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Loading label="Loading tickets…" />
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

  const filterGroups: Array<{ key: keyof Filters; label: string; opts: Array<{ value: string; label: string }> }> = [
    {
      key: "status",
      label: "Status",
      opts: STATUS_ORDER.map((status) => ({ value: status, label: statusUi(status).label })),
    },
    { key: "priority", label: "Priority", opts: priorityOptions.map((name) => ({ value: name, label: name })) },
    { key: "category", label: "Category", opts: categoryOptions.map((name) => ({ value: name, label: name })) },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="confirmation_number" size={20} className="accent" fill={1} />
          <h1>Ticket queue</h1>
        </div>
        <div className="page-actions">
          <Btn
            small
            icon="download"
            disabled={isExporting || isImporting || isDownloadingTemplate}
            onClick={handleExportToExcel}
          >
            {isExporting ? "Exporting…" : "Export"}
          </Btn>
          <Btn
            small
            icon="upload"
            disabled={isImporting}
            onClick={() => importInputRef.current?.click()}
            title="Import tickets from Excel"
          >
            {isImporting ? "Importing…" : "Import"}
          </Btn>
          <Btn
            small
            icon="table_view"
            disabled={isDownloadingTemplate || isImporting}
            onClick={handleDownloadImportTemplate}
            title="Download the Excel import template"
          >
            Template
          </Btn>
          <input
            ref={importInputRef}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{ display: "none" }}
            onChange={handleImportFromExcel}
          />
          <span style={{ position: "relative" }}>
            <span ref={filterBtn}>
              <Btn small icon="filter_list" onClick={() => setFilterOpen(!filterOpen)}>
                Filter{nFilters > 0 && <span className="seg-count on">{nFilters}</span>}
              </Btn>
            </span>
            <Popover open={filterOpen} onClose={() => setFilterOpen(false)} anchor={filterBtn} align="right" width={252}>
              {filterGroups.map((group) => (
                <div key={group.key} className="pop-group">
                  <div className="pop-label">{group.label}</div>
                  {group.opts.map((option) => (
                    <label key={option.value} className="pop-check">
                      <input
                        type="checkbox"
                        checked={filters[group.key].includes(option.value)}
                        onChange={() => toggleFilter(group.key, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </Popover>
          </span>
        </div>
      </div>

      <div className="view-row">
        <SegTabs
          value={view}
          onChange={(id) => setView(id as typeof view)}
          tabs={[
            { id: "list", label: "List", icon: "table_rows", count: filtered.length },
            { id: "kanban", label: "Kanban", icon: "view_kanban" },
            { id: "grid", label: "Grid", icon: "grid_view" },
          ]}
        />
        {activeChips.length > 0 && (
          <div className="chip-row">
            {activeChips.map(({ key, value, label }) => (
              <Chip key={key + value} onRemove={() => toggleFilter(key, value)}>
                <span className="dim">{key}:</span> {label}
              </Chip>
            ))}
            <button type="button" className="link-btn" onClick={() => setFilters(NO_FILTERS)}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        tickets.length === 0 ? (
          <EmptyState
            icon="confirmation_number"
            title="No tickets yet"
            body="Raise the first ticket when an incident lands."
          />
        ) : (
          <EmptyState
            icon="search_off"
            title="Nothing matches"
            body="No tickets match your search or filters."
            action={
              <Btn
                small
                kind="primary"
                onClick={() => {
                  setSearch("");
                  setFilters(NO_FILTERS);
                }}
              >
                Clear search & filters
              </Btn>
            }
          />
        )
      ) : view === "list" ? (
        <TicketListView tickets={filtered} onOpen={(ticket) => openTicket(ticket, panelApi)} />
      ) : view === "kanban" ? (
        <TicketKanbanView
          tickets={filtered}
          onOpen={(ticket) => openTicket(ticket, panelApi)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TicketGridView tickets={filtered} onOpen={(ticket) => openTicket(ticket, panelApi)} />
      )}
    </div>
  );
}
