"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Phone,
  Settings,
  X,
} from "lucide-react";
import { useClinicData } from "@/components/providers/ClinicDataProvider";
import { useSidebar } from "@/components/providers/SidebarProvider";
import { clinicInfo } from "@/lib/clinic";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { open, closeSidebar } = useSidebar();
  const { dashboard } = useClinicData();
  const callsToday = dashboard?.metrics.callsToday ?? 0;

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNavClick = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      closeSidebar();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-navy-950/40 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden={!open}
      />

      <aside
        id="app-sidebar"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col bg-navy-900 text-white transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-teal-600 text-xs font-semibold tracking-wide">
              TO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{clinicInfo.name}</p>
              <p className="truncate text-[11px] text-slate-300">
                Orthopaedic & Trauma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="btn btn-icon shrink-0 border-0 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="rounded border border-white/10 bg-navy-800/80 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="truncate text-xs font-medium text-white">
                AI Receptionist Active
              </p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
              Handling calls · {callsToday} today
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
