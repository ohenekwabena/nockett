"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { ticketService } from "@/services/ticket-service";
import LinkModal from "@/components/modals/link-modal";
import { EntitiesCardSkeleton } from "@/components/skeletons/entities-card-skeleton";

interface Link {
  id: number;
  name: string;
}

export default function LinkCard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await ticketService.getLinks();
      if (error) {
        console.error("Error loading links:", error);
      } else {
        setLinks(data || []);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = () => {
    setIsModalOpen(true);
  };

  const handleLinksChange = () => {
    loadLinks();
  };

  if (isLoading) {
    return <EntitiesCardSkeleton />;
  }

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 shadow-md border-none min-w-[300px]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Links</CardTitle>
            <button
              onClick={handleViewAll}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer rounded-xl"
            >
              <Eye size={16} />
              View All
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {links.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500 dark:text-gray-400">No links found</div>
              </div>
            ) : (
              links.slice(0, 8).map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.name}</span>
                  <Badge variant="secondary" className="text-xs text-gray-600/40 dark:text-gray-300/60">
                    {link.id}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {links.length > 8 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">+{links.length - 8} more links</div>
            </div>
          )}
        </CardContent>
      </Card>

      <LinkModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onLinksChange={handleLinksChange} />
    </>
  );
}
