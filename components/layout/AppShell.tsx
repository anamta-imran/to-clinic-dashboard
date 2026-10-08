"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/components/providers/SidebarProvider";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function AppShell({
  title,
  subtitle,
  children,
  searchValue = "",
  onSearchChange,
  showSearch = true,
}: AppShellProps) {
  const { open } = useSidebar();
  const [localSearch, setLocalSearch] = useState("");

  const value = onSearchChange ? searchValue : localSearch;
  const handleSearch = onSearchChange ?? setLocalSearch;

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <Sidebar />

      <div
        className={`min-w-0 transition-[padding] duration-300 ease-out ${
          open ? "lg:pl-[var(--sidebar-width)]" : "lg:pl-0"
        }`}
      >
        <Header
          title={title}
          subtitle={subtitle}
          searchValue={value}
          onSearchChange={handleSearch}
          showSearch={showSearch}
        />
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto min-w-0 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
