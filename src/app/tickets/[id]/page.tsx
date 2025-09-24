"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketDetails } from "@/components/ticket-details";
import { SideNav } from "@/components/layout/side-nav";
import { DUMMY_TICKETS } from "@/utils/constants";
import { capitalizeString } from "@/utils/functions";
import { IconlyTicket } from "@/components/icons/ticket";

interface TicketPageProps {
    params: {
        id: string;
    };
}

export default function TicketPage({ params }: TicketPageProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);

    const ticket = DUMMY_TICKETS.find(t => t.id === params.id);

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <SideNav />
                <div className="ml-28 p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Ticket Not Found
                        </h1>
                        <button
                            onClick={() => router.push("/tickets")}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            Back to Tickets
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSave = (ticketData: any) => {
        console.log("Updating ticket:", ticketData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SideNav />

            <div className="ml-28 p-6">
                {isEditing ? (
                    <TicketDetails
                        ticket={ticket}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isEditing={true}
                    />
                ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <IconlyTicket color="currentColor" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {ticket.title}
                                    </h1>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Ticket #{ticket.id.slice(-8)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                Edit Ticket
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[ticket.priority as keyof typeof priorityColors] || priorityColors.LOW}`}>
                                {capitalizeString(ticket.priority)} Priority
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ticket.status as keyof typeof statusColors] || statusColors.OPEN}`}>
                                {capitalizeString(ticket.status)}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                                {capitalizeString(ticket.category)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Description
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {ticket.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                        Assignee
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {ticket.assignee ? ticket.assignee.name : "Unassigned"}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                        Created Date
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {ticket.createdAt.toLocaleDateString()} at {ticket.createdAt.toLocaleTimeString()}
                                    </p>
                                </div>

                                {ticket.slaDueAt && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            SLA Due Date
                                        </h4>
                                        <p className="text-orange-600 dark:text-orange-400">
                                            {ticket.slaDueAt.toLocaleDateString()} at {ticket.slaDueAt.toLocaleTimeString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Attachments ({ticket.attachments.length})
                                </h3>
                                <div className="space-y-2">
                                    {ticket.attachments.map((attachment, index) => (
                                        <div key={attachment.id || index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <span className="text-gray-600 dark:text-gray-300">📎</span>
                                            <span className="text-gray-900 dark:text-white">{attachment.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
