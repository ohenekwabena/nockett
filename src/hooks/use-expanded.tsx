"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface SideNavContextType {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    toggleExpanded: () => void;
    isMobileSidebarOpen: boolean;
    setIsMobileSidebarOpen: (open: boolean) => void;
    toggleMobileSidebar: () => void;
}

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

export function SideNavProvider({ children }: { children: ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <SideNavContext.Provider value={{
            isExpanded,
            setIsExpanded,
            toggleExpanded,
            isMobileSidebarOpen,
            setIsMobileSidebarOpen,
            toggleMobileSidebar
        }}>
            {children}
        </SideNavContext.Provider>
    );
}

export function useSideNav() {
    const context = useContext(SideNavContext);
    if (context === undefined) {
        throw new Error('useSideNav must be used within a SideNavProvider');
    }
    return context;
}
