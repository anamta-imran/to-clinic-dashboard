import type {
  MappedOmniDimensionCall,
  MappedTranscriptLine,
  OmniDimensionInteraction,
  OmniDimensionWebhookPayload,
} from "@/lib/omnidimension/types";
import { normalizePhone } from "@/lib/api";

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  // OmniDimension examples use "YYYY-MM-DD HH:mm:ss"
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDurationSeconds(
  value: unknown,
  startedAt: Date | null,
  endedAt: Date | null,
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  const text = asString(value);
  if (text && /^\d+(\.\d+)?$/.test(text)) {
    return Math.max(0, Math.round(Number(text)));
  }
  if (startedAt && endedAt) {
    return Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    );
  }
  return 0;
}

function mapCallStatus(
  status: string | null,
): MappedOmniDimensionCall["callStatus"] {
  const value = (status ?? "").toLowerCase();
  if (
    value.includes("miss") ||
    value.includes("no_answer") ||
    value.includes("busy") ||
    value.includes("failed") ||
    value.includes("cancel")
  ) {
    return "MISSED";
  }
  if (value.includes("progress") || value.includes("ring")) {
    return "IN_PROGRESS";
  }
  return "COMPLETED";
}

function truthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = asString(value)?.toLowerCase();
  return text === "true" || text === "yes" || text === "1";
}

function interactionsToTranscript(
  interactions: OmniDimensionInteraction[] | null | undefined,
): MappedTranscriptLine[] {
  if (!interactions?.length) return [];

  const lines: MappedTranscriptLine[] = [];
  const sorted = [...interactions].sort(
    (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
  );

  for (const item of sorted) {
    // Documented interaction shape: user_query is the caller turn (or false),
    // followed by bot_response for that step.
    if (typeof item.user_query === "string") {
      const user = asString(item.user_query);
      if (user) lines.push({ speaker: "Patient", text: user });
    }

    const bot = asString(item.bot_response);
    if (bot) lines.push({ speaker: "AI", text: bot });
  }

  return lines;
}

function conversationStringToTranscript(
  conversation: string | null,
): MappedTranscriptLine[] {
  if (!conversation) return [];

  const lines: MappedTranscriptLine[] = [];
  const chunks = conversation
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const aiMatch = chunk.match(
      /^(AI|Bot|Agent|Receptionist|AI Receptionist)\s*[:\-]\s*(.+)$/i,
    );
    if (aiMatch?.[2]) {
      lines.push({ speaker: "AI", text: aiMatch[2].trim() });
      continue;
    }
    const patientMatch = chunk.match(
      /^(Patient|User|Caller|Customer)\s*[:\-]\s*(.+)$/i,
    );
    if (patientMatch?.[2]) {
      lines.push({ speaker: "Patient", text: patientMatch[2].trim() });
      continue;
    }
  }

  // If labels are absent, do not invent speakers — return empty and rely on interactions.
  return lines;
}

function extractAppointment(
  extracted: Record<string, unknown>,
): MappedOmniDimensionCall["appointment"] {
  const cancelled =
    truthy(extracted.appointment_cancelled) ||
    truthy(extracted.cancelled) ||
    asString(extracted.appointment_status)?.toLowerCase() === "cancelled";

  const booked =
    truthy(extracted.appointment_booked) ||
    truthy(extracted.booked) ||
    Boolean(
      asString(extracted.appointment_date) ||
        asString(extracted.date) ||
        asString(extracted.appointment_time) ||
        asString(extracted.time),
    );

  if (!booked && !cancelled) return null;

  const statusRaw = asString(extracted.appointment_status)?.toUpperCase();
  let status: "CONFIRMED" | "PENDING" | "CANCELLED" | null = null;
  if (cancelled || statusRaw === "CANCELLED") status = "CANCELLED";
  else if (statusRaw === "PENDING") status = "PENDING";
  else if (statusRaw === "CONFIRMED" || booked) status = "CONFIRMED";

  return {
    doctorName:
      asString(extracted.doctor) ??
      asString(extracted.doctor_name) ??
      asString(extracted.physician),
    date:
      asString(extracted.appointment_date) ??
      asString(extracted.date) ??
      asString(extracted.scheduled_date),
    time:
      asString(extracted.appointment_time) ??
      asString(extracted.time) ??
      asString(extracted.scheduled_time),
    reason:
      asString(extracted.reason) ??
      asString(extracted.appointment_reason) ??
      asString(extracted.appointment_type) ??
      asString(extracted.complaint),
    status,
    cancelled,
  };
}

function deriveAppointmentResult(
  extracted: Record<string, unknown>,
  appointment: MappedOmniDimensionCall["appointment"],
): MappedOmniDimensionCall["appointmentResult"] {
  if (appointment && !appointment.cancelled) return "APPOINTMENT_BOOKED";
  if (
    truthy(extracted.callback_requested) ||
    truthy(extracted.callback) ||
    asString(extracted.result)?.toLowerCase().includes("callback")
  ) {
    return "CALLBACK_REQUESTED";
  }
  if (
    truthy(extracted.information_provided) ||
    asString(extracted.result)?.toLowerCase().includes("information")
  ) {
    return "INFORMATION_PROVIDED";
  }
  return "NO_ACTION";
}

export function mapOmniDimensionPayload(
  payload: OmniDimensionWebhookPayload,
): MappedOmniDimensionCall {
  const report = payload.call_report ?? {};
  const extracted =
    report.extracted_variables && typeof report.extracted_variables === "object"
      ? report.extracted_variables
      : {};

  const phoneRaw =
    asString(payload.phone_number) ??
    asString(payload.from_number) ??
    asString(extracted.phone) ??
    asString(extracted.phone_number) ??
    "unknown";

  const phone = normalizePhone(phoneRaw) || phoneRaw;
  const omnidimCallId =
    asString(payload.call_id) ?? asString(payload.call_sid);
  const startedAt =
    parseDate(payload.start_time) ?? parseDate(payload.call_date);
  const endedAt = parseDate(payload.end_time);
  const durationSeconds = parseDurationSeconds(
    payload.call_duration,
    startedAt,
    endedAt,
  );

  const transcriptFromInteractions = interactionsToTranscript(
    report.interactions,
  );
  const transcript =
    transcriptFromInteractions.length > 0
      ? transcriptFromInteractions
      : conversationStringToTranscript(
          asString(report.full_conversation) ??
            asString(report.call_conversation),
        );

  const appointment = extractAppointment(extracted);
  const patientName =
    asString(extracted.patient_name) ??
    asString(extracted.name) ??
    asString(extracted.caller_name);

  const eventKey =
    omnidimCallId ??
    `${phone}:${startedAt?.toISOString() ?? "unknown"}:${durationSeconds}`;

  return {
    eventKey: `omnidim:${eventKey}`,
    omnidimCallId,
    phone,
    patientName,
    startedAt,
    endedAt,
    durationSeconds,
    callStatus: mapCallStatus(asString(payload.call_status)),
    appointmentResult: deriveAppointmentResult(extracted, appointment),
    transcript,
    summary: asString(report.summary),
    recordingUrl: asString(payload.recording_url),
    extracted,
    appointment,
    agentId:
      asString(payload.bot_id) ??
      asString(payload.agent_id) ??
      asString(process.env.OMNIDIMENSION_AGENT_ID),
    raw: payload,
  };
}
