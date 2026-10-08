import type {
  Activity as DbActivity,
  Appointment as DbAppointment,
  AppointmentResult as DbAppointmentResult,
  AppointmentStatus as DbAppointmentStatus,
  Call as DbCall,
  CallStatus as DbCallStatus,
  Doctor as DbDoctor,
  Patient as DbPatient,
} from "@prisma/client";
import { formatDateTimeLabel, formatPhoneDisplay } from "@/lib/dates";
import type {
  ActivityItem,
  ActivityType,
  Appointment,
  AppointmentResult,
  AppointmentStatus,
  CallRecord,
  CallStatus,
  TranscriptLine,
} from "@/lib/types";

type AppointmentWithRelations = DbAppointment & {
  patient: DbPatient;
  doctor: DbDoctor;
};

type CallWithRelations = DbCall & {
  patient: DbPatient | null;
  appointment:
    | (DbAppointment & {
        doctor: DbDoctor;
      })
    | null;
};

const appointmentStatusToUi: Record<DbAppointmentStatus, AppointmentStatus> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

const appointmentStatusToDb: Record<AppointmentStatus, DbAppointmentStatus> = {
  Confirmed: "CONFIRMED",
  Pending: "PENDING",
  Cancelled: "CANCELLED",
};

const callStatusToUi: Record<DbCallStatus, CallStatus> = {
  COMPLETED: "Completed",
  MISSED: "Missed",
  IN_PROGRESS: "In Progress",
};

const appointmentResultToUi: Record<DbAppointmentResult, AppointmentResult> = {
  APPOINTMENT_BOOKED: "Appointment Booked",
  INFORMATION_PROVIDED: "Information Provided",
  CALLBACK_REQUESTED: "Callback Requested",
  NO_ACTION: "No Action",
};

const activityTypeToUi: Record<DbActivity["type"], ActivityType> = {
  CALL_RECEIVED: "call_received",
  INFO_COLLECTED: "info_collected",
  APPOINTMENT_BOOKED: "appointment_booked",
  APPOINTMENT_UPDATED: "appointment_updated",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  CALL_COMPLETED: "call_completed",
};

export function toDbAppointmentStatus(
  status: AppointmentStatus,
): DbAppointmentStatus {
  return appointmentStatusToDb[status];
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function parseTranscriptJson(
  value: string | null | undefined,
): TranscriptLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("speaker" in item) ||
          !("text" in item)
        ) {
          return null;
        }
        const speaker = (item as { speaker: string }).speaker;
        const text = String((item as { text: unknown }).text ?? "").trim();
        if (!text) return null;
        if (speaker === "AI" || speaker === "Patient") {
          return { speaker, text } as TranscriptLine;
        }
        return null;
      })
      .filter((line): line is TranscriptLine => Boolean(line));
  } catch {
    return [];
  }
}

export function mapAppointment(
  appointment: AppointmentWithRelations,
): Appointment {
  const phone =
    appointment.phone ||
    appointment.patient.phone ||
    "";

  return {
    id: appointment.id,
    patient: appointment.patient.name,
    doctor: appointment.doctor.name,
    date: appointment.date,
    time: appointment.time,
    phone: formatPhoneDisplay(phone) === "Unavailable" ? "" : phone,
    reason: appointment.reason,
    status: appointmentStatusToUi[appointment.status],
    source: appointment.source,
    callId: appointment.callId,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export function mapCall(call: CallWithRelations): CallRecord {
  const patientName =
    call.patient?.name ?? call.patientName ?? "Unknown caller";
  const sourceTime = call.startedAt ?? call.createdAt;
  const phone =
    call.phone ||
    call.patient?.phone ||
    "";

  return {
    id: call.id,
    patient: patientName,
    phone: formatPhoneDisplay(phone) === "Unavailable" ? "" : phone,
    dateLabel: formatDateTimeLabel(sourceTime),
    datetime: sourceTime.toISOString(),
    duration: formatDuration(call.durationSeconds),
    callStatus: callStatusToUi[call.callStatus],
    appointmentResult: appointmentResultToUi[call.appointmentResult],
    appointment: call.appointment
      ? {
          doctor: call.appointment.doctor.name,
          date: call.appointment.date,
          time: call.appointment.time,
          reason: call.appointment.reason,
        }
      : undefined,
    transcript: parseTranscriptJson(call.transcriptJson),
    summary: call.summary,
    omnidimCallId: call.omnidimCallId,
  };
}

export function mapActivity(activity: DbActivity): ActivityItem {
  return {
    id: activity.id,
    type: activityTypeToUi[activity.type],
    title: activity.title,
    description: activity.description,
    timestamp: formatRelativeTime(activity.createdAt),
    callId: activity.callId,
    appointmentId: activity.appointmentId,
    createdAt: activity.createdAt.toISOString(),
  };
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
  });
}

export { todayIsoDate, dayBounds } from "@/lib/dates";
