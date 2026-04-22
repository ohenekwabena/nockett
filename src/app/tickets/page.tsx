"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import TicketCard from "@/components/cards/ticket-card";
import { TicketsPageSkeleton } from "@/components/skeletons/tickets-page-skeleton";
import SearchBar from "@/components/search-bar";
import FilterPopup from "@/components/filter-popup";
import { useOptimisticTickets } from "@/hooks/use-optimistic-tickets";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TicketKanban } from "@/components/kanban/ticket-kanban";
import TicketListTable from "@/components/ticket-list/ticket-list-table";
import { Kanban, LayoutGrid, List, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ticketService } from "@/services/ticket-service";
import { ExportService } from "@/lib/export-service";
import { toast } from "sonner";

export default function TicketsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("grid");
  const [filters, setFilters] = useState({
    statuses: [] as string[],
    categories: [] as string[],
    priorities: [] as string[],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [strictImportMode, setStrictImportMode] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const ticketsPerPage = 10;

  const { tickets, loading, error, loadTickets, updateTicketWithOptimism, deleteTicketWithOptimism } =
    useOptimisticTickets();

  useEffect(() => {
    loadTickets();

    // Listen for ticket creation events from the layout wrapper
    const handleTicketCreated = () => {
      loadTickets();
    };

    window.addEventListener("ticketCreated", handleTicketCreated);

    return () => {
      window.removeEventListener("ticketCreated", handleTicketCreated);
    };
  }, [loadTickets]);

  // Update filtered tickets when tickets or filters change
  useEffect(() => {
    filterTicketsLocally(searchTerm, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, searchTerm, filters]);

  // Reset to first page when search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTickets]);

  const filterTicketsLocally = (term: string, currentFilters = filters) => {
    let filtered = tickets;

    // Apply search term filter
    if (term.trim()) {
      const searchLower = term.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((ticket: any) => {
        // Search in basic ticket fields
        const matchesBasic =
          ticket.id?.toLowerCase().includes(searchLower) ||
          ticket.ticket_id?.toLowerCase().includes(searchLower) ||
          ticket.title?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.status?.toLowerCase().includes(searchLower) ||
          ticket.site?.toLowerCase().includes(searchLower) ||
          ticket.system?.toLowerCase().includes(searchLower) ||
          ticket.error_code?.toLowerCase().includes(searchLower) ||
          ticket.ticket_number?.toLowerCase().includes(searchLower);

        // Search in category
        const categoryName = Array.isArray(ticket.ticket_categories)
          ? ticket.ticket_categories[0]?.name
          : ticket.ticket_categories?.name;
        const matchesCategory = categoryName?.toLowerCase().includes(searchLower);

        // Search in priority
        const priorityName = Array.isArray(ticket.ticket_priorities)
          ? ticket.ticket_priorities[0]?.name
          : ticket.ticket_priorities?.name;
        const matchesPriority = priorityName?.toLowerCase().includes(searchLower);

        // Search in assignee
        const assigneeName = Array.isArray(ticket.assignee) ? ticket.assignee[0]?.name : ticket.assignee?.name;
        const matchesAssignee = assigneeName?.toLowerCase().includes(searchLower);

        // Search in creator
        const creatorData = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users;
        const matchesCreator =
          creatorData?.name?.toLowerCase().includes(searchLower) ||
          creatorData?.email?.toLowerCase().includes(searchLower);

        return matchesBasic || matchesCategory || matchesPriority || matchesAssignee || matchesCreator;
      });
    }

    // Apply status filter
    if (currentFilters.statuses.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((ticket: any) => currentFilters.statuses.includes(ticket.status));
    }

    // Apply category filter
    if (currentFilters.categories.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((ticket: any) => {
        const categoryName = Array.isArray(ticket.ticket_categories)
          ? ticket.ticket_categories[0]?.name?.toUpperCase()
          : ticket.ticket_categories?.name?.toUpperCase();
        return categoryName && currentFilters.categories.includes(categoryName);
      });
    }

    // Apply priority filter
    if (currentFilters.priorities.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((ticket: any) => {
        const priorityName = Array.isArray(ticket.ticket_priorities)
          ? ticket.ticket_priorities[0]?.name?.toUpperCase()
          : ticket.ticket_priorities?.name?.toUpperCase();
        return priorityName && currentFilters.priorities.includes(priorityName);
      });
    }

    setFilteredTickets(filtered);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing export...");
      const { data: enrichedData, error } = await ticketService.getTicketsForExport();

      if (error || !enrichedData) {
        toast.error("Failed to fetch tickets for export");
        setIsExporting(false);
        return;
      }

      // Transform enriched data to match export format
      const exportData = enrichedData.map((item: any) => ({
        ticket: item.ticket,
        assigneeName: item.assigneeName,
        categoryName: item.categoryName,
        priorityName: item.priorityName,
        creatorName: item.creatorName,
        notes: item.notes,
      }));

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `tickets_export_${timestamp}.xlsx`;

      await ExportService.exportTicketsToExcel(exportData, filename);
      toast.success(`Exported ${exportData.length} tickets successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export tickets");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTicketUpdated = () => {
    // For kanban view, don't trigger re-filter immediately to avoid conflicts with optimistic updates
    if (activeTab === "kanban") {
      // Only reload tickets from server without re-filtering to maintain optimistic updates
      loadTickets();
    } else {
      // For other views, trigger a re-filter to update search results
      filterTicketsLocally(searchTerm);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
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
    if (!file) {
      return;
    }

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

    const loadingToastId = toast.loading("Importing tickets from Excel...");
    setIsImporting(true);

    try {
      const result = await ExportService.importTicketsFromExcel(file, { strictMode: strictImportMode });
      await loadTickets();

      if (result.aborted) {
        const failedPreview = result.failedRows
          .slice(0, 3)
          .map((failedRow) => `Row ${failedRow.rowNumber}: ${failedRow.reason}`)
          .join(" | ");
        toast.error(
          `Import aborted in strict mode. ${result.failedRows.length} rows failed validation. ${failedPreview}`,
          { id: loadingToastId },
        );
      } else if (result.createdCount === 0 && result.failedRows.length > 0) {
        toast.error(`No tickets were imported. ${result.failedRows.length} rows failed.`, {
          id: loadingToastId,
        });
      } else if (result.failedRows.length > 0) {
        const failedPreview = result.failedRows
          .slice(0, 3)
          .map((failedRow) => `Row ${failedRow.rowNumber}: ${failedRow.reason}`)
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

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const endIndex = startIndex + ticketsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const hasActiveFilters =
    filters.statuses.length > 0 || filters.categories.length > 0 || filters.priorities.length > 0;

  if (loading) {
    return <TicketsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="pr-6 mt-10 flex justify-center items-center h-64">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="pr-6 mt-10">
      <div className="mb-8">
        <h1
          className="text-6xl font-bold text-gray-900 dark:text-white mb-2"
          style={{
            fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)",
          }}
        >
          Tickets
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {searchTerm ? (
            <>
              Showing{" "}
              {activeTab === "grid" ? `${startIndex + 1}-${Math.min(endIndex, filteredTickets.length)} of ` : ""}{" "}
              {filteredTickets.length} tickets matching &ldquo;{searchTerm}&ldquo;
              {filteredTickets.length !== tickets.length && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  (filtered from {tickets.length} total)
                </span>
              )}
            </>
          ) : (
            <>
              {activeTab === "grid"
                ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredTickets.length)} of `
                : "Total "}{" "}
              {filteredTickets.length} tickets
            </>
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 flex flex-col lg:flex-row justify-center lg:justify-between items-start lg:items-center w-full gap-4">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex min-w-max h-auto">
              <TabsTrigger
                value="grid"
                className="flex items-center gap-2 py-2 cursor-pointer  text-gray-800 dark:text-gray-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-100"
              >
                <LayoutGrid className="w-4 h-4 -translate-y-0.5" />
                Grid
              </TabsTrigger>
              <TabsTrigger
                value="kanban"
                className="flex items-center gap-2 py-2 cursor-pointer text-gray-800 dark:text-gray-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-100"
              >
                <Kanban className="w-4 h-4 -translate-y-0.5" />
                Kanban
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex items-center gap-2 py-2 cursor-pointer  text-gray-800 dark:text-gray-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-100"
              >
                <List className="w-4 h-4 -translate-y-0.5" />
                List
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex justify-center items-center flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search by ticket ID, title, description, assignee, creator, status..."
                className="w-full sm:w-[480px]"
                isLoading={false}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                onClick={handleDownloadImportTemplate}
                disabled={isDownloadingTemplate || isImporting || isExporting}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-500 disabled:cursor-not-allowed text-white"
                title="Download Excel import template"
              >
                {isDownloadingTemplate ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Template
                  </>
                )}
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleImportFromExcel}
              />
              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed text-white"
                title="Import tickets from Excel"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={isExporting || isImporting || isDownloadingTemplate}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-500 disabled:cursor-not-allowed text-white"
                title="Export tickets to Excel"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export
                  </>
                )}
              </Button>
              <FilterPopup onFiltersChange={handleFiltersChange} initialFilters={filters} />
            </div>
          </div>
        </div>

        <TabsContent value="grid" className="space-y-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-8">
            {currentTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onTicketUpdated={handleTicketUpdated}
                updateTicketWithOptimism={updateTicketWithOptimism}
                deleteTicketWithOptimism={deleteTicketWithOptimism}
              />
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              {searchTerm || hasActiveFilters ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No tickets found matching your search{hasActiveFilters ? " and filters" : ""}
                    {searchTerm && <> for &ldquo;{searchTerm}&ldquo;</>}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Try adjusting your search terms{hasActiveFilters ? " or filters" : ""} to see more results
                  </p>
                  <div className="flex gap-2 justify-center">
                    {searchTerm && (
                      <button
                        onClick={() => handleSearch("")}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={() => handleFiltersChange({ statuses: [], categories: [], priorities: [] })}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Click the &quot;Add New&quot; button in the top right to create your first ticket
                  </p>
                </>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || hasActiveFilters ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No tickets found matching your search{hasActiveFilters ? " and filters" : ""}
                    {searchTerm && <> for &ldquo;{searchTerm}&ldquo;</>}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Try adjusting your search terms{hasActiveFilters ? " or filters" : ""} to see more results
                  </p>
                  <div className="flex gap-2 justify-center">
                    {searchTerm && (
                      <button
                        onClick={() => handleSearch("")}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={() => handleFiltersChange({ statuses: [], categories: [], priorities: [] })}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Click the &quot;Add New&quot; button in the top right to create your first ticket
                  </p>
                </>
              )}
            </div>
          ) : (
            <TicketKanban
              tickets={filteredTickets}
              onTicketUpdated={handleTicketUpdated}
              updateTicketWithOptimism={updateTicketWithOptimism}
              deleteTicketWithOptimism={deleteTicketWithOptimism}
            />
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || hasActiveFilters ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No tickets found matching your search{hasActiveFilters ? " and filters" : ""}
                    {searchTerm && <> for &ldquo;{searchTerm}&ldquo;</>}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Try adjusting your search terms{hasActiveFilters ? " or filters" : ""} to see more results
                  </p>
                  <div className="flex gap-2 justify-center">
                    {searchTerm && (
                      <button
                        onClick={() => handleSearch("")}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={() => handleFiltersChange({ statuses: [], categories: [], priorities: [] })}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Click the &quot;Add New&quot; button in the top right to create your first ticket
                  </p>
                </>
              )}
            </div>
          ) : (
            <TicketListTable
              tickets={filteredTickets}
              onTicketUpdated={handleTicketUpdated}
              updateTicketWithOptimism={updateTicketWithOptimism}
              deleteTicketWithOptimism={deleteTicketWithOptimism}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
