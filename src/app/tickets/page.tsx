"use client";

import { useState, useEffect } from "react";
import TicketCard from "@/components/ui/new-ticket-card";
import { ticketService, type Ticket } from "@/services/ticket-service";
import { TicketsPageSkeleton } from "@/components/skeletons/tickets-page-skeleton";

export default function TicketsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const ticketsPerPage = 10;

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
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await ticketService.getTicketsWithDetails();
            if (error) {
                setError(error.message);
            } else {
                setTickets(data || []);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(tickets.length / ticketsPerPage);
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    const currentTickets = tickets.slice(startIndex, endIndex);

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
                <p className="text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, tickets.length)} of{" "}
                    {tickets.length} tickets
                </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-8">
                {currentTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onTicketUpdated={loadTickets} />
                ))}
            </div>

            {tickets.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Click the &quot;Add New&quot; button in the top right to create your first ticket
                    </p>
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