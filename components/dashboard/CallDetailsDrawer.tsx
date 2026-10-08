"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Phone,
  Stethoscope,
  X,
} from "lucide-react";
import type { CallRecord } from "@/lib/types";
import {
  appointmentResultVariant,
  formatDisplayDate,
  formatPhoneDisplay,
  getInitials,
} from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CallDetailsDrawerProps {
  call: CallRecord | null;
  open: boolean;
  onClose: () => void;
}

export function CallDetailsDrawer({
  call,
  open,
  onClose,
}: CallDetailsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && call && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy-950/40"
            onClick={onClose}
          />

          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Call details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col bg-surface shadow-xl sm:max-w-md lg:max-w-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                  Call details
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold text-text-primary">
                  {call.patient}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon shrink-0"
                aria-label="Close call details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <section className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                  Patient
                </p>
                <div className="mt-2.5 flex min-w-0 items-center gap-3 border border-border bg-canvas/50 p-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                    {getInitials(call.patient)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {call.patient}
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-text-secondary">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {formatPhoneDisplay(call.phone)}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 min-w-0">
                <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                  Call information
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <DetailTile
                    icon={CalendarDays}
                    label="When"
                    value={call.dateLabel}
                  />
                  <DetailTile
                    icon={Clock3}
                    label="Duration"
                    value={call.duration}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[11px] text-text-muted">Status</p>
                    <StatusBadge
                      label={call.callStatus}
                      variant={call.callStatus}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[11px] text-text-muted">Result</p>
                    <StatusBadge
                      label={call.appointmentResult}
                      variant={appointmentResultVariant(call.appointmentResult)}
                    />
                  </div>
                </div>
              </section>

              <section className="mt-5 min-w-0">
                <div className="mb-2.5 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 shrink-0 text-teal-700" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Appointment
                  </h3>
                </div>
                {call.appointment ? (
                  <dl className="grid gap-3 border border-border p-3.5 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs text-text-muted">Doctor</dt>
                      <dd className="mt-0.5 break-words text-text-secondary">
                        {call.appointment.doctor}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-text-muted">Reason</dt>
                      <dd className="mt-0.5 text-text-secondary">
                        {call.appointment.reason}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Date</dt>
                      <dd className="mt-0.5 text-text-secondary">
                        {formatDisplayDate(call.appointment.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Time</dt>
                      <dd className="mt-0.5 text-text-secondary">
                        {call.appointment.time}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="border border-border bg-canvas/40 px-3.5 py-3 text-sm text-text-secondary">
                    No appointment was booked during this call.
                  </p>
                )}
              </section>

              <section className="mt-5 min-w-0">
                <h3 className="mb-2.5 text-sm font-semibold text-text-primary">
                  Transcript
                </h3>
                {call.transcript.length === 0 ? (
                  <p className="border border-border bg-canvas/40 px-3.5 py-3 text-sm text-text-secondary">
                    Transcript not available for this call.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {call.transcript.map((line, index) => {
                      const isAi = line.speaker === "AI";
                      return (
                        <div
                          key={`${call.id}-line-${index}`}
                          className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[92%] rounded px-3 py-2.5 ${
                              isAi
                                ? "border border-border bg-canvas/60"
                                : "bg-navy-900 text-white"
                            }`}
                          >
                            <p
                              className={`text-[10px] font-semibold tracking-wide uppercase ${
                                isAi ? "text-teal-700" : "text-slate-300"
                              }`}
                            >
                              {isAi ? "AI Receptionist" : "Patient"}
                            </p>
                            <p
                              className={`mt-1 text-sm leading-relaxed ${
                                isAi ? "text-text-secondary" : "text-slate-100"
                              }`}
                            >
                              {line.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border border-border p-3">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <p className="text-[11px]">{label}</p>
      </div>
      <p className="mt-1.5 break-words text-sm font-medium text-text-primary">
        {value}
      </p>
    </div>
  );
}
