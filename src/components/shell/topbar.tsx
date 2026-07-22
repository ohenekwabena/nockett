"use client";

/** Topbar (design shell.jsx): crumbs, global ticket search ("/"), New ticket. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Btn, MIcon, useNkShell } from "@/components/nk/ui";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/entities": "Entities",
  "/schedules": "Schedules",
  "/audit": "Audit Log",
  "/settings": "Settings",
};

function titleFor(pathname: string | null): string {
  if (!pathname) return "";
  const hit = Object.keys(PAGE_TITLES).find((prefix) => pathname.startsWith(prefix));
  return hit ? PAGE_TITLES[hit] : "";
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { search, setSearch, openCreate } = useNkShell();
  const inputRef = useRef<HTMLInputElement>(null);
  // On mobile the search field is collapsed behind an icon; this expands it.
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "/" && !/input|textarea|select/i.test((event.target as HTMLElement).tagName)) {
        event.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus the field the moment the mobile search expands.
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <div className={"topbar" + (searchOpen ? " topbar-searching" : "")}>
      <button type="button" className="icon-btn menu-btn" onClick={onMenu} title="Menu">
        <MIcon name="menu" size={19} />
      </button>
      <div className="crumbs">
        <Link href="/dashboard" className={"crumb" + (pathname?.startsWith("/dashboard") ? " on" : "")}>
          <MIcon name="grid_view" size={15} /> Overview
        </Link>
        <Link href="/tickets" className={"crumb" + (pathname?.startsWith("/tickets") ? " on" : "")}>
          <MIcon name="confirmation_number" size={15} /> Tickets
        </Link>
        <span className="crumb-here">{titleFor(pathname)}</span>
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className="icon-btn search-toggle"
          onClick={() => setSearchOpen(true)}
          title="Search tickets"
          aria-label="Search tickets"
        >
          <MIcon name="search" size={19} />
        </button>
        <div className="search-box">
          <MIcon name="search" size={16} />
          <input
            ref={inputRef}
            placeholder="Find ticket…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (!pathname?.startsWith("/tickets")) router.push("/tickets");
            }}
          />
          <button
            type="button"
            className="icon-btn search-close"
            onClick={() => {
              setSearchOpen(false);
              setSearch("");
            }}
            title="Close search"
            aria-label="Close search"
          >
            <MIcon name="close" size={17} />
          </button>
          <kbd>/</kbd>
        </div>
        <Btn kind="primary" icon="add" onClick={openCreate} title="New ticket">
          <span className="btn-tx">New ticket</span>
        </Btn>
      </div>
    </div>
  );
}
