"use client";

/**
 * The Nockett app frame (design main.jsx / shell.jsx): sidebar + topbar around
 * a rounded main panel, with the ticket detail side panel and the create-ticket
 * modal mounted at the shell level so every page can open them.
 *
 * Auth screens (/auth/*) and the landing splash (/) render bare, without the
 * frame — matching the previous LayoutWrapper behavior.
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { useTheme } from "@/components/ui/theme-provider";
import { NkShellContext, type TicketPanelApi } from "@/components/nk/ui";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TicketPanel } from "@/components/tickets/ticket-panel";
import { CreateTicketModal } from "@/components/tickets/create-ticket-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [panelTicket, setPanelTicket] = useState<any | null>(null);
  const [panelApi, setPanelApi] = useState<TicketPanelApi | null>(null);

  const isAuthPage = pathname === "/" || pathname?.startsWith("/auth");

  useEffect(() => {
    setCollapsedState(window.localStorage.getItem("nk-sidebar") === "collapsed");
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    window.localStorage.setItem("nk-sidebar", value ? "collapsed" : "expanded");
  };

  // Leaving the tickets/dashboard surface closes the panel.
  useEffect(() => {
    setPanelTicket(null);
    setPanelApi(null);
  }, [pathname]);

  const shellValue = useMemo(
    () => ({
      search,
      setSearch,
      panelTicket,
      panelApi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      openTicket: (ticket: any, api?: TicketPanelApi) => {
        setPanelTicket(ticket);
        setPanelApi(api ?? null);
      },
      closeTicket: () => {
        setPanelTicket(null);
        setPanelApi(null);
      },
      openCreate: () => setCreateOpen(true),
    }),
    [search, panelTicket, panelApi],
  );

  const handleTicketCreated = () => {
    setCreateOpen(false);
    // Pages listen for this to refresh their lists (existing app contract).
    window.dispatchEvent(new CustomEvent("ticketCreated"));
  };

  return (
    <NkShellContext.Provider value={shellValue}>
      {isAuthPage ? (
        children
      ) : (
        <div className="frame">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            closeMobile={() => setMobileOpen(false)}
          />
          <div className="main-wrap">
            <Topbar onMenu={() => setMobileOpen(true)} />
            <div className="main-row">
              <main className="main-panel">{children}</main>
              {panelTicket && <TicketPanel />}
            </div>
          </div>
        </div>
      )}
      {!isAuthPage && (
        <CreateTicketModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleTicketCreated}
        />
      )}
      <Toaster position="bottom-center" theme={theme === "dark" ? "light" : "dark"} />
    </NkShellContext.Provider>
  );
}
