"use client";

import { AiReceptionistBanner } from "@/components/dashboard/AiReceptionistBanner";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { RecentCallsPreview } from "@/components/dashboard/RecentCallsPreview";
import { TodaysSchedule } from "@/components/dashboard/TodaysSchedule";
import { AppShell } from "@/components/layout/AppShell";
import { useClinicData } from "@/components/providers/ClinicDataProvider";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export function DashboardHome() {
  const { dashboard, dashboardLoading, dashboardError, refreshDashboard } =
    useClinicData();

  return (
    <AppShell
      title="Dashboard"
      subtitle="Overview of today's clinic activity and AI receptionist performance."
      showSearch={false}
    >
      {dashboardLoading && !dashboard ? (
        <DashboardSkeleton />
      ) : dashboardError && !dashboard ? (
        <div className="panel px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-primary">
            Unable to load dashboard data.
          </p>
          <p className="mt-1 text-sm text-text-muted">Please try again.</p>
          <button
            type="button"
            onClick={() => void refreshDashboard()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      ) : dashboard ? (
        <div className="space-y-4">
          <AiReceptionistBanner callsToday={dashboard.metrics.callsToday} />

          <MetricCards
            todaysAppointments={dashboard.metrics.todaysAppointments}
            callsToday={dashboard.metrics.callsToday}
            bookedToday={dashboard.metrics.bookedToday}
            callTimeToday={dashboard.metrics.callTimeToday}
          />

          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.9fr)]">
            <TodaysSchedule appointments={dashboard.upcomingAppointments} />
            <RecentActivityPanel items={dashboard.recentActivity} />
          </div>

          <RecentCallsPreview calls={dashboard.recentCalls} />
        </div>
      ) : null}
    </AppShell>
  );
}
