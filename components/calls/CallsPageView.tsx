"use client";

import { CallsTable } from "@/components/calls/CallsTable";
import { AppShell } from "@/components/layout/AppShell";

export function CallsPageView() {
  return (
    <AppShell
      title="Calls"
      subtitle="Review and manage AI receptionist call activity"
      showSearch={false}
    >
      <CallsTable
        title="Call management"
        subtitle="Search by patient, status, result, or date"
        showFilters
      />
    </AppShell>
  );
}
