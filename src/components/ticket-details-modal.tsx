import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import React, { useState } from "react";
import { capitalizeString, formatDate } from "@/utils/functions";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    PRIORITY_ICONS,
    STATUS_ICONS,
    CATEGORY_ICONS,
    PRIORITY_COLORS,
    STATUS_COLORS,
    CATEGORY_COLORS,
    PRIORITIES,
    STATUSES,
    CATEGORIES
} from "@/utils/constants";

interface TicketModalProps {
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
    onOpenChange?: (open: boolean) => void;
    isOpen?: boolean;
}

export default function TicketModal({ ticket, isOpen, onOpenChange }: TicketModalProps) {
    const [status, setStatus] = useState(ticket.status || "OPEN");
    const [priority, setPriority] = useState(ticket.priority || "LOW");
    const [category, setCategory] = useState(ticket.category || "FEATURE");
    const [assignee, setAssignee] = useState(ticket.assignee?.name || "unassigned");

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
    const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} >
            <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mt-4 px-4 sm:px-6">
                    <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">{ticket.title}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 mb-4">
                        {priority && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} size={20} />
                                    <span>{capitalizeString(priority)}</span>
                                    <span>Priority</span>
                                </div>
                            </div>
                        )}
                        {status && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} size={20} />
                                    <span>{capitalizeString(status)}</span>
                                </div>
                            </div>
                        )}
                        {category && CategoryIcon && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <CategoryIcon color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} size={20} />
                                    <span>{capitalizeString(category)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>
                <div className="space-y-4 flex flex-col lg:flex-row">
                    <div className="px-4 sm:px-6 flex-1">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500  font-semibold mb-2">Description</h3>
                        <p className="text-sm sm:text-base w-full">{ticket.description}</p>
                        {ticket.slaDueAt && (
                            <div className="mt-2 text-sm">
                                <span className="font-semibold dark:text-gray-400 text-gray-600">SLA due on:</span>{" "}
                                {formatDate(new Date(ticket.slaDueAt).toLocaleString())}
                            </div>
                        )}
                        {ticket.createdAt && (
                            <div className="mt-2 text-sm">
                                <span className="font-semibold dark:text-gray-400 text-gray-600">Created on:</span>{" "}
                                {formatDate(new Date(ticket.createdAt).toLocaleString())}
                            </div>
                        )}
                        {ticket.updatedAt && (
                            <div className="mt-2 text-sm">
                                <span className="font-semibold dark:text-gray-400 text-gray-600">Updated on:</span>{" "}
                                {formatDate(new Date(ticket.updatedAt).toLocaleString())}
                            </div>
                        )}

                        <h3 className="text-sm text-gray-400 dark:text-gray-500  font-semibold mt-6 mb-1 ">Assignee</h3>
                        <div className="flex items-center space-x-2">
                            <Avatar className="w-10 h-10 bg-blue-500 dark:bg-blue-300 text-gray-200 dark:text-gray-800 p-4">
                                <AvatarImage
                                    src=""
                                    alt="Assignee Avatar"
                                />
                                <AvatarFallback className="text-xs sm:text-sm font-medium">
                                    {ticket.assignee?.name ? ticket.assignee.name.split(' ').map(n => n[0]).join('') : 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold dark:text-gray-400 text-gray-600 text-sm sm:text-base"> {ticket.assignee?.name ? ticket.assignee.name : "Unassigned"}</span>
                        </div>
                    </div>
                    <div className="px-4 sm:px-6 pb-6 space-y-4 w-full lg:w-auto">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500  font-semibold mb-2">Actions</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Priority</span>
                                <Select value={priority} onValueChange={(value) => setPriority(value as "LOW" | "MEDIUM" | "HIGH")}>
                                    <SelectTrigger className="w-full sm:w-48  dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                                        <SelectValue className="placeholder:text-gray-800 placeholder:dark:text-gray-200" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800 bg-gray-200 text-gray-800 dark:text-gray-200">
                                        {PRIORITIES.map((p) => (
                                            <SelectItem key={p} value={p}>{capitalizeString(p)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Status</span>
                                <Select value={status} onValueChange={(value) => setStatus(value as "OPEN" | "IN_PROGRESS" | "CLOSED")}>
                                    <SelectTrigger className="w-full sm:w-48  dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200  border-0 dark:border-0 active:ring-0 focus:ring-0">
                                        <SelectValue className="placeholder:text-gray-800 placeholder:dark:text-gray-200" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                        {STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>{capitalizeString(s)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Category</span>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="w-full sm:w-48  dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200  border-0 dark:border-0 active:ring-0 focus:ring-0">
                                        <SelectValue className="placeholder:text-gray-800 placeholder:dark:text-gray-200" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c} value={c}>{capitalizeString(c)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Assignee</span>
                                <Select value={assignee} onValueChange={setAssignee}>
                                    <SelectTrigger className="w-full sm:w-48  dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200  border-0 dark:border-0 active:ring-0 focus:ring-0">
                                        <SelectValue placeholder="Select assignee" className="placeholder:text-gray-800 placeholder:dark:text-gray-200" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                        <SelectItem value="John Doe">John Doe</SelectItem>
                                        <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                                        <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                                        <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}