"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { IconlyChart, IconlyLogout, IconlySetting, IconlyTicket, IconlyMoon, IconlySun, IconlyArrowRight2, IconlyMoreSquare } from "../icons";
import { useTheme } from "../ui/theme-provider";
import { useSideNav } from "@/hooks/use-expanded";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";


export function SideNav() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { isExpanded, toggleExpanded } = useSideNav();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handlePageRoute = (path: string) => {
        router.push(path);
    }

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const { error } = await authService.signOut();
            if (!error) {
                router.push("/auth/login");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
            setShowLogoutModal(false);
        }
    };

    return (
        <>
            <div className={`${isExpanded ? 'w-48' : 'w-15'} min-w-10 h-[70vh] bg-white dark:bg-gray-800 px-2 py-4 rounded-2xl fixed left-4 top-1/2 -translate-y-1/2 flex-col justify-between gap-6 transition-all duration-300 ease-in-out hidden sm:flex`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={handlePageRoute.bind(null, '/dashboard')}
                    >
                        <div className="flex justify-center">
                            <IconlyChart color={theme === 'dark' ? "#ffffff" : "#000000"} />
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={handlePageRoute.bind(null, '/tickets')}
                    >
                        <div className="flex justify-center">
                            <IconlyTicket color={theme === 'dark' ? "#ffffff" : "#000000"} />
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Tickets</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={handlePageRoute.bind(null, '/entities')}
                    >
                        <div className="flex justify-center">
                            <IconlyMoreSquare color={theme === 'dark' ? "#ffffff" : "#000000"} />
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Entities</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={handlePageRoute.bind(null, '/settings')}
                    >
                        <div className="flex justify-center">
                            <IconlySetting color={theme === 'dark' ? "#ffffff" : "#000000"} />
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Settings</span>
                    </div>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 py-6 relative">
                    <span
                        className={`min-w-fit w-[30px] h-[30px] bg-gray-200 dark:bg-gray-600 rounded-full flex justify-center items-center cursor-pointer hover:scale-105 transition-all duration-200 ${isExpanded ? 'rotate-180' : ''} absolute -top-4 right-1/2 translate-x-1/2`}
                        onClick={toggleExpanded}
                    >
                        <IconlyArrowRight2 color={theme === 'dark' ? "#ffffff" : "#000000"} />
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        <div className="flex justify-center">
                            {theme === 'light' ? (
                                <IconlyMoon color="#000000" />
                            ) : (
                                <IconlySun color="#ffffff" />
                            )}
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </div>
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 will-change-transform"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        <div className="flex justify-center">
                            <IconlyLogout color={theme === 'dark' ? "#ffffff" : "#000000"} />
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap text-gray-800 dark:text-gray-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Logout</span>
                    </div>
                </div>
            </div>

            <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                <DialogContent className="sm:max-w-md border-0 rounded-lg bg-gray-200">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Confirm Logout</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to logout? You will need to sign in again to access your account.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-3">
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            disabled={isLoggingOut}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                        >
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

