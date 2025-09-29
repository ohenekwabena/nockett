"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { ticketService } from "@/services/ticket-service";
import { toast } from "sonner";

interface Category {
    id: number;
    name: string;
}

interface CategoriesModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCategoriesChange: () => void;
}

export default function CategoriesModal({
    isOpen,
    onOpenChange,
    onCategoriesChange,
}: CategoriesModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await ticketService.getTicketCategories();
            if (error) {
                toast.error("Failed to load categories");
                console.error("Error loading categories:", error);
            } else {
                setCategories(data || []);
            }
        } catch (error) {
            toast.error("Failed to load categories");
            console.error("Error loading categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName.trim()) {
            toast.error("Category name is required");
            return;
        }

        try {
            setIsCreating(true);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data, error } = await ticketService.createTicketCategory({
                name: newCategoryName.trim(),
            });

            if (error) {
                toast.error("Failed to create category");
                console.error("Error creating category:", error);
            } else {
                toast.success("Category created successfully");
                setNewCategoryName("");
                loadCategories();
                onCategoriesChange();
            }
        } catch (error) {
            toast.error("Failed to create category");
            console.error("Error creating category:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setEditingName(category.name);
    };

    const handleSaveEdit = async () => {
        if (!editingName.trim()) {
            toast.error("Category name is required");
            return;
        }

        if (editingId === null) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data, error } = await ticketService.updateTicketCategory(editingId, {
                name: editingName.trim(),
            });

            if (error) {
                toast.error("Failed to update category");
                console.error("Error updating category:", error);
            } else {
                toast.success("Category updated successfully");
                setEditingId(null);
                setEditingName("");
                loadCategories();
                onCategoriesChange();
            }
        } catch (error) {
            toast.error("Failed to update category");
            console.error("Error updating category:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleDelete = async () => {
        if (deleteId === null) return;

        try {
            const { error } = await ticketService.deleteTicketCategory(deleteId);

            if (error) {
                toast.error("Failed to delete category");
                console.error("Error deleting category:", error);
            } else {
                toast.success("Category deleted successfully");
                setDeleteId(null);
                loadCategories();
                onCategoriesChange();
            }
        } catch (error) {
            toast.error("Failed to delete category");
            console.error("Error deleting category:", error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === "Enter") {
            action();
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 border-0 rounded-lg shadow-lg text-gray-800 dark:text-gray-200">
                    <DialogHeader className="mt-4 px-2">
                        <DialogTitle className="text-2xl dark:text-gray-200 text-gray-950">Manage Categories</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Create, edit, and delete ticket categories.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 px-2">
                        {/* Create New Category */}
                        <div className="space-y-2">
                            <Label htmlFor="new-category" className="font-semibold mb-1 dark:text-gray-400 text-gray-600">Create New Category</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="new-category"
                                    placeholder="Enter category name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, handleCreate)}
                                    disabled={isCreating}
                                    className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !newCategoryName.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-gray-100 flex items-center gap-1 cursor-pointer px-4 py-2 rounded-md"
                                >
                                    <Plus size={16} />
                                    Create
                                </button>
                            </div>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold dark:text-gray-400 text-gray-600">Existing Categories</Label>
                            <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 mt-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Loading categories...</div>
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">No categories found</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-600"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500">
                                                        #{category.id}
                                                    </Badge>
                                                    {editingId === category.id ? (
                                                        <Input
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyPress={(e) => handleKeyPress(e, handleSaveEdit)}
                                                            className="flex-1 h-8 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {editingId === category.id ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleSaveEdit}
                                                                disabled={!editingName.trim()}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                                                            >
                                                                <Save size={14} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleCancelEdit}
                                                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-600"
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(category)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                                            >
                                                                <Edit size={14} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setDeleteId(category.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-white dark:bg-gray-800 border-0 text-gray-800 dark:text-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-950 dark:text-gray-200">Delete Category</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete this category? This action cannot be undone.
                            Any tickets using this category may be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-600 bg-gray-200 dark:text-gray-200 text-gray-800 hover:text-gray-800 hover:dark:text-gray-200 border-0 hover:bg-gray-300 hover:dark:bg-gray-500">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
