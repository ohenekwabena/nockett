"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { EntitiesCardSkeleton } from "@/components/skeletons/entities-card-skeleton";
import type { ReferenceDescriptor } from "./descriptor";
import { useReferenceList } from "./use-reference-list";
import { ReferenceListModal } from "./reference-list-modal";

/**
 * Generic reference-entity card: a preview list (first 8) with a "View All" that
 * opens the management modal. Replaces the 10 hand-written *-card components; each
 * entity is now a {@link ReferenceDescriptor} entry instead of a ~105-line file.
 */
export function ReferenceListCard({ descriptor }: { descriptor: ReferenceDescriptor }) {
  const list = useReferenceList(descriptor);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (list.isLoading) {
    return <EntitiesCardSkeleton />;
  }

  const { items } = list;

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 shadow-md border-none min-w-[300px]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{descriptor.title}</CardTitle>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer rounded-xl"
            >
              <Eye size={16} />
              View All
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500 dark:text-gray-400">No {descriptor.plural} found</div>
              </div>
            ) : (
              items.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  <Badge variant="secondary" className="text-xs text-gray-600/40 dark:text-gray-300/60">
                    {item.id}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {items.length > 8 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{items.length - 8} more {descriptor.plural}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReferenceListModal descriptor={descriptor} list={list} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
