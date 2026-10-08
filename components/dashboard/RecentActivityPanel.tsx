"use client";

import {
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  PhoneIncoming,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ActivityItem, ActivityType } from "@/lib/types";

const iconMap: Record<
  ActivityType,
  { icon: typeof PhoneIncoming; className: string }
> = {
  call_received: {
    icon: PhoneIncoming,
    className: "bg-teal-50 text-teal-700",
  },
  info_collected: {
    icon: UserRound,
    className: "bg-navy-900/5 text-navy-900",
  },
  appointment_booked: {
    icon: CalendarPlus,
    className: "bg-success-bg text-success-text",
  },
  appointment_updated: {
    icon: CalendarPlus,
    className: "bg-warning-bg text-warning-text",
  },
  appointment_cancelled: {
    icon: CalendarX2,
    className: "bg-danger-bg text-danger-text",
  },
  call_completed: {
    icon: CheckCircle2,
    className: "bg-slate-100 text-slate-600",
  },
};

interface RecentActivityPanelProps {
  items: ActivityItem[];
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  const visible = items.slice(0, 6);

  return (
    <section className="panel min-w-0">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-tight text-text-primary">
          Recent Activity
        </h2>
        <p className="mt-0.5 text-sm text-text-muted">
          Latest clinic operations
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={PhoneIncoming}
          title="No recent activity."
          description="Live updates from calls and appointments will appear here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((item) => {
            const config = iconMap[item.type];
            const Icon = config.icon;
            return (
              <li
                key={item.id}
                className="flex min-w-0 gap-3 px-4 py-3 sm:px-5"
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ${config.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
