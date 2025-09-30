import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import React, { useState, useEffect } from "react";
import { capitalizeString, formatDate } from "@/utils/functions";
import { Button } from "../ui/button";
import { ticketService, type TicketCategory, type TicketPriority, type Assignee, type TicketComment, type TicketNote } from "@/services/ticket-service";
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
import { Textarea } from "../ui/textarea";
import useSupabase from "@/hooks/use-supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import PersonEntityAvatar from "../person-entity-avatar";

interface TicketModalProps {
    ticket: {
        id?: string;
        title: string;
        description: string;
        category?: string;
        priority?: "LOW" | "MEDIUM" | "MAJOR" | "HIGH" | "HIGHEST" | "CRITICAL" | "DEFAULT";
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
    const [currentTicket, setCurrentTicket] = useState(ticket);
    const [comments, setComments] = useState<TicketComment[]>([]);
    const [notes, setNotes] = useState<TicketNote[]>([]);
    const [newComment, setNewComment] = useState("");
    const [newNote, setNewNote] = useState("");
    const [activeTab, setActiveTab] = useState<"details" | "comments" | "notes">("details");
    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    // Data for dropdowns
    const [categories, setCategories] = useState<TicketCategory[]>([]);
    const [priorities, setPriorities] = useState<TicketPriority[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const { user } = useSupabase();

    useEffect(() => {
        if (isOpen) {
            loadDropdownData();
            loadCommentsAndNotes();
            // Reset local state when modal opens
            setStatus(ticket.status || "OPEN");
            setPriority(ticket.priority || "LOW");
            setCategory(ticket.category || "");
            setAssigneeId(ticket.assignee?.id || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const loadCommentsAndNotes = async () => {
        if (!ticket.id) return;

        try {
            const [commentsRes, notesRes] = await Promise.all([
                ticketService.getTicketComments(ticket.id),
                ticketService.getTicketNotes(ticket.id)
            ]);

            if (commentsRes.data) setComments(commentsRes.data);
            if (notesRes.data) setNotes(notesRes.data);
        } catch (err) {
            console.error("Error loading comments and notes:", err);
        }
    };

    const handleAddComment = async () => {
        if (!ticket.id || !newComment.trim()) return;

        setLoading(true);
        try {
            // Try to create comment with user_id first
            const result = await ticketService.createTicketComment({
                ticket_id: ticket.id,
                content: newComment.trim(),
                user_id: user?.id
            });

            if (!result.error) {
                setNewComment("");
                await loadCommentsAndNotes();
            } else {
                console.error("Error adding comment:", result.error);
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!ticket.id || !newNote.trim()) return;

        setLoading(true);
        try {
            // Try to create note with user_id first
            const result = await ticketService.createTicketNote({
                ticket_id: ticket.id,
                content: newNote.trim(),
                user_id: user?.id
            });

            if (!result.error) {
                setNewNote("");
                await loadCommentsAndNotes();
            } else {
                console.error("Error adding note:", result.error);
            }
        } catch (err) {
            console.error("Error adding note:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        setLoading(true);
        try {
            const { error } = await ticketService.deleteTicketComment(commentId);
            if (!error) {
                await loadCommentsAndNotes();
                // Add 1000ms delay before closing dialog
                setTimeout(() => {
                    setCommentToDelete(null);
                }, 1000);
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        setLoading(true);
        try {
            const { error } = await ticketService.deleteTicketNote(noteId);
            if (!error) {
                await loadCommentsAndNotes();
                // Add 1000ms delay before closing dialog
                setTimeout(() => {
                    setNoteToDelete(null);
                }, 1000);
            }
        } catch (err) {
            console.error("Error deleting note:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshTicketData = async () => {
        if (!ticket.id) return;

        try {
            const { data, error } = await ticketService.getTicketByIdWithDetails(ticket.id);
            if (!error && data) {
                // Handle nested relations that might be arrays or objects
                const priority = Array.isArray(data.ticket_priorities)
                    ? data.ticket_priorities[0]
                    : data.ticket_priorities;
                const category = Array.isArray(data.ticket_categories)
                    ? data.ticket_categories[0]
                    : data.ticket_categories;
                const assignee = Array.isArray(data.assignee)
                    ? data.assignee[0]
                    : data.assignee;

                // Update current ticket with fresh data
                const updatedTicket = {
                    ...currentTicket,
                    status: data.status as "OPEN" | "IN_PROGRESS" | "CLOSED",
                    priority: priority?.name?.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
                    category: category?.name?.toUpperCase(),
                    assignee: assignee ? {
                        id: assignee.id.toString(),
                        name: assignee.name
                    } : undefined,
                    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
                };

                setCurrentTicket(updatedTicket);
                setStatus(updatedTicket.status || "OPEN");
                setPriority(updatedTicket.priority || "LOW");
                setCategory(updatedTicket.category || "");
                setAssigneeId(updatedTicket.assignee?.id || "");
            }
        } catch (err) {
            console.error("Error refreshing ticket data:", err);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleQuickUpdate = async (field: string, value: any) => {
        if (!ticket.id) return;

        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // Refresh ticket data to get updated information
                await refreshTicketData();
                // Notify parent component about the update
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

    const PriorityIcon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS || "DEFAULT"]
    const StatusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS || "DEFAULT"]
    const CategoryIcon = category ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS || "DEFAULT"] : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-full w-[95dvw] sm:w-[90dvw] lg:w-[80dvw] h-[90vh] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200 flex flex-col">
                    <DialogHeader className="mt-4 px-4 sm:px-6 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <DialogTitle className="text-2xl sm:text-3xl dark:text-gray-200 text-gray-950">
                                #{currentTicket.id?.slice(-8) || 'N/A'} - {currentTicket.title}
                            </DialogTitle>
                            <div className="flex gap-2 items-center justify-center">
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
                                        <PriorityIcon color={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS || "DEFAULT"]} size={20} />
                                        <span>{capitalizeString(priority)}</span>
                                        <span>Priority</span>
                                    </div>
                                </div>
                            )}
                            {status && (
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                    <div className="flex items-center space-x-1">
                                        <StatusIcon color={STATUS_COLORS[status as keyof typeof STATUS_COLORS || "DEFAULT"]} size={20} />
                                        <span>{capitalizeString(status)}</span>
                                    </div>
                                </div>
                            )}
                            {category && CategoryIcon && (
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 w-fit px-2 sm:px-3 py-1 rounded-full text-sm">
                                    <div className="flex items-center space-x-1">
                                        <CategoryIcon color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS || "DEFAULT"]} size={20} />
                                        <span>{capitalizeString(category)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {showDeleteConfirm && (
                        <div className="mx-4 sm:mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
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

                    {/* Tabs Component */}
                    <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "comments" | "notes")} className="flex flex-col h-full">
                            <div className="overflow-x-auto flex-shrink-0">
                                <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 min-w-max pb-2">
                                    <TabsTrigger
                                        value="details"
                                        className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-950 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                                    >
                                        Details
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="comments"
                                        className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-950 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                                    >
                                        Comments ({comments.length})
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="notes"
                                        className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-950 transition-all duration-150 ease-in-out mr-2 whitespace-nowrap cursor-pointer"
                                    >
                                        Notes ({notes.length})
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <TabsContent value="details" className="mt-4 space-y-4 focus-visible:outline-none">
                                    <div className="flex flex-col lg:flex-row">
                                        <div className="flex-1">
                                            <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Description</h3>
                                            <p className="w-full">{currentTicket.description || "No description provided"}</p>
                                            {currentTicket.slaDueAt && (
                                                <div className="mt-2 text-sm">
                                                    <span className="font-semibold dark:text-gray-400 text-gray-600">SLA due on:</span>{" "}
                                                    {formatDate(currentTicket.slaDueAt)}
                                                </div>
                                            )}
                                            {currentTicket.createdAt && (
                                                <div className="mt-2 text-sm">
                                                    <span className="font-semibold dark:text-gray-400 text-gray-600">Created on:</span>{" "}
                                                    {formatDate(currentTicket.createdAt)}
                                                </div>
                                            )}
                                            {currentTicket.updatedAt && (
                                                <div className="mt-2 text-sm">
                                                    <span className="font-semibold dark:text-gray-400 text-gray-600">Updated on:</span>{" "}
                                                    {formatDate(currentTicket.updatedAt)}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                                <div>
                                                    <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Created By</h3>
                                                    <PersonEntityAvatar
                                                        name={ticket.creator?.name}
                                                        image={ticket.creator?.avatarUrl}
                                                        type="user"
                                                    />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-1">Assignee</h3>
                                                    <PersonEntityAvatar
                                                        name={ticket.assignee?.name}
                                                        image={ticket.assignee?.avatarUrl}
                                                        type="assignee"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pb-6 space-y-4 mt-6 sm:mt-0 w-full lg:w-auto">
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
                                </TabsContent>

                                <TabsContent value="comments" className="mt-4 space-y-4 focus-visible:outline-none">
                                    <div>
                                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Add Comment</h3>
                                        <div className="flex gap-2">
                                            <Textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="flex-1 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none"
                                                rows={3}
                                            />
                                            <Button
                                                onClick={handleAddComment}
                                                disabled={loading || !newComment.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white h-fit"
                                            >
                                                {loading ? "Adding..." : "Add"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Comments</h3>
                                        <div className="space-y-3">
                                            {comments.length === 0 ? (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</p>
                                            ) : (
                                                comments.map((comment) => {
                                                    const commentUser = Array.isArray(comment.users)
                                                        ? comment.users[0]
                                                        : comment.users;

                                                    return (
                                                        <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between justify-between items-start mb-2">
                                                                <PersonEntityAvatar
                                                                    name={commentUser?.name}
                                                                    type="user"
                                                                    className="scale-75 origin-left"
                                                                />
                                                                <div className="flex justify-center items-center gap-2 mt-2 sm:mt-0">
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {comment.created_at ? formatDate(comment.created_at) : ''}
                                                                    </span>
                                                                    {comment.user_id === user?.id && (
                                                                        <AlertDialog open={commentToDelete === comment.id} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                                                                            <AlertDialogTrigger asChild>
                                                                                <button
                                                                                    onClick={() => setCommentToDelete(comment.id)}
                                                                                    className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 dark:hover:text-red-300 cursor-pointer dark:text-red-500"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Comment</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                                                                        Are you sure you want to delete this comment? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 
                                                                                    hover:text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteComment(comment.id)}
                                                                                        disabled={loading}
                                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                                    >
                                                                                        {loading ? "Deleting..." : "Delete"}
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm ml-12">{comment.content}</p>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="notes" className="mt-4 space-y-4 focus-visible:outline-none">
                                    <div>
                                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold mb-2">Add Note</h3>
                                        <div className="flex gap-2">
                                            <Textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Add a note..."
                                                className="flex-1 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 resize-none"
                                                rows={3}
                                            />
                                            <Button
                                                onClick={handleAddNote}
                                                disabled={loading || !newNote.trim()}
                                                className="bg-green-600 hover:bg-green-700 text-white h-fit"
                                            >
                                                {loading ? "Adding..." : "Add"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm text-gray-400 dark:text-gray-500 font-semibold">Notes</h3>
                                        <div className="space-y-3">
                                            {notes.length === 0 ? (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">No notes yet.</p>
                                            ) : (
                                                notes.map((note) => {
                                                    const noteUser = Array.isArray(note.users)
                                                        ? note.users[0]
                                                        : note.users;

                                                    return (
                                                        <div key={note.id} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-2">
                                                                <PersonEntityAvatar
                                                                    name={noteUser?.name}
                                                                    type="user"
                                                                    className="scale-75 origin-left"
                                                                />
                                                                <div className="flex gap-2 items-center justify-center mt-2 sm:mt-0">
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {note.created_at ? formatDate(note.created_at) : ''}
                                                                    </span>
                                                                    {note.user_id === user?.id && (
                                                                        <AlertDialog open={noteToDelete === note.id} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                                                                            <AlertDialogTrigger asChild>
                                                                                <button
                                                                                    onClick={() => setNoteToDelete(note.id)}
                                                                                    className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700 dark:hover:text-red-300 cursor-pointer dark:text-red-500"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Note</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                                                                        Are you sure you want to delete this note? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 
                                                                                    hover:text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteNote(note.id)}
                                                                                        disabled={loading}
                                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                                    >
                                                                                        {loading ? "Deleting..." : "Delete"}
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm ml-12">{note.content}</p>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
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