"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { SideNav } from "./layout/side-nav";
import { SideNavProvider, useSideNav } from "@/hooks/use-expanded";
import { IconlyCategory, IconlyPlus } from "./icons";
import CreateTicketModal from "./modals/create-ticket-modal";
import { MobileSidebar } from "./mobile-sidebar";
import { useTheme } from "./ui/theme-provider";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isExpanded, toggleMobileSidebar } = useSideNav();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { theme } = useTheme();
    const pathname = usePathname();

    const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/signin') || pathname?.startsWith('/signup');

    const handleTicketCreated = () => {
        setIsCreateModalOpen(false);
        // Trigger a custom event that the tickets page can listen to
        window.dispatchEvent(new CustomEvent('ticketCreated'));
    };

    return (
        <div
            className={`flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${!isAuthPage ? (isExpanded ? "sm:pl-62 pl-6" : "sm:pl-30 pl-6") : ""} relative ${!isAuthPage ? "pt-10 pb-10 sm:pt-0" : ""}`}
        >
            {!isAuthPage && (
                <>
                    <button
                        onClick={toggleMobileSidebar}
                        className="absolute top-6 left-6 z-10 cursor-pointer flex items-center gap-2 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:hidden"
                    >
                        <IconlyCategory size={20} color={theme === "dark" ? "#ffffff" : "#000000"} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="absolute top-20 sm:top-10 right-6 z-10 cursor-pointer flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 "
                        style={{
                            fontSize: "clamp(0.875rem, 0.7vw + 0.6rem, 1rem)"
                        }}
                    >
                        <IconlyPlus size={20} color="#ffffff" />
                        <span className="hidden sm:inline-block">Add New</span>
                    </button>
                    <SideNav />
                    <MobileSidebar />
                </>
            )}
            {children}
            {!isAuthPage && (
                <CreateTicketModal
                    isOpen={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    onTicketCreated={handleTicketCreated}
                    mode="create"
                />
            )}
        </div>
    );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <SideNavProvider>
            <LayoutContent>
                {children}
            </LayoutContent>
        </SideNavProvider>
    );
}