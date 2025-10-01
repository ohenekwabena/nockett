"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { capitalizeString } from "@/utils/functions";
import PersonEntityAvatar from "@/components/person-entity-avatar";
import TicketModal from "@/components/modals/ticket-details-modal";
import { ChevronUp, ChevronDown, FlagIcon, Calendar, User, AlertCircle } from "lucide-react";
import { STATUS_COLORS } from "@/utils/constants";

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
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DEFAULT;
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />;
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        Tickets Overview
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            {tickets.length}
                        </Badge>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                            <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group"
                                    onClick={() => handleSort('id')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        ID
                                        <SortIcon field="id" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        Title
                                        <SortIcon field="title" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group" align="center"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group"
                                    onClick={() => handleSort('priority')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        Priority
                                        <SortIcon field="priority" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group"
                                    onClick={() => handleSort('assignee')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        Assignee
                                        <SortIcon field="assignee" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-colors group"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                                        Created
                                        <SortIcon field="created_at" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800/50">
                            {sortedTickets.map((ticket, index) => {
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
                                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/10 cursor-pointer transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-blue-400"
                                        onClick={() => handleTicketClick(ticket)}
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                                                    #{ticket.id?.slice(-8) || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {ticket.title}
                                                        </span>
                                                        {shouldShowHighPriorityFlag && (
                                                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                                                <FlagIcon className="text-red-500 dark:text-red-400" size={12} />
                                                                <span className="text-xs font-medium text-red-600 dark:text-red-400">HIGH</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {ticket.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
                                                            {ticket.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" align="center">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                                                ></div>
                                                <Badge
                                                    className="text-white border-0 shadow-sm"
                                                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                                                >
                                                    {capitalizeString(ticket.status || "")}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle
                                                    className={`w-4 h-4 ${priority?.toUpperCase() === 'HIGH' ? 'text-red-500' :
                                                        priority?.toUpperCase() === 'MEDIUM' ? 'text-yellow-500' :
                                                            'text-green-500'
                                                        }`}
                                                />
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {capitalizeString(priority || "None")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {assignee ? (
                                                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-2 group-hover:bg-white dark:group-hover:bg-gray-700/50 transition-colors">
                                                    <PersonEntityAvatar
                                                        name={assignee.name}
                                                        type="assignee"
                                                        className="bg-transparent"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-sm">Unassigned</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    <span className="text-xs">
                                                        {ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {tickets.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-medium">No tickets found</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">
                            Click the &quot;Add New&quot; button in the top right to create your first ticket
                        </p>
                    </div>
                )}
            </div>

            {selectedTicket && (
                <TicketModal
                    ticket={(() => {
                        // Find the current ticket from the tickets array to get updated data
                        const currentTicket = tickets.find(t => t.id === selectedTicket.id) || selectedTicket;
                        return {
                            ...currentTicket,
                            status: currentTicket.status as "OPEN" | "IN_PROGRESS" | "CLOSED",
                            description: currentTicket.description || "",
                            priority: (Array.isArray(currentTicket.ticket_priorities)
                                ? currentTicket.ticket_priorities[0]?.name?.toUpperCase()
                                : currentTicket.ticket_priorities?.name?.toUpperCase()) as "HIGH" | "LOW" | "MEDIUM" | undefined,
                            category: (Array.isArray(currentTicket.ticket_categories)
                                ? currentTicket.ticket_categories[0]?.name?.toUpperCase()
                                : currentTicket.ticket_categories?.name?.toUpperCase()),
                            assignee: (() => {
                                const assignee = Array.isArray(currentTicket.assignee)
                                    ? currentTicket.assignee[0]
                                    : currentTicket.assignee;
                                return assignee ? { id: assignee.id.toString(), name: assignee.name } : undefined;
                            })(),
                            creator: (() => {
                                const creator = Array.isArray(currentTicket.users)
                                    ? currentTicket.users[0]
                                    : currentTicket.users;
                                return creator ? { id: creator.id, name: creator.name } : undefined;
                            })(),
                            createdAt: currentTicket.created_at ? new Date(currentTicket.created_at) : undefined,
                            updatedAt: currentTicket.updated_at ? new Date(currentTicket.updated_at) : undefined,
                        };
                    })()}
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
