"use client";
import { ScheduleViewerCard } from "@/components/cards/schedule-viewer-card";

export default function SchedulesPage() {
  return (
    <div className="flex">
      <div className="pr-6 mt-10 w-full">
        <h1
          className="font-bold mb-4 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)",
          }}
        >
          Schedules
        </h1>
        <ScheduleViewerCard />
      </div>
    </div>
  );
}
