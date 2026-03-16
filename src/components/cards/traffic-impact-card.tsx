"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { ticketService } from "@/services/ticket-service";
import TrafficImpactModal from "@/components/modals/traffic-impact-modal";
import { EntitiesCardSkeleton } from "@/components/skeletons/entities-card-skeleton";

interface TrafficImpact {
  id: number;
  name: string;
}

export default function TrafficImpactCard() {
  const [trafficImpacts, setTrafficImpacts] = useState<TrafficImpact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadTrafficImpacts();
  }, []);

  const loadTrafficImpacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await ticketService.getTrafficImpacts();
      if (error) {
        console.error("Error loading traffic impacts:", error);
      } else {
        setTrafficImpacts(data || []);
      }
    } catch (error) {
      console.error("Error loading traffic impacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = () => {
    setIsModalOpen(true);
  };

  const handleTrafficImpactsChange = () => {
    loadTrafficImpacts();
  };

  if (isLoading) {
    return <EntitiesCardSkeleton />;
  }

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 shadow-md border-none min-w-[300px]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Traffic Impacts</CardTitle>
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
            {trafficImpacts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500 dark:text-gray-400">No traffic impacts found</div>
              </div>
            ) : (
              trafficImpacts.slice(0, 8).map((trafficImpact) => (
                <div
                  key={trafficImpact.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{trafficImpact.name}</span>
                  <Badge variant="secondary" className="text-xs text-gray-600/40 dark:text-gray-300/60">
                    {trafficImpact.id}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {trafficImpacts.length > 8 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{trafficImpacts.length - 8} more traffic impacts
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TrafficImpactModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onTrafficImpactsChange={handleTrafficImpactsChange}
      />
    </>
  );
}
