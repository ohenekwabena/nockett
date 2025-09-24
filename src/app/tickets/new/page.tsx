"use client";

import { useRouter } from "next/navigation";
import { TicketDetails } from "@/components/ticket-details";
import { SideNav } from "@/components/layout/side-nav";

export default function NewTicketPage() {
    const router = useRouter();

    const handleSave = (ticketData: any) => {
        // Here you would typically save to your database
        console.log("Creating new ticket:", ticketData);

        // For now, just redirect back to tickets page
        router.push("/tickets");
    };

    const handleCancel = () => {
        router.push("/tickets");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <SideNav />

            <div className="ml-28 p-6">
                <TicketDetails
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isEditing={false}
                />
            </div>
        </div>
    );
}
