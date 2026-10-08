"use client";

import { AppointmentsTable } from "@/components/appointments/AppointmentsTable";
import { AppShell } from "@/components/layout/AppShell";

export function AppointmentsPageView() {
  return (
    <AppShell
      title="Appointments"
      subtitle="Search, filter, and manage clinic consultations"
      showSearch={false}
    >
      <AppointmentsTable
        title="All appointments"
        subtitle="Complete appointment schedule with search and pagination"
      />
    </AppShell>
  );
}
