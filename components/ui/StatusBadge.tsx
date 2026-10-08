import type { AppointmentStatus, CallStatus } from "@/lib/types";

type BadgeVariant =
  | AppointmentStatus
  | CallStatus
  | "Booked"
  | "Info"
  | "Callback"
  | "None";

const styles: Record<BadgeVariant, string> = {
  Confirmed: "bg-success-bg text-success-text border-success-border",
  Pending: "bg-warning-bg text-warning-text border-warning-border",
  Cancelled: "bg-danger-bg text-danger-text border-danger-border",
  Completed: "bg-success-bg text-success-text border-success-border",
  Missed: "bg-danger-bg text-danger-text border-danger-border",
  "In Progress": "bg-teal-50 text-teal-700 border-teal-500/25",
  Booked: "bg-success-bg text-success-text border-success-border",
  Info: "bg-teal-50 text-teal-700 border-teal-500/25",
  Callback: "bg-warning-bg text-warning-text border-warning-border",
  None: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Shorter labels for tight row layouts; full label stays in title. */
const compactLabels: Partial<Record<string, string>> = {
  "Appointment Booked": "Booked",
  "Information Provided": "Info given",
  "Callback Requested": "Callback",
  "No Action": "No action",
  "In Progress": "In progress",
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  compact?: boolean;
}

export function StatusBadge({
  label,
  variant,
  compact = false,
}: StatusBadgeProps) {
  const display = compact ? (compactLabels[label] ?? label) : label;

  return (
    <span
      title={label}
      className={`inline-flex max-w-full items-center truncate rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap ${styles[variant]}`}
    >
      {display}
    </span>
  );
}
