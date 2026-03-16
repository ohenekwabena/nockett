"use client";

import { useState, useEffect } from "react";
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
import { ticketService } from "@/services/ticket-service";
import { toast } from "sonner";

interface ServiceType {
  id: number;
  name: string;
}

interface ServiceTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceTypesChange: () => void;
}

export default function ServiceTypeModal({ isOpen, onOpenChange, onServiceTypesChange }: ServiceTypeModalProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newServiceTypeName, setNewServiceTypeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadServiceTypes();
    }
  }, [isOpen]);

  const loadServiceTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await ticketService.getServiceTypes();
      if (error) {
        toast.error("Failed to load service types");
        console.error("Error loading service types:", error);
      } else {
        setServiceTypes(data || []);
      }
    } catch (error) {
      toast.error("Failed to load service types");
      console.error("Error loading service types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newServiceTypeName.trim()) {
      toast.error("Service type name is required");
      return;
    }

    try {
      setIsCreating(true);
      const { error } = await ticketService.createServiceType({
        name: newServiceTypeName.trim(),
      });

      if (error) {
        toast.error("Failed to create service type");
        console.error("Error creating service type:", error);
      } else {
        toast.success("Service type created successfully");
        setNewServiceTypeName("");
        loadServiceTypes();
        onServiceTypesChange();
      }
    } catch (error) {
      toast.error("Failed to create service type");
      console.error("Error creating service type:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setEditingId(serviceType.id);
    setEditingName(serviceType.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      toast.error("Service type name is required");
      return;
    }

    if (editingId === null) return;

    try {
      const { error } = await ticketService.updateServiceType(editingId, {
        name: editingName.trim(),
      });

      if (error) {
        toast.error("Failed to update service type");
        console.error("Error updating service type:", error);
      } else {
        toast.success("Service type updated successfully");
        setEditingId(null);
        setEditingName("");
        loadServiceTypes();
        onServiceTypesChange();
      }
    } catch (error) {
      toast.error("Failed to update service type");
      console.error("Error updating service type:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      const { error } = await ticketService.deleteServiceType(deleteId);

      if (error) {
        toast.error("Failed to delete service type");
        console.error("Error deleting service type:", error);
      } else {
        toast.success("Service type deleted successfully");
        setDeleteId(null);
        loadServiceTypes();
        onServiceTypesChange();
      }
    } catch (error) {
      toast.error("Failed to delete service type");
      console.error("Error deleting service type:", error);
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
            <DialogTitle className="text-2xl dark:text-gray-200 text-gray-950">Manage Service Types</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create, edit, and delete service types.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-2">
            <div className="space-y-2">
              <Label htmlFor="new-service-type" className="font-semibold mb-1 dark:text-gray-400 text-gray-600">
                Create New Service Type
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="new-service-type"
                  placeholder="Enter service type name"
                  value={newServiceTypeName}
                  onChange={(e) => setNewServiceTypeName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreate)}
                  disabled={isCreating}
                  className="dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                />
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newServiceTypeName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-gray-100 flex items-center gap-1 cursor-pointer px-4 py-2 rounded-md"
                >
                  <Plus size={16} />
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold dark:text-gray-400 text-gray-600">Existing Service Types</Label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 mt-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading service types...</div>
                  </div>
                ) : serviceTypes.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-gray-500 dark:text-gray-400">No service types found</div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {serviceTypes.map((serviceType) => (
                      <div
                        key={serviceType.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500"
                          >
                            #{serviceType.id}
                          </Badge>
                          {editingId === serviceType.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, handleSaveEdit)}
                              className="flex-1 h-8 dark:bg-gray-600 bg-gray-200 text-gray-800 dark:text-gray-200 border-0 focus:ring-0"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-gray-100">{serviceType.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingId === serviceType.id ? (
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
                                onClick={() => handleEdit(serviceType)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(serviceType.id)}
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
            <AlertDialogTitle className="text-gray-950 dark:text-gray-200">Delete Service Type</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this service type? This action cannot be undone.
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
