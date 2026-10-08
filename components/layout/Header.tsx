"use client";

import { Bell, Menu } from "lucide-react";
import { useSidebar } from "@/components/providers/SidebarProvider";
import { clinicInfo } from "@/lib/clinic";
import { SearchInput } from "@/components/ui/SearchInput";

interface HeaderProps {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
}

export function Header({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const { open, openSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {!open ? (
            <button
              type="button"
              onClick={openSidebar}
              className="btn btn-ghost btn-icon shrink-0"
              aria-label="Open sidebar"
              title="Open sidebar"
              aria-controls="app-sidebar"
              aria-expanded={false}
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-text-primary">
              {title}
            </h1>
            <p className="truncate text-xs text-text-muted">{subtitle}</p>
          </div>

          {showSearch ? (
            <div className="hidden min-w-0 flex-1 md:block md:max-w-[16rem] lg:max-w-[18rem]">
              <SearchInput
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search patients, calls..."
              />
            </div>
          ) : null}

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <div className="flex max-w-[9.5rem] items-center gap-2 border border-border bg-canvas px-2 py-1.5 sm:max-w-none">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-navy-900 text-[10px] font-semibold text-white">
                TO
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-medium text-text-primary">
                  {clinicInfo.name}
                </p>
                <p className="truncate text-[11px] text-text-muted">Front Desk</p>
              </div>
            </div>
          </div>
        </div>

        {showSearch ? (
          <div className="md:hidden">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Search patients, calls..."
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
