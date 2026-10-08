"use client";

import Link from "next/link";
import { ArrowRight, CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Appointment } from "@/lib/types";

interface TodaysScheduleProps {
  appointments: Appointment[];
}

export function TodaysSchedule({ appointments }: TodaysScheduleProps) {
  const items = appointments.slice(0, 5);

  return (
    <section className="panel min-w-0">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-text-primary">
            Today&apos;s Schedule
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Next upcoming consultations
          </p>
        </div>
        <p className="shrink-0 pt-1 text-xs text-text-muted">
          {Math.min(items.length, 5)} shown
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No appointments scheduled for today."
          description="New bookings from the AI receptionist will appear here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((appointment) => (
            <li
              key={appointment.id}
              className="flex min-w-0 items-start gap-3 px-4 py-3.5 sm:px-5"
            >
              <div className="w-20 shrink-0 pt-0.5 sm:w-24">
                <p className="text-sm font-semibold text-navy-900">
                  {appointment.time}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {appointment.patient}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {appointment.doctor}
                    </p>
                  </div>
                  <StatusBadge
                    label={appointment.status}
                    variant={appointment.status}
                    compact
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {appointment.reason}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition hover:text-teal-600"
        >
          View all appointments
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
