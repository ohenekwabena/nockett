"use client";
import { capitalizeString } from "@/utils/functions";
import { IconlyTicket } from "./icons/ticket";
import { useRouter } from "next/navigation";

interface TicketCardProps {
    ticket: {
        id: string;
        title: string;
        description: string;
        category: string;
        priority: string;
        status: string;
        assignee?: {
            name: string;
        };
        slaDueAt?: Date;
        createdAt: Date;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachments?: any[];
    };
}

export function TicketCard({ ticket }: TicketCardProps) {
    const router = useRouter();

    const priorityColors = {
        HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    };

    const statusColors = {
        OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            onClick={() => router.push(`/tickets/${ticket.id}`)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <IconlyTicket color="currentColor" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">#{ticket.id.slice(-8)}</span>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${priorityColors[ticket.priority as keyof typeof priorityColors] || priorityColors.LOW}`}>
                        {capitalizeString(ticket.priority)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN}`}>
                        {capitalizeString(ticket.status)}
                    </span>
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {ticket.title}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                {ticket.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {capitalizeString(ticket.category)}
                    </span>
                    {ticket.assignee && (
                        <span>Assigned to {ticket.assignee.name}</span>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    {ticket.slaDueAt && (
                        <span className="text-orange-600 dark:text-orange-400">
                            Due: {new Date(ticket.slaDueAt).toLocaleDateString()}
                        </span>
                    )}
                    <span>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        📎 {ticket.attachments.length} attachment{ticket.attachments.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}