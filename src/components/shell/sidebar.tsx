"use client";

/** App sidebar (design shell.jsx): workspace nav, me-card, footer actions. */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { authService } from "@/services/auth-service";
import { getProfile } from "@/lib/identity";
import { useTheme } from "@/components/ui/theme-provider";
import { Avatar, ConfirmDialog, MIcon } from "@/components/nk/ui";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: "grid_view" },
  { href: "/tickets", label: "Tickets", icon: "confirmation_number" },
  { href: "/entities", label: "Entities", icon: "category" },
  { href: "/schedules", label: "Schedules", icon: "calendar_month" },
];

function NavItem({
  href,
  label,
  icon,
  collapsed,
  onClick,
  active,
}: {
  href?: string;
  label: string;
  icon: string;
  collapsed: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={"nav-item" + (active ? " on" : "")}
      onClick={onClick || (() => href && router.push(href))}
      title={collapsed ? label : undefined}
    >
      <MIcon name={icon} size={19} weight={active ? 500 : 400} fill={active ? 1 : 0} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  closeMobile,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  closeMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfileName(null);
      return;
    }
    let cancelled = false;
    getProfile(user.id)
      .then((profile) => {
        if (!cancelled) setProfileName(profile.name);
      })
      .catch(() => {
        /* fall back to the auth email below */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Navigating closes the mobile drawer.
  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const displayName = profileName || user?.email || "—";

  const handleLogout = async () => {
    await authService.signOut();
    toast.success("Signed out");
    router.push("/auth/login");
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-veil" onClick={closeMobile} />}
      <aside className={"sidebar" + (collapsed ? " collapsed" : "") + (mobileOpen ? " mobile-open" : "")}>
        <div className="ws-head">
          <span className="ws-logo">N</span>
          {!collapsed && (
            <span className="ws-meta">
              <span className="ws-name">Nockett</span>
              <span className="ws-sub">
                <MIcon name="cloud_done" size={13} /> Afriwave NOC
              </span>
            </span>
          )}
          <button
            type="button"
            className="icon-btn collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <MIcon name={collapsed ? "left_panel_open" : "left_panel_close"} size={17} />
          </button>
        </div>

        <nav className="nav-group">
          {!collapsed && <div className="nav-label">Workspace</div>}
          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={collapsed}
              active={pathname?.startsWith(item.href)}
            />
          ))}
        </nav>

        {isAdmin && (
          <nav className="nav-group">
            {!collapsed && <div className="nav-label">Admin</div>}
            <NavItem
              href="/audit"
              label="Audit Log"
              icon="verified_user"
              collapsed={collapsed}
              active={pathname?.startsWith("/audit")}
            />
          </nav>
        )}

        <div className="sidebar-spring"></div>

        {!collapsed && (
          <div className="me-card">
            <Avatar name={displayName} size={30} />
            <span className="me-meta">
              <span className="me-name">{displayName}</span>
              <span className="me-role">{isAdmin ? "Admin" : "User"} · NOC</span>
            </span>
          </div>
        )}

        <nav className="nav-group nav-foot">
          <NavItem
            href="/settings"
            label="Settings"
            icon="settings"
            collapsed={collapsed}
            active={pathname?.startsWith("/settings")}
          />
          <NavItem
            label={theme === "light" ? "Dark mode" : "Light mode"}
            icon={theme === "light" ? "dark_mode" : "light_mode"}
            collapsed={collapsed}
            onClick={toggleTheme}
          />
          <NavItem label="Log out" icon="logout" collapsed={collapsed} onClick={() => setLogoutOpen(true)} />
        </nav>

        <ConfirmDialog
          open={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false);
            handleLogout();
          }}
          title="Log out of Nockett?"
          confirmLabel="Log out"
          danger={false}
          body="You will be returned to the sign-in screen."
        />
      </aside>
    </>
  );
}
