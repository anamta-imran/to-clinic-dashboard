"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Phone,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useClinicData } from "@/components/providers/ClinicDataProvider";
import { APPOINTMENT_REASONS } from "@/lib/clinic";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import {
  formatDisplayDate,
  formatPhoneDisplay,
  getInitials,
} from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  mode: "view" | "edit";
  onClose: () => void;
  onEdit: () => void;
  onSave: (appointment: Appointment) => void | Promise<void>;
  onCancelAppointment: (appointment: Appointment) => void;
}

export function AppointmentDetailsDrawer({
  appointment,
  open,
  mode,
  onClose,
  onEdit,
  onSave,
  onCancelAppointment,
}: AppointmentDetailsDrawerProps) {
  const { doctors } = useClinicData();
  const [draft, setDraft] = useState<Appointment | null>(appointment);
  const doctorOptions =
    doctors.length > 0
      ? doctors.map((doctor) => doctor.name)
      : draft?.doctor
        ? [draft.doctor]
        : [];

  useEffect(() => {
    setDraft(appointment);
  }, [appointment, mode, open]);

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

  const current = draft ?? appointment;
  const isCancelled = current?.status === "Cancelled";

  return (
    <AnimatePresence>
      {open && appointment && current && (
        <>
          <motion.div
            key="apt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy-950/40"
            onClick={onClose}
          />

          <motion.aside
            key="apt-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Appointment details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col bg-surface shadow-xl sm:max-w-md lg:max-w-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                  {mode === "edit" ? "Edit appointment" : "Appointment details"}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold text-text-primary">
                  {current.patient}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon shrink-0"
                aria-label="Close appointment details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3 border border-border bg-canvas/50 p-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                  {getInitials(current.patient)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {current.patient}
                  </p>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-text-secondary">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {formatPhoneDisplay(current.phone)}
                    </span>
                  </p>
                </div>
              </div>

              {mode === "view" ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <InfoTile
                      icon={Stethoscope}
                      label="Doctor"
                      value={current.doctor}
                    />
                    <InfoTile
                      icon={UserRound}
                      label="Reason"
                      value={current.reason}
                    />
                    <InfoTile
                      icon={CalendarDays}
                      label="Date"
                      value={formatDisplayDate(current.date)}
                    />
                    <InfoTile
                      icon={Clock3}
                      label="Time"
                      value={current.time}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-text-muted">Status</p>
                    <StatusBadge
                      label={current.status}
                      variant={current.status}
                    />
                  </div>
                </div>
              ) : (
                <form
                  className="mt-5 space-y-3.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draft) onSave(draft);
                  }}
                >
                  <Field label="Patient">
                    <input
                      value={draft?.patient ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, patient: e.target.value } : prev,
                        )
                      }
                      className="field-input"
                      required
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      value={draft?.phone ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, phone: e.target.value } : prev,
                        )
                      }
                      className="field-input"
                      required
                    />
                  </Field>
                  <Field label="Doctor">
                    <select
                      value={draft?.doctor ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, doctor: e.target.value } : prev,
                        )
                      }
                      className="field-input"
                    >
                      {doctorOptions.map((doctor) => (
                        <option key={doctor} value={doctor}>
                          {doctor}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Date">
                      <input
                        type="date"
                        value={draft?.date ?? ""}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev ? { ...prev, date: e.target.value } : prev,
                          )
                        }
                        className="field-input"
                        required
                      />
                    </Field>
                    <Field label="Time">
                      <input
                        value={draft?.time ?? ""}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev ? { ...prev, time: e.target.value } : prev,
                          )
                        }
                        className="field-input"
                        placeholder="10:00 AM"
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Reason">
                    <select
                      value={draft?.reason ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, reason: e.target.value } : prev,
                        )
                      }
                      className="field-input"
                    >
                      {APPOINTMENT_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                      {draft?.reason &&
                      !APPOINTMENT_REASONS.includes(
                        draft.reason as (typeof APPOINTMENT_REASONS)[number],
                      ) ? (
                        <option value={draft.reason}>{draft.reason}</option>
                      ) : null}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={draft?.status ?? "Pending"}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: e.target.value as AppointmentStatus,
                              }
                            : prev,
                        )
                      }
                      className="field-input"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </Field>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <button type="submit" className="btn btn-primary flex-1">
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-ghost sm:min-w-[6rem]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {mode === "view" && (
              <div className="flex flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-5">
                <button
                  type="button"
                  onClick={onEdit}
                  className="btn btn-primary flex-1"
                >
                  Edit appointment
                </button>
                <button
                  type="button"
                  disabled={isCancelled}
                  onClick={() => onCancelAppointment(current)}
                  className="btn btn-danger flex-1"
                >
                  {isCancelled ? "Already cancelled" : "Cancel appointment"}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoTile({
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
