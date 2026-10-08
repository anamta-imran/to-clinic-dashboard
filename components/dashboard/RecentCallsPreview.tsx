"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Eye, PhoneOff } from "lucide-react";
import { CallDetailsDrawer } from "@/components/dashboard/CallDetailsDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchJson } from "@/lib/client-api";
import type { CallRecord } from "@/lib/types";
import { appointmentResultVariant, getInitials } from "@/lib/utils";

interface RecentCallsPreviewProps {
  calls: CallRecord[];
}

export function RecentCallsPreview({ calls }: RecentCallsPreviewProps) {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = calls.slice(0, 5);

  return (
    <>
      <section className="panel min-w-0">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-text-primary">
              Recent Calls
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Latest AI receptionist conversations
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={PhoneOff}
            title="No recent calls"
            description="Incoming calls will appear here as they are handled."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((call) => (
              <li
                key={call.id}
                className="flex min-w-0 items-start gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-semibold text-teal-700">
                  {getInitials(call.patient)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {call.patient}
                      </p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                        <span className="truncate">{call.dateLabel}</span>
                        <span className="text-border-strong">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-text-muted" />
                          {call.duration}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCall(call);
                        setDrawerOpen(true);
                        void fetchJson<CallRecord>(`/api/calls/${call.id}`)
                          .then(setSelectedCall)
                          .catch(() => undefined);
                      }}
                      className="btn btn-secondary btn-sm btn-icon shrink-0"
                      title="View call details"
                      aria-label={`View call details for ${call.patient}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex min-w-0 flex-wrap gap-1.5">
                    <StatusBadge
                      label={call.callStatus}
                      variant={call.callStatus}
                      compact
                    />
                    <StatusBadge
                      label={call.appointmentResult}
                      variant={appointmentResultVariant(call.appointmentResult)}
                      compact
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-4 py-3 sm:px-5">
          <Link
            href="/calls"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition hover:text-teal-600"
          >
            View all calls
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <CallDetailsDrawer
        call={selectedCall}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
