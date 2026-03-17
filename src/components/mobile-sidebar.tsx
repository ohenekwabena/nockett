"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import {
  IconlyChart,
  IconlyLogout,
  IconlySetting,
  IconlyTicket,
  IconlyMoon,
  IconlySun,
  IconlyMoreSquare,
} from "./icons";
import { useTheme } from "./ui/theme-provider";
import { useSideNav } from "@/hooks/use-expanded";
import { Drawer, DrawerClose, DrawerContent } from "./ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { X } from "lucide-react";

export function MobileSidebar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSideNav();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handlePageRoute = (path: string) => {
    router.push(path);
    setIsMobileSidebarOpen(false); // Close sidebar after navigation
  };

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
                onClick={() => handlePageRoute("/dashboard")}
              >
                <IconlyChart color={theme === "dark" ? "#ffffff" : "#000000"} />
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">Dashboard</span>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handlePageRoute("/tickets")}
              >
                <IconlyTicket color={theme === "dark" ? "#ffffff" : "#000000"} />
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">Tickets</span>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handlePageRoute("/entities")}
              >
                <IconlyMoreSquare color={theme === "dark" ? "#ffffff" : "#000000"} />
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">Entities</span>
              </div>
              <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handlePageRoute("/settings")}
              >
                <IconlySetting color={theme === "dark" ? "#ffffff" : "#000000"} />
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">Settings</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={toggleTheme}
              >
                {theme === "light" ? <IconlyMoon color="#000000" /> : <IconlySun color="#ffffff" />}
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </span>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => setShowLogoutModal(true)}
              >
                <IconlyLogout color={theme === "dark" ? "#ffffff" : "#000000"} />
                <span className="text-base font-medium text-gray-800 dark:text-gray-200">Logout</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-md border-0 rounded-lg bg-gray-200 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Confirm Logout</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to logout? You will need to sign in again to access your account.
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 cursor-pointer"
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
