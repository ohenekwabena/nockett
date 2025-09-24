"use client";

import { useState } from "react";
import { IconlyTicket } from "./icons/ticket";
import { capitalizeString } from "@/utils/functions";

interface TicketDetailsProps {
    ticket?: {
        id: string;
        title: string;
        description: string;
        category: string;
        priority: string;
        status: string;
        assignee?: {
            name: string;
        };
        slaDueAt?: Date;
        createdAt: Date;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachments?: any[];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (ticketData: any) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

const CATEGORIES = ["BUG", "FEATURE", "PERFORMANCE", "DOCUMENTATION", "SUPPORT"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];

export function TicketDetails({ ticket, onSave, onCancel, isEditing = false }: TicketDetailsProps) {
    const [formData, setFormData] = useState({
        title: ticket?.title || "",
        description: ticket?.description || "",
        category: ticket?.category || "BUG",
        priority: ticket?.priority || "MEDIUM",
        status: ticket?.status || "OPEN",
        assigneeName: ticket?.assignee?.name || "",
        slaDueAt: ticket?.slaDueAt ? ticket.slaDueAt.toISOString().split('T')[0] : "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const ticketData = {
            ...formData,
            assignee: formData.assigneeName ? { name: formData.assigneeName } : undefined,
            slaDueAt: formData.slaDueAt ? new Date(formData.slaDueAt) : undefined,
            ...(isEditing ? { id: ticket!.id, createdAt: ticket!.createdAt } : { createdAt: new Date() }),
        };

        onSave(ticketData);
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <IconlyTicket color="currentColor" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? "Edit Ticket" : "Create New Ticket"}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        placeholder="Enter ticket title"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        placeholder="Describe the issue or request"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        >
                            {CATEGORIES.map(category => (
                                <option key={category} value={category}>{capitalizeString(category)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => handleChange("priority", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        >
                            {PRIORITIES.map(priority => (
                                <option key={priority} value={priority}>{capitalizeString(priority)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange("status", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        >
                            {STATUSES.map(status => (
                                <option key={status} value={status}>{capitalizeString(status)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assignee
                        </label>
                        <input
                            type="text"
                            value={formData.assigneeName}
                            onChange={(e) => handleChange("assigneeName", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="Assign to team member"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SLA Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.slaDueAt}
                            onChange={(e) => handleChange("slaDueAt", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        {isEditing ? "Update Ticket" : "Create Ticket"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
