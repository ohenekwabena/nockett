"use client";
import { capitalizeString } from "@/utils/functions";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { FlagIcon } from "lucide-react";
import TicketModal from "../modals/ticket-details-modal";
import PersonEntityAvatar from "../person-entity-avatar";
import { useState } from "react";


interface TicketCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ticket: any; // Update to handle the joined data structure
    onTicketUpdated: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateTicketWithOptimism?: (ticketId: string, updates: any, serverUpdates: any) => Promise<void>;
    deleteTicketWithOptimism?: (ticketId: string) => Promise<void>;
}

const statusColors = {
    OPEN: " bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    IN_PROGRESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export default function TicketCard({ ticket, onTicketUpdated, updateTicketWithOptimism, deleteTicketWithOptimism }: TicketCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Extract the related data from the joined query - handle both array and object formats
    const priority = Array.isArray(ticket.ticket_priorities)
        ? ticket.ticket_priorities[0]?.name || ""
        : ticket.ticket_priorities?.name || "";

    const category = Array.isArray(ticket.ticket_categories)
        ? ticket.ticket_categories[0]?.name || ""
        : ticket.ticket_categories?.name || "";

    const assignee = Array.isArray(ticket.assignee)
        ? ticket.assignee[0] || null
        : ticket.assignee || null;

    const creator = Array.isArray(ticket.users)
        ? ticket.users[0] || null
        : ticket.users || null;

    const handleClick = (e: React.MouseEvent) => {
        // Prevent modal from opening when dragging
        if (e.defaultPrevented) {
            return;
        }
        setIsModalOpen(!isModalOpen);
    };

    const getStatusColor = (status: string) => {
        return statusColors[status as keyof typeof statusColors] || statusColors.OPEN;
    };

    const shouldShowHighPriorityFlag = priority?.toUpperCase() === "HIGH";

    return (
        <>
            <Card onClick={handleClick} className="w-full cursor-pointer bg-white dark:bg-gray-800 drop-shadow-xl transition-drop-shadow drop-shadow-gray-200 dark:drop-shadow-gray-900 rounded-2xl hover:scale-[1.01] transition-all will-change-transform transform-gpu border border-transparent flex flex-col h-full">
                <CardHeader className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex-row items-start justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                            #{ticket.id?.slice(-8) || 'N/A'}
                        </span>
                        <span>{ticket.title}</span>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(ticket.status)} text-nowrap inline-block min-w-fit`} style={{ textWrap: "nowrap", minWidth: "fit-content" }} variant="secondary">
                        {capitalizeString(ticket.status || "")}
                    </Badge>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-base">
                        {ticket.description || "No description provided"}
                    </p>
                </CardContent>
                <CardFooter className="mt-auto">
                    <TooltipProvider>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <div>
                                    <PersonEntityAvatar
                                        name={assignee?.name}
                                        type="assignee"
                                        className="cursor-pointer"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-gray-100 *:text-sm">
                                {assignee?.name || 'Unassigned'}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                {shouldShowHighPriorityFlag && (
                                    <FlagIcon className="ml-auto text-red-600 dark:text-red-500" size={20} />
                                )}
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-gray-100 *:text-sm">
                                High Priority
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </Card>
            <TicketModal
                ticket={{
                    ...ticket,
                    status: ticket.status as "OPEN" | "IN_PROGRESS" | "CLOSED",
                    description: ticket.description || "",
                    priority: (priority?.toUpperCase() as "HIGH" | "LOW" | "MEDIUM" | undefined),
                    category: category?.toUpperCase(),
                    assignee: assignee ? { id: assignee.id.toString(), name: assignee.name } : undefined,
                    creator: creator ? { id: creator.id, name: creator.name } : undefined,
                    createdAt: ticket.created_at ? new Date(ticket.created_at) : undefined,
                    updatedAt: ticket.updated_at ? new Date(ticket.updated_at) : undefined,
                }}
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onTicketUpdated={onTicketUpdated}
                updateTicketWithOptimism={updateTicketWithOptimism}
                deleteTicketWithOptimism={deleteTicketWithOptimism}
            />
        </>
    );
}