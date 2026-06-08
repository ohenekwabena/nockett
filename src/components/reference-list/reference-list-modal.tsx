"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { ReferenceDescriptor, ReferenceEntity } from "./descriptor";
import type { ReferenceListController } from "./use-reference-list";
import { titleCase } from "./reference-list-store";

interface ReferenceListModalProps {
  descriptor: ReferenceDescriptor;
  list: ReferenceListController;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Generic management modal (create / inline-edit / delete-with-confirm) for one
 * reference list. Purely presentational: all data and CRUD come from the shared
 * {@link ReferenceListController}; this owns only transient form state.
 */
export function ReferenceListModal({ descriptor, list, isOpen, onOpenChange }: ReferenceListModalProps) {
  const { items, isMutating, create, update, remove } = list;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const singularTitle = titleCase(descriptor.singular);
  const description = descriptor.description ?? `Create, edit, and delete ${descriptor.plural}.`;

  const handleCreate = async () => {
    const ok = await create(newName);
    if (ok) setNewName("");
  };

  const handleEdit = (item: ReferenceEntity) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const ok = await update(editingId, editingName);
    if (ok) {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    const id = deleteId;
    setDeleteId(null);
    await remove(id);
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
            <DialogTitle className="text-2xl dark:text-gray-200 text-gray-950">Manage {descriptor.title}</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-2">
            <div className="space-y-2">
              <Label htmlFor={`new-${descriptor.key}`} className="font-semibold mb-1 dark:text-gray-400 text-gray-600">
                Create New {singularTitle}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id={`new-${descriptor.key}`}
                  placeholder={`Enter ${descriptor.singular} name`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreate)}
                  disabled={isMutating}
                  className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                />
                <button
                  onClick={handleCreate}
                  disabled={isMutating || !newName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-gray-100 flex items-center gap-1 cursor-pointer px-4 py-2 rounded-md"
                >
                  <Plus size={16} />
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold dark:text-gray-400 text-gray-600">
                Existing {descriptor.title}
              </Label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 mt-1">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-gray-500 dark:text-gray-400">No {descriptor.plural} found</div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500"
                          >
                            #{item.id}
                          </Badge>
                          {editingId === item.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, handleSaveEdit)}
                              className="flex-1 h-8 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingId === item.id ? (
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
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(item.id)}
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-0 text-gray-800 dark:text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-950 dark:text-gray-200">Delete {singularTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this {descriptor.singular}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-600 bg-gray-200 dark:text-gray-200 text-gray-800 hover:text-gray-800 hover:dark:text-gray-200 border-0 hover:bg-gray-300 hover:dark:bg-gray-500">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
