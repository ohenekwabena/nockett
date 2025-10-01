"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { capitalizeString } from "@/utils/functions";
import PersonEntityAvatar from "@/components/person-entity-avatar";
import TicketModal from "@/components/modals/ticket-details-modal";
import { ChevronUp, ChevronDown, FlagIcon } from "lucide-react";

interface TicketListTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tickets: any[];
    onTicketUpdated: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
    deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

type SortField = 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'created_at';
type SortDirection = 'asc' | 'desc';

const statusColors = {
    OPEN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function TicketListTable({
    tickets,
    onTicketUpdated,
    updateTicketWithOptimism,
    deleteTicketWithOptimism
}: TicketListTableProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'id':
                aValue = a.id;
                bValue = b.id;
                break;
            case 'title':
                aValue = a.title || '';
                bValue = b.title || '';
                break;
            case 'status':
                aValue = a.status || '';
                bValue = b.status || '';
                break;
            case 'priority':
                const aPriority = Array.isArray(a.ticket_priorities) ? a.ticket_priorities[0]?.name : a.ticket_priorities?.name;
                const bPriority = Array.isArray(b.ticket_priorities) ? b.ticket_priorities[0]?.name : b.ticket_priorities?.name;
                aValue = aPriority || '';
                bValue = bPriority || '';
                break;
            case 'assignee':
                const aAssignee = Array.isArray(a.assignee) ? a.assignee[0]?.name : a.assignee?.name;
                const bAssignee = Array.isArray(b.assignee) ? b.assignee[0]?.name : b.assignee?.name;
                aValue = aAssignee || '';
                bValue = bAssignee || '';
                break;
            case 'created_at':
                aValue = new Date(a.created_at || 0).getTime();
                bValue = new Date(b.created_at || 0).getTime();
                break;
            default:
                aValue = '';
                bValue = '';
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTicketClick = (ticket: any) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        return statusColors[status as keyof typeof statusColors] || statusColors.OPEN;
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('id')}
                                >
                                    <div className="flex items-center gap-1">
                                        ID
                                        <SortIcon field="id" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-1">
                                        Title
                                        <SortIcon field="title" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('priority')}
                                >
                                    <div className="flex items-center gap-1">
                                        Priority
                                        <SortIcon field="priority" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('assignee')}
                                >
                                    <div className="flex items-center gap-1">
                                        Assignee
                                        <SortIcon field="assignee" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        Created
                                        <SortIcon field="created_at" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTickets.map((ticket) => {
                                const priority = Array.isArray(ticket.ticket_priorities)
                                    ? ticket.ticket_priorities[0]?.name || ""
                                    : ticket.ticket_priorities?.name || "";

                                const assignee = Array.isArray(ticket.assignee)
                                    ? ticket.assignee[0] || null
                                    : ticket.assignee || null;

                                const shouldShowHighPriorityFlag = priority?.toUpperCase() === "HIGH";

                                return (
                                    <tr
                                        key={ticket.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            #{ticket.id?.slice(-8) || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate max-w-xs">{ticket.title}</span>
                                                {shouldShowHighPriorityFlag && (
                                                    <FlagIcon className="text-red-600 dark:text-red-500 flex-shrink-0" size={16} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge className={`${getStatusColor(ticket.status)} text-xs`} variant="secondary">
                                                {capitalizeString(ticket.status || "")}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {capitalizeString(priority || "None")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <PersonEntityAvatar
                                                        name={assignee.name}
                                                        type="assignee"
                                                        className="w-6 h-6"
                                                    />
                                                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                                        {assignee.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {tickets.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">No tickets found</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">
                            Click the &quot;Add New&quot; button in the top right to create your first ticket
                        </p>
                    </div>
                )}
            </div>

            {selectedTicket && (
                <TicketModal
                    ticket={{
                        ...selectedTicket,
                        status: selectedTicket.status as "OPEN" | "IN_PROGRESS" | "CLOSED",
                        description: selectedTicket.description || "",
                        priority: (Array.isArray(selectedTicket.ticket_priorities)
                            ? selectedTicket.ticket_priorities[0]?.name?.toUpperCase()
                            : selectedTicket.ticket_priorities?.name?.toUpperCase()) as "HIGH" | "LOW" | "MEDIUM" | undefined,
                        category: (Array.isArray(selectedTicket.ticket_categories)
                            ? selectedTicket.ticket_categories[0]?.name?.toUpperCase()
                            : selectedTicket.ticket_categories?.name?.toUpperCase()),
                        assignee: (() => {
                            const assignee = Array.isArray(selectedTicket.assignee)
                                ? selectedTicket.assignee[0]
                                : selectedTicket.assignee;
                            return assignee ? { id: assignee.id.toString(), name: assignee.name } : undefined;
                        })(),
                        creator: (() => {
                            const creator = Array.isArray(selectedTicket.users)
                                ? selectedTicket.users[0]
                                : selectedTicket.users;
                            return creator ? { id: creator.id, name: creator.name } : undefined;
                        })(),
                        createdAt: selectedTicket.created_at ? new Date(selectedTicket.created_at) : undefined,
                        updatedAt: selectedTicket.updated_at ? new Date(selectedTicket.updated_at) : undefined,
                    }}
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onTicketUpdated={onTicketUpdated}
                    updateTicketWithOptimism={updateTicketWithOptimism}
                    deleteTicketWithOptimism={deleteTicketWithOptimism}
                />
            )}
        </>
    );
}
