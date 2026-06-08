"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import type { ReferenceDescriptor, ReferenceEntity } from "./descriptor";
import { referenceReducer, titleCase, validateName } from "./reference-list-store";

export interface ReferenceListController {
  items: ReferenceEntity[];
  /** True during the initial load, while the card shows its skeleton. */
  isLoading: boolean;
  /** True while a create is in flight (edits and deletes are optimistic). */
  isMutating: boolean;
  create: (rawName: string) => Promise<boolean>;
  update: (id: number, rawName: string) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

/**
 * Owns the load + CRUD lifecycle for one reference list: the single place where
 * validation, the service call, success/error toasts, and optimistic updates
 * with revert-on-failure live — instead of being copy-pasted into a modal per
 * entity. Edits and deletes apply optimistically and roll back if the service
 * throws; creates wait for the server row so the real id is shown.
 */
export function useReferenceList(descriptor: ReferenceDescriptor): ReferenceListController {
  const [items, dispatch] = useReducer(referenceReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const Singular = titleCase(descriptor.singular);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      dispatch({ type: "loaded", items: await descriptor.list() });
    } catch (error) {
      toast.error(`Failed to load ${descriptor.plural}`);
      console.error(`Error loading ${descriptor.plural}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [descriptor]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (rawName: string): Promise<boolean> => {
      const name = validateName(rawName);
      if (!name) {
        toast.error(`${Singular} name is required`);
        return false;
      }
      try {
        setIsMutating(true);
        const item = await descriptor.create(name);
        dispatch({ type: "created", item });
        toast.success(`${Singular} created successfully`);
        return true;
      } catch (error) {
        toast.error(`Failed to create ${descriptor.singular}`);
        console.error(`Error creating ${descriptor.singular}:`, error);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [descriptor, Singular]
  );

  const update = useCallback(
    async (id: number, rawName: string): Promise<boolean> => {
      const name = validateName(rawName);
      if (!name) {
        toast.error(`${Singular} name is required`);
        return false;
      }
      const snapshot = items;
      dispatch({ type: "updated", id, name });
      try {
        await descriptor.update(id, name);
        toast.success(`${Singular} updated successfully`);
        return true;
      } catch (error) {
        dispatch({ type: "loaded", items: snapshot });
        toast.error(`Failed to update ${descriptor.singular}`);
        console.error(`Error updating ${descriptor.singular}:`, error);
        return false;
      }
    },
    [descriptor, Singular, items]
  );

  const remove = useCallback(
    async (id: number): Promise<boolean> => {
      const snapshot = items;
      dispatch({ type: "removed", id });
      try {
        await descriptor.remove(id);
        toast.success(`${Singular} deleted successfully`);
        return true;
      } catch (error) {
        dispatch({ type: "loaded", items: snapshot });
        toast.error(`Failed to delete ${descriptor.singular}`);
        console.error(`Error deleting ${descriptor.singular}:`, error);
        return false;
      }
    },
    [descriptor, Singular, items]
  );

  return { items, isLoading, isMutating, create, update, remove };
}
