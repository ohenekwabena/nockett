"use client";
import { InviteUserCard } from "@/components/cards/invite-user-card";

export default function SettingsPage() {
  return (
    <div className="flex">
      <div className="pr-6 mt-10">
        <h1
          className="font-bold mb-4 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)",
          }}
        >
          Settings
        </h1>
        {/* Settings content goes here */}

        {/* Invite User Card Integration */}
        <div className="mb-10">
          {/* Only show to admins if you have role logic, otherwise show to all */}
          <InviteUserCard />
        </div>
      </div>
    </div>
  );
}
