"use client";
import { useRouter } from "next/navigation";
import { IconlyChart, IconlyLogout, IconlySetting, IconlyTicket, IconlyMoon, IconlySun, IconlyMoreSquare } from "./icons";
import { useTheme } from "./ui/theme-provider";
import { useSideNav } from "@/hooks/use-expanded";
import { Drawer, DrawerClose, DrawerContent } from "./ui/drawer";
import { X } from "lucide-react";

export function MobileSidebar() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSideNav();

    const handlePageRoute = (path: string) => {
        router.push(path);
        setIsMobileSidebarOpen(false); // Close sidebar after navigation
    };

    return (
        <Drawer open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen} direction="left">
            <DrawerContent direction="left" className="sm:hidden border-0">
                <div className="flex flex-col h-full p-4 bg-white dark:bg-gray-800">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Menu</h2>
                        <DrawerClose>
                            <X className="text-gray-800 dark:text-gray-200" />
                        </DrawerClose>

                    </div>

                    {/* Navigation Items */}
                    <div className="flex flex-col gap-2 flex-1">
                        <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handlePageRoute('/dashboard')}
                        >
                            <IconlyChart color={theme === 'dark' ? "#ffffff" : "#000000"} />
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">Dashboard</span>
                        </div>

                        <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handlePageRoute('/tickets')}
                        >
                            <IconlyTicket color={theme === 'dark' ? "#ffffff" : "#000000"} />
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">Tickets</span>
                        </div>

                        <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handlePageRoute('/entities')}
                        >
                            <IconlyMoreSquare color={theme === 'dark' ? "#ffffff" : "#000000"} />
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">Entities</span>
                        </div>
                        <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handlePageRoute('/settings')}
                        >
                            <IconlySetting color={theme === 'dark' ? "#ffffff" : "#000000"} />
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">Settings</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={toggleTheme}
                        >
                            {theme === 'light' ? (
                                <IconlyMoon color="#000000" />
                            ) : (
                                <IconlySun color="#ffffff" />
                            )}
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <IconlyLogout color={theme === 'dark' ? "#ffffff" : "#000000"} />
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">Logout</span>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
