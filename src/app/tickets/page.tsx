"use client";

import { useState } from "react";
import { DUMMY_TICKETS } from "@/utils/constants";
import TicketCard from "@/components/ui/new-ticket-card";

export default function TicketsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const totalPages = Math.ceil(DUMMY_TICKETS.length / ticketsPerPage);
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    const currentTickets = DUMMY_TICKETS.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="pr-6 mt-10">
            <div className="mb-8">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2" style={{
                    fontSize: "clamp(1.5rem, 12vw - 3.7rem, 3.75rem)"
                }}>
                    Tickets
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, DUMMY_TICKETS.length)} of{" "}
                    {DUMMY_TICKETS.length} tickets
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentTickets.map((ticket) => (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <TicketCard key={ticket.id} ticket={ticket as any} />
                ))}
            </div>

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

