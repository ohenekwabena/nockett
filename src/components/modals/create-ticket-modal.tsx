"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import React, { useState, useEffect } from "react";
import { capitalizeString } from "@/utils/functions";
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
import useSupabase from "@/hooks/use-supabase";

interface CreateTicketModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onTicketCreated: () => void;
    mode?: "create" | "edit";
    ticket?: {
        id?: string;
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
        initialNote?: string;
    };
}

export default function CreateTicketModal({ isOpen, onOpenChange, onTicketCreated, mode = "create", ticket }: CreateTicketModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("OPEN");
    const [priority, setPriority] = useState("LOW");
    const [category, setCategory] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialNote, setInitialNote] = useState("");

    // Data for dropdowns
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [priorities, setPriorities] = useState<TicketPriority[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const { user } = useSupabase();

    useEffect(() => {
        if (isOpen) {
            loadDropdownData();
        }
    }, [isOpen]);

    // New useEffect to handle ticket data population for edit mode
    useEffect(() => {
        if (isOpen && mode === "edit" && ticket) {
            setTitle(ticket.title || "");
            setDescription(ticket.description || "");
            setStatus(ticket.status || "OPEN");
            setPriority(ticket.priority || "LOW");
            setCategory(ticket.category || "");
            setAssigneeId(ticket.assignee?.id || "");
            setInitialNote(ticket.initialNote || "");
            setError(null);
        } else if (isOpen && mode === "create") {
            // Reset form for create mode
            setTitle("");
            setDescription("");
            setStatus("OPEN");
            setPriority("LOW");
            setCategory("");
            setAssigneeId("");
            setInitialNote("");
            setError(null);
        }
    }, [isOpen, mode, ticket]);

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

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        if (mode === "edit" && !ticket?.id) {
            setError("Ticket ID is required for editing");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const priorityObj = priorities.find(p => p.name.toUpperCase() === priority);
            const categoryObj = categories.find(c => c.name.toUpperCase() === category);

            const ticketData = {
                title: title.trim(),
                description: description.trim(),
                status,
                priority_id: priorityObj?.id,
                category_id: categoryObj?.id,
                assignee_id: assigneeId && assigneeId !== "unassigned" ? parseInt(assigneeId) : undefined,
                creator_id: user?.id, // Add the logged in user's ID as creator
            };

            let result;
            if (mode === "create") {
                result = await ticketService.createTicket(ticketData);

                // If ticket was created successfully and there's an initial note, add it
                if (!result.error && result.data && initialNote.trim()) {
                    // Create the note once
                    await ticketService.createTicketNote({
                        ticket_id: result.data.id,
                        content: initialNote.trim(),
                        user_id: user?.id
                    });
                }
            } else {
                result = await ticketService.updateTicket(ticket?.id || "", ticketData);
            }

            if (result.error) {
                setError(result.error.message);
            } else {
                onTicketCreated();
                // Only reset form if it's create mode
                if (mode === "create") {
                    setTitle("");
                    setDescription("");
                    setStatus("OPEN");
                    setPriority("LOW");
                    setCategory("");
                    setAssigneeId("");
                    setInitialNote("");
                }
            }
        } catch (err) {
            setError(`An unexpected error occurred: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS];
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
    const CategoryIcon = category ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : null;

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
                                    <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} size={20} />
                                    <span>{capitalizeString(priority)}</span>
                                    <span>Priority</span>
                                </div>
                            </div>
                        )}
                        {status && (
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} size={20} />
                                    <span>{capitalizeString(status)}</span>
                                </div>
                            </div>
                        )}
                        {category && CategoryIcon && (
                            <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                <div className="flex items-center space-x-1">
                                    <CategoryIcon color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} size={20} />
                                    <span>{capitalizeString(category)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {error && (
                    <div className="mx-4 sm:mx-6 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4 flex flex-col lg:flex-row">
                    <div className="px-4 sm:px-6 flex-1">
                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Ticket Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                                    Title *
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

                            <div>
                                <label className="text-sm font-semibold dark:text-gray-400 text-gray-600 block mb-1">
                                    Initial Note {mode === "create" ? "(Optional)" : ""}
                                </label>
                                <Textarea
                                    value={initialNote}
                                    onChange={(e) => setInitialNote(e.target.value)}
                                    placeholder={mode === "create" ? "Add an initial note..." : "This field is for reference only in edit mode"}
                                    className="w-full h-20 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none active:ring-0"
                                    disabled={mode === "edit"}
                                />
                                {mode === "edit" && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Use the Notes tab in the ticket details to add new notes.
                                    </p>
                                )}
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
                                        {priorities.map((p) => (
                                            <SelectItem key={p.id} value={p.name.toUpperCase()}>{capitalizeString(p.name)}</SelectItem>
                                        ))}
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
                                        {STATUSES.filter(s => mode === "create" ? s !== "CLOSED" : true).map((s) => (
                                            <SelectItem key={s} value={s}>{capitalizeString(s)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <span className="font-semibold dark:text-gray-400 text-gray-600 sm:min-w-[80px]">Category</span>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
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
                                <Select value={assigneeId || "unassigned"} onValueChange={(value) => setAssigneeId(value === "unassigned" ? "" : value)}>
                                    <SelectTrigger className="w-full sm:w-48 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0">
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

                            <div className="flex flex-col sm:flex-row gap-2 mt-6">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || !title.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : (mode === "create" ? "Create Ticket" : "Save Changes")}
                                </Button>
                                <Button
                                    onClick={() => onOpenChange(false)}
                                    variant="outline"
                                    disabled={loading}
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