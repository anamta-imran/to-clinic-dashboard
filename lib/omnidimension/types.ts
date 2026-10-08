/**
 * OmniDimension post-call webhook payload shapes based on official docs:
 * https://docs.omnidim.io/docs/integrations/zapier-make-n8n
 * https://docs.omnidim.io/docs/per-call-post-call-actions
 * https://docs.omnidim.io/docs/dashboard-guides/post-call
 *
 * Field names follow documented examples. Unknown fields are tolerated.
 */

export interface OmniDimensionInteraction {
  sequence?: number;
  user_query?: string | boolean | null;
  bot_response?: string | null;
  time?: string;
}

export interface OmniDimensionCallReport {
  summary?: string | null;
  sentiment?: string | null;
  extracted_variables?: Record<string, unknown> | null;
  full_conversation?: string | null;
  call_conversation?: string | null;
  interactions?: OmniDimensionInteraction[] | null;
}

export interface OmniDimensionWebhookPayload {
  call_id?: string | number;
  call_sid?: string;
  bot_id?: string | number;
  agent_id?: string | number;
  bot_name?: string;
  phone_number?: string;
  from_number?: string;
  to_number?: string;
  call_direction?: string;
  call_date?: string;
  start_time?: string;
  end_time?: string;
  call_duration?: number | string;
  call_status?: string;
  recording_url?: string | null;
  call_report?: OmniDimensionCallReport | null;
  [key: string]: unknown;
}

export interface MappedTranscriptLine {
  speaker: "AI" | "Patient";
  text: string;
}

export interface MappedOmniDimensionCall {
  eventKey: string;
  omnidimCallId: string | null;
  phone: string;
  patientName: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number;
  callStatus: "COMPLETED" | "MISSED" | "IN_PROGRESS";
  appointmentResult:
    | "APPOINTMENT_BOOKED"
    | "INFORMATION_PROVIDED"
    | "CALLBACK_REQUESTED"
    | "NO_ACTION";
  transcript: MappedTranscriptLine[];
  summary: string | null;
  recordingUrl: string | null;
  extracted: Record<string, unknown>;
  appointment?: {
    doctorName?: string | null;
    date?: string | null;
    time?: string | null;
    reason?: string | null;
    status?: "CONFIRMED" | "PENDING" | "CANCELLED" | null;
    cancelled?: boolean;
  } | null;
  agentId: string | null;
  raw: OmniDimensionWebhookPayload;
}
