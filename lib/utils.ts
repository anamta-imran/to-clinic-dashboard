import { formatDisplayDate, formatShortDate, todayIsoDate } from "@/lib/dates";
import type { Appointment, AppointmentResult, CallRecord } from "@/lib/types";

export { formatDisplayDate, formatShortDate, todayIsoDate };

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function appointmentResultVariant(
  result: AppointmentResult,
): "Booked" | "Info" | "Callback" | "None" {
  switch (result) {
    case "Appointment Booked":
      return "Booked";
    case "Information Provided":
      return "Info";
    case "Callback Requested":
      return "Callback";
    default:
      return "None";
  }
}

export function parseTimeToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function parseDurationToSeconds(duration: string): number {
  const [mins, secs] = duration.split(":").map((part) => Number(part) || 0);
  return mins * 60 + secs;
}

export function formatCallTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function getTodaysAppointments(
  appointments: Appointment[],
  today = todayIsoDate(),
): Appointment[] {
  return appointments
    .filter((item) => item.date === today && item.status !== "Cancelled")
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
}

export function getTodaysCalls(
  calls: CallRecord[],
  today = todayIsoDate(),
): CallRecord[] {
  return calls
    .filter((call) => call.datetime.startsWith(today))
    .sort((a, b) => b.datetime.localeCompare(a.datetime));
}

export function getLatestCalls(calls: CallRecord[], limit = 5): CallRecord[] {
  return [...calls]
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, limit);
}
