"use client";
import { InviteUserCard } from "@/components/cards/invite-user-card";
import useSupabase from "@/hooks/use-supabase";

export default function SettingsPage() {
  const { user, role } = useSupabase();

  const userRole = role || (user?.user_metadata?.role as string) || null;

  console.log("User role in settings page:", userRole);

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
        {userRole?.toLowerCase() === "admin" && (
          <div className="mb-10">
            <InviteUserCard />
          </div>
        )}
      </div>
    </div>
  );
}
