"use client";

import { useState, useEffect } from "react";
import TicketCard from "@/components/ui/new-ticket-card";
import { TicketsPageSkeleton } from "@/components/skeletons/tickets-page-skeleton";
import SearchBar from "@/components/search-bar";
import { useOptimisticTickets } from "@/hooks/use-optimistic-tickets";

export default function TicketsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const ticketsPerPage = 10;

    const {
        tickets,
        loading,
        error,
        loadTickets,
        updateTicketWithOptimism,
        deleteTicketWithOptimism
    } = useOptimisticTickets();

    useEffect(() => {
        loadTickets();

        // Listen for ticket creation events from the layout wrapper
        const handleTicketCreated = () => {
            loadTickets();
        };

        window.addEventListener('ticketCreated', handleTicketCreated);

        return () => {
            window.removeEventListener('ticketCreated', handleTicketCreated);
        };
    }, [loadTickets]);

    // Update filtered tickets when tickets change
    useEffect(() => {
        filterTicketsLocally(searchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickets, searchTerm]);

    // Reset to first page when search results change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredTickets]);

    const filterTicketsLocally = (term: string) => {
        if (!term.trim()) {
            setFilteredTickets(tickets);
            return;
        }

        const searchLower = term.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = tickets.filter((ticket: any) => {
            // Search in basic ticket fields
            const matchesBasic =
                ticket.id?.toLowerCase().includes(searchLower) ||
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
            const assigneeName = Array.isArray(ticket.assignee)
                ? ticket.assignee[0]?.name
                : ticket.assignee?.name;
            const matchesAssignee = assigneeName?.toLowerCase().includes(searchLower);

            // Search in creator
            const creatorData = Array.isArray(ticket.users)
                ? ticket.users[0]
                : ticket.users;
            const matchesCreator =
                creatorData?.name?.toLowerCase().includes(searchLower) ||
                creatorData?.email?.toLowerCase().includes(searchLower);

            return matchesBasic || matchesCategory || matchesPriority || matchesAssignee || matchesCreator;
        });

        setFilteredTickets(filtered);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleTicketUpdated = () => {
        // No need to reload tickets - optimistic updates handle this
        // Just trigger a re-filter to update search results
        filterTicketsLocally(searchTerm);
    };

    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    const currentTickets = filteredTickets.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

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
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2" style={{
                    fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)"
                }}>
                    Tickets
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? (
                        <>
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} of{" "}
                            {filteredTickets.length} tickets matching &ldquo;{searchTerm}&ldquo;
                            {filteredTickets.length !== tickets.length && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                    (filtered from {tickets.length} total)
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} of{" "}
                            {filteredTickets.length} tickets
                        </>
                    )}
                </p>

                <div className="mb-6 flex justify-center items-center w-full">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search by ticket ID, title, description, assignee, creator, status..."
                        className="max-w-2xl w-[480px]"
                        isLoading={false}
                    />
                </div>
            </div>

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
                    {searchTerm ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                No tickets found matching &ldquo;{searchTerm}&ldquo;
                            </p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                                Try adjusting your search terms or clearing the search to see all tickets
                            </p>
                            <button
                                onClick={() => handleSearch("")}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                            >
                                Clear search and show all tickets
                            </button>
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
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${currentPage === page
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
        </div>
    );
}