"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import React, { useState } from "react";
import { capitalizeString } from "@/utils/functions";
import { IconlyActivity, IconlyLock, IconlyUnlock } from "./icons";
import { EqualSquareIcon } from "lucide-react";
import { IconlyArrowDownSquare } from "./icons/arrow-down";
import { IconlyArrowUpCircle } from "./icons/arrow-up";

interface CreateTicketModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: "create" | "edit";
    ticket?: {
        title: string;
        description: string;
        category?: string;
        priority?: "LOW" | "MEDIUM" | "HIGH";
        status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
        assignee?: {
            id: string | undefined;
            name: string | undefined;
            avatarUrl?: string;
        };
        id?: string;
    };
}

// Wrapper components to standardize icon interfaces
const PriorityLowIcon = ({ color }: { color?: string }) => <IconlyArrowDownSquare color={color} />;
const PriorityMediumIcon = ({ color }: { color?: string }) => <EqualSquareIcon color={color} size={16} />;
const PriorityHighIcon = ({ color }: { color?: string }) => <IconlyArrowUpCircle color={color} />;

const StatusOpenIcon = ({ color }: { color?: string }) => <IconlyUnlock color={color} />;
const StatusInProgressIcon = ({ color }: { color?: string }) => <IconlyActivity color={color} />;
const StatusClosedIcon = ({ color }: { color?: string }) => <IconlyLock color={color} />;

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

export default function CreateTicketModal({ isOpen, onOpenChange, mode = "create", ticket }: CreateTicketModalProps) {
    const [title, setTitle] = useState(ticket?.title || "");
    const [description, setDescription] = useState(ticket?.description || "");
    const [status, setStatus] = useState(ticket?.status || "OPEN");
    const [priority, setPriority] = useState(ticket?.priority || "LOW");
    const [category, setCategory] = useState(ticket?.category || "FEATURE");
    const [assignee, setAssignee] = useState(ticket?.assignee?.name || "unassigned");

    const handleSubmit = () => {
        // Handle form submission logic here
        console.log({
            title,
            description,
            status,
            priority,
            category,
            assignee: assignee === "unassigned" ? null : assignee
        });
        onOpenChange(false);
    };

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mt-4 px-4 sm:px-6">
                    <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">
                        {mode === "create" ? "Create New Ticket" : "Edit Ticket"}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 mb-4">
                        {priority && (
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} />
                                    <span>{capitalizeString(priority)}</span>
                                    <span>Priority</span>
                                </div>
                            </div>
                        )}
                        {status && (
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} />
                                    <span>{capitalizeString(status)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>
                <div className="space-y-4 flex flex-col lg:flex-row">
                    <div className="px-4 sm:px-6 flex-1">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Ticket Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                                    Title
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter ticket title"
                                    className="w-full dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 active:ring-0"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                                    Description
                                </label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter ticket description"
                                    className="w-full h-24 sm:h-32 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none active:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-4 sm:px-6 pb-6 space-y-4 w-full lg:min-w-[300px] lg:w-auto">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Properties</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Priority</span>
                                <Select value={priority} onValueChange={(value) => setPriority(value as "LOW" | "MEDIUM" | "HIGH")}>
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                                        <SelectValue />
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
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                                        <SelectValue />
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
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                        <SelectItem value="BUG">Bug</SelectItem>
                                        <SelectItem value="FEATURE">Feature</SelectItem>
                                        <SelectItem value="SUPPORT">Support</SelectItem>
                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Assignee</span>
                                <Select value={assignee} onValueChange={setAssignee}>
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
                                        <SelectValue placeholder="Select assignee" />
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

                            <div className="flex flex-col sm:flex-row gap-2 mt-6">
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {mode === "create" ? "Create Ticket" : "Save Changes"}
                                </Button>
                                <Button
                                    onClick={() => onOpenChange(false)}
                                    variant="outline"
                                    className="flex-1 dark:bg-gray-600 bg-gray-200 dark:text-gray-200 text-gray-800 hover:text-gray-800 active:text-gray-800 hover:dark:text-gray-200 border-0 hover:bg-gray-300 hover:dark:bg-gray-500"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
