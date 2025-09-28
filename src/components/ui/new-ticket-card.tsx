"use client";
import { capitalizeString } from "@/utils/functions";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { FlagIcon, } from "lucide-react";
import TicketModal from "../ticket-details-modal";
import { useState } from "react";


interface TicketCardProps {
    ticket: {
        title: string;
        description: string;
        category?: string;
        priority?: "LOW" | "MEDIUM" | "HIGH";
        status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
        createdAt?: Date;
        updatedAt?: Date;
        assignee?: {
            id: string | undefined;
            name: string | undefined;
            avatarUrl?: string;
        };
        slaDueAt?: Date;
        id?: string;
    };
}

// const priorityColors = {
//     LOW: "bg-green-100 text-green-800",
//     MEDIUM: "bg-yellow-100 text-yellow-800",
//     HIGH: "bg-red-100 text-red-800",
// };

const statusColors = {
    OPEN: "bg-emerald-100 text-emerald-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-gray-100 text-gray-800",
};

export default function TicketCard({ ticket }: TicketCardProps) {

    const [isModalOpen, setIsModalOpen] = useState(false);


    const handleClick = () => {
        setIsModalOpen(!isModalOpen);
    }

    return (
        <>
            <Card onClick={handleClick} className="w-full cursor-pointer bg-white dark:bg-gray-800 drop-shadow-xl  transition-drop-shadow drop-shadow-gray-200 dark:drop-shadow-gray-900  rounded-2xl hover:scale-[1.01] transition-all will-change-transform transform-gpu border border-transparent">
                <CardHeader className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex-row items-start justify-between"
                >
                    {ticket.title}
                    <div>
                        <Badge className={`ml-2 ${statusColors[ticket.status || "IN_PROGRESS"]} text-nowrap`} variant="secondary">{capitalizeString(ticket.status || "")}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-base">
                        {ticket.description}
                    </p>
                </CardContent>
                <CardFooter>
                    <TooltipProvider>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <Avatar className="w-10 h-10 bg-blue-500 dark:bg-blue-300 text-gray-200 dark:text-gray-800 p-4">
                                    <AvatarImage
                                        src=""
                                        alt="Assignee Avatar"
                                    />
                                    <AvatarFallback className="text-sm font-medium">
                                        {ticket.assignee?.name ? ticket.assignee.name.split(' ').map(n => n[0]).join('') : 'A'}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-gray-100 *:text-sm">
                                {ticket.assignee?.name || 'Unassigned'}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                {ticket.priority && (
                                    <FlagIcon className={`ml-auto ${ticket.priority === "HIGH" ? "text-red-600 dark:text-red-500" : "hidden"}`} size={20} />
                                )}
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-gray-100 *:text-sm">
                                Priority
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </Card>
            <TicketModal ticket={ticket} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    );
}