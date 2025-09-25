import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import React, { useState } from "react";
import { capitalizeString, formatDate } from "@/utils/functions";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { EqualSquareIcon } from "lucide-react";
import { IconlyArrowDownSquare } from "./icons/arrow-down";
import { IconlyArrowUpCircle } from "./icons/arrow-up";
import { IconlyActivity, IconlyLock, IconlySetting, IconlyUnlock, IconlyInfoSquare, IconlyMoreCircle, IconlyGraph } from "./icons";
import { GiSpottedBug } from "react-icons/gi";

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

// Wrapper components to standardize icon interfaces
const PriorityLowIcon = ({ color }: { color?: string }) => <IconlyArrowDownSquare color={color} />;
const PriorityMediumIcon = ({ color, }: { color?: string }) => <EqualSquareIcon color={color} size={24} />;
const PriorityHighIcon = ({ color }: { color?: string }) => <IconlyArrowUpCircle color={color} />;

const StatusOpenIcon = ({ color }: { color?: string }) => <IconlyUnlock color={color} />;
const StatusInProgressIcon = ({ color }: { color?: string }) => <IconlyActivity color={color} />;
const StatusClosedIcon = ({ color }: { color?: string }) => <IconlyLock color={color} />;

const CategoryFeatureIcon = ({ color }: { color?: string }) => <IconlyMoreCircle color={color} />;
const CategoryBugIcon = ({ color }: { color?: string }) => <GiSpottedBug color={color} size={24} />;
const CategorySupportIcon = ({ color }: { color?: string }) => <IconlyInfoSquare color={color} />;
const CategoryMaintenanceIcon = ({ color }: { color?: string }) => <IconlySetting color={color} />;
const CategoryPerformanceIcon = ({ color }: { color?: string }) => <IconlyGraph color={color} />;

const PRIORITY_ICONS = {
    LOW: PriorityLowIcon,
    MEDIUM: PriorityMediumIcon,
    HIGH: PriorityHighIcon,
};

const STATUS_ICONS = {
    OPEN: StatusOpenIcon,
    IN_PROGRESS: StatusInProgressIcon,
    CLOSED: StatusClosedIcon,
};

const CATEGORY_ICONS = {
    BUG: CategoryBugIcon,
    FEATURE: CategoryFeatureIcon,
    SUPPORT: CategorySupportIcon,
    MAINTENANCE: CategoryMaintenanceIcon,
    PERFORMANCE: CategoryPerformanceIcon,
};

const PRIORITY_COLORS = {
    LOW: "#10B981", // Green
    MEDIUM: "#F59E0B", // Yellow
    HIGH: "#EF4444", // Red
};

const STATUS_COLORS = {
    OPEN: "#3B82F6", // Blue
    IN_PROGRESS: "#FBBF24", // Yellow
    CLOSED: "#10B981", // Green
};

const CATEGORY_COLORS = {
    BUG: "#EF4444", // Red
    FEATURE: "#3B82F6", // Blue
    SUPPORT: "#10B981", // Green
    MAINTENANCE: "#F59E0B", // Yellow
    PERFORMANCE: "#8B5CF6", // Purple
};

export default function TicketModal({ ticket, isOpen, onOpenChange }: TicketModalProps) {
    const [status, setStatus] = useState(ticket.status || "OPEN");
    const [priority, setPriority] = useState(ticket.priority || "LOW");
    const [category, setCategory] = useState(ticket.category || "FEATURE");
    const [assignee, setAssignee] = useState(ticket.assignee?.name || "unassigned");

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} >
            <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mt-4 px-4 sm:px-6">
                    <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">{ticket.title}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 mb-4">
                        {priority && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} />
                                    <span>{capitalizeString(priority)}</span>
                                    <span>Priority</span>
                                </div>
                            </div>
                        )}
                        {status && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} />
                                    <span>{capitalizeString(status)}</span>
                                </div>
                            </div>
                        )}
                        {category && (
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    {React.createElement(CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS], { color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] })}
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
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
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
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
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
                                        <SelectItem value="BUG">Bug</SelectItem>
                                        <SelectItem value="FEATURE">Feature</SelectItem>
                                        <SelectItem value="SUPPORT">Support</SelectItem>
                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                        <SelectItem value="PERFORMANCE">Performance</SelectItem>
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