import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import React, { useState, useEffect } from "react";
import { capitalizeString, formatDate } from "@/utils/functions";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ticketService, type TicketCategory, type TicketPriority, type Assignee } from "@/services/ticket-service";
import {
    PRIORITY_ICONS,
    STATUS_ICONS,
    CATEGORY_ICONS,
    PRIORITY_COLORS,
    STATUS_COLORS,
    CATEGORY_COLORS,
    STATUSES
} from "@/utils/constants";
import { IconlyEditSquare, IconlyDelete } from "../icons";
import CreateTicketModal from "./create-ticket-modal";

interface TicketModalProps {
    ticket: {
        id?: string;
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
        creator?: {
            id: string | undefined;
            name: string | undefined;
            avatarUrl?: string;
        };
        slaDueAt?: Date;
    };
    onOpenChange?: (open: boolean) => void;
    isOpen?: boolean;
    onTicketUpdated: () => void;
}

export default function TicketModal({ ticket, isOpen, onOpenChange, onTicketUpdated }: TicketModalProps) {
    const [status, setStatus] = useState(ticket.status || "OPEN");
    const [priority, setPriority] = useState(ticket.priority || "LOW");
    const [category, setCategory] = useState(ticket.category || "");
    const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id || "");
    const [loading, setLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Data for dropdowns
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [priorities, setPriorities] = useState<TicketPriority[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadDropdownData();
            // Reset local state when modal opens
            setStatus(ticket.status || "OPEN");
            setPriority(ticket.priority || "LOW");
            setCategory(ticket.category || "");
            setAssigneeId(ticket.assignee?.id || "");
        }
    }, [isOpen, ticket]);

    const loadDropdownData = async () => {
        try {
            const [categoriesRes, prioritiesRes, assigneesRes] = await Promise.all([
                ticketService.getTicketCategories(),
                ticketService.getTicketPriorities(),
                ticketService.getAssignees()
            ]);

            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (prioritiesRes.data) setPriorities(prioritiesRes.data);
            if (assigneesRes.data) setAssignees(assigneesRes.data);
        } catch (err) {
            console.error("Error loading dropdown data:", err);
        }
    };

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleQuickUpdate = async (field: string, value: any) => {
        if (!ticket.id) return;

        setLoading(true);
        try {
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: any = {};

            switch (field) {
                case 'status':
                    updateData.status = value;
                    setStatus(value);
                    break;
                case 'priority':
                    const priorityObj = priorities.find(p => p.name.toUpperCase() === value);
                    updateData.priority_id = priorityObj?.id;
                    setPriority(value);
                    break;
                case 'category':
                    const categoryObj = categories.find(c => c.name.toUpperCase() === value);
                    updateData.category_id = categoryObj?.id;
                    setCategory(value);
                    break;
                case 'assignee':
                    updateData.assignee_id = (value && value !== "unassigned") ? parseInt(value) : null;
                    setAssigneeId(value === "unassigned" ? "" : value);
                    break;
            }

            const { error } = await ticketService.updateTicket(ticket.id, updateData);

            if (!error) {
                onTicketUpdated();
            }
        } catch (err) {
            console.error("Error updating ticket:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!ticket.id) return;

        setLoading(true);
        try {
            const { error } = await ticketService.deleteTicket(ticket.id);

            if (!error) {
                onTicketUpdated();
                onOpenChange?.(false);
            }
        } catch (err) {
            console.error("Error deleting ticket:", err);
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
    const CategoryIcon = category ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mt-4 px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">
                                #{ticket.id?.slice(-8) || 'N/A'} - {ticket.title}
                            </DialogTitle>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center sm:space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                                    disabled={loading}
                                >
                                    <IconlyEditSquare color="white" size={16} />
                                    <span className="hidden sm:inline-block">Edit</span>
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center sm:space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                                    disabled={loading}
                                >
                                    <IconlyDelete color="white" size={16} />
                                    <span className="hidden sm:inline-block">Delete</span>
                                </Button>
                            </div>
                        </div>
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

                    {showDeleteConfirm && (
                        <div className="mx-4 sm:mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2">Confirm Delete</h4>
                            <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                                Are you sure you want to delete this ticket? This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                                >
                                    {loading ? "Deleting..." : "Delete"}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="outline"
                                    className="text-sm px-3 py-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 flex flex-col lg:flex-row">
                        <div className="px-4 sm:px-6 flex-1">
                            <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Description</h3>
                            <p className="w-full">{ticket.description || "No description provided"}</p>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Created By</h3>
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="w-10 h-10 bg-green-500 dark:bg-green-400 text-gray-200 dark:text-gray-800 p-4">
                                            <AvatarImage src="" alt="Creator Avatar" />
                                            <AvatarFallback className="text-xs sm:text-sm font-medium">
                                                {ticket.creator?.name ? ticket.creator.name.split(' ').map(n => n[0]).join('') : 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold dark:text-gray-400 text-gray-600 text-sm sm:text-base">
                                            {ticket.creator?.name || "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Assignee</h3>
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="w-10 h-10 bg-blue-500 dark:bg-blue-300 text-gray-200 dark:text-gray-800 p-4">
                                            <AvatarImage src="" alt="Assignee Avatar" />
                                            <AvatarFallback className="text-xs sm:text-sm font-medium">
                                                {ticket.assignee?.name ? ticket.assignee.name.split(' ').map(n => n[0]).join('') : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold dark:text-gray-400 text-gray-600 text-sm sm:text-base">
                                            {ticket.assignee?.name || "Unassigned"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 sm:px-6 pb-6 space-y-4 w-full lg:w-auto">
                            <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Quick Actions</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Priority</span>
                                    <Select
                                        value={priority}
                                        onValueChange={(value) => handleQuickUpdate('priority', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-800 bg-gray-200 text-gray-800 dark:text-gray-200">
                                            {priorities.map((p) => (
                                                <SelectItem key={p.id} value={p.name.toUpperCase()}>{capitalizeString(p.name)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Status</span>
                                    <Select
                                        value={status}
                                        onValueChange={(value) => handleQuickUpdate('status', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                                            <SelectValue />
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
                                    <Select
                                        value={category}
                                        onValueChange={(value) => handleQuickUpdate('category', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.name.toUpperCase()}>{capitalizeString(c.name)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Assignee</span>
                                    <Select
                                        value={assigneeId || "unassigned"}
                                        onValueChange={(value) => handleQuickUpdate('assignee', value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 dark:border-0 active:ring-0 focus:ring-0">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200">
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {assignees.map((a) => (
                                                <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateTicketModal
                isOpen={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                mode="edit"
                ticket={{
                    id: ticket.id,
                    title: ticket.title,
                    description: ticket.description || "",
                    category: category, // Use the current loaded category name
                    priority: priority as "LOW" | "MEDIUM" | "HIGH", // Use the current loaded priority name  
                    status: status as "OPEN" | "IN_PROGRESS" | "CLOSED", // Use the current status
                    assignee: assigneeId ? {
                        id: assigneeId,
                        name: assignees.find(a => a.id.toString() === assigneeId)?.name
                    } : undefined
                }}
                onTicketCreated={() => {
                    onTicketUpdated();
                    setIsEditModalOpen(false);
                }}
            />
        </>
    );
}