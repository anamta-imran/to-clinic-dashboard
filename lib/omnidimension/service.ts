import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mapOmniDimensionPayload } from "@/lib/omnidimension/mapper";
import type { OmniDimensionWebhookPayload } from "@/lib/omnidimension/types";
import { normalizePhone } from "@/lib/api";

const OMNIDIM_API_BASE = "https://api.omnidim.io";

export function getOmniDimensionConfig() {
  return {
    apiKey: process.env.OMNIDIMENSION_API_KEY?.trim() || "",
    agentId: process.env.OMNIDIMENSION_AGENT_ID?.trim() || "264841",
    webhookSecret: process.env.OMNIDIMENSION_WEBHOOK_SECRET?.trim() || "",
  };
}

/**
 * Validate webhook authenticity when a shared secret is configured.
 * OmniDimension docs emphasize configuring a webhook URL; secret header
 * validation is supported when OMNIDIMENSION_WEBHOOK_SECRET is set.
 *
 * Accepted mechanisms:
 * - Authorization: Bearer <secret>
 * - x-omnidim-signature / x-webhook-secret header equals secret
 * - HMAC SHA-256 of raw body in x-omnidim-signature (hex), if body provided
 */
export function validateOmniDimensionWebhook(options: {
  headers: Headers;
  rawBody?: string;
}): { ok: true } | { ok: false; reason: string } {
  const { webhookSecret } = getOmniDimensionConfig();
  if (!webhookSecret) {
    // Structure is ready; secret is optional until configured in OmniDimension.
    return { ok: true };
  }

  const auth = options.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (safeEqual(token, webhookSecret)) return { ok: true };
  }

  const direct =
    options.headers.get("x-omnidim-signature") ??
    options.headers.get("x-webhook-secret") ??
    options.headers.get("x-omnidim-secret");

  if (direct && safeEqual(direct, webhookSecret)) {
    return { ok: true };
  }

  if (options.rawBody && direct) {
    const digest = createHmac("sha256", webhookSecret)
      .update(options.rawBody)
      .digest("hex");
    if (safeEqual(digest, direct)) return { ok: true };
  }

  return { ok: false, reason: "Invalid webhook signature" };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function findOrCreatePatient(phone: string, name: string | null) {
  const normalized = normalizePhone(phone) || phone;
  const existing = await prisma.patient.findUnique({
    where: { phone: normalized },
  });
  if (existing) {
    if (name && existing.name !== name && existing.name === "Unknown caller") {
      return prisma.patient.update({
        where: { id: existing.id },
        data: { name },
      });
    }
    return existing;
  }
  return prisma.patient.create({
    data: {
      phone: normalized,
      name: name?.trim() || "Unknown caller",
    },
  });
}

async function resolveDoctorId(doctorName?: string | null) {
  if (doctorName) {
    const byName = await prisma.doctor.findFirst({
      where: { name: { equals: doctorName } },
    });
    if (byName) return byName.id;

    const fuzzy = await prisma.doctor.findFirst({
      where: { name: { contains: doctorName } },
    });
    if (fuzzy) return fuzzy.id;

    const created = await prisma.doctor.create({
      data: { name: doctorName, specialty: "Orthopaedics" },
    });
    return created.id;
  }

  const fallback = await prisma.doctor.findFirst({ orderBy: { name: "asc" } });
  if (!fallback) {
    const created = await prisma.doctor.create({
      data: {
        name: "Dr. Khan Shah Azam",
        specialty: "Orthopaedic Surgery",
      },
    });
    return created.id;
  }
  return fallback.id;
}

export async function processOmniDimensionWebhook(
  payload: OmniDimensionWebhookPayload,
): Promise<{
  duplicate: boolean;
  callId: string;
  appointmentId: string | null;
}> {
  const mapped = mapOmniDimensionPayload(payload);

  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventKey: mapped.eventKey },
  });
  if (existingEvent) {
    const existingCall = mapped.omnidimCallId
      ? await prisma.call.findUnique({
          where: { omnidimCallId: mapped.omnidimCallId },
          include: { appointment: true },
        })
      : null;
    return {
      duplicate: true,
      callId: existingCall?.id ?? "",
      appointmentId: existingCall?.appointment?.id ?? null,
    };
  }

  const patient = await findOrCreatePatient(mapped.phone, mapped.patientName);

  const callData: Prisma.CallCreateInput = {
    omnidimCallId: mapped.omnidimCallId,
    phone: patient.phone,
    patientName: mapped.patientName ?? patient.name,
    startedAt: mapped.startedAt,
    endedAt: mapped.endedAt,
    durationSeconds: mapped.durationSeconds,
    callStatus: mapped.callStatus,
    appointmentResult: mapped.appointmentResult,
    transcriptJson:
      mapped.transcript.length > 0
        ? JSON.stringify(mapped.transcript)
        : null,
    summary: mapped.summary,
    recordingUrl: mapped.recordingUrl,
    rawPayloadJson: JSON.stringify(mapped.raw),
    patient: { connect: { id: patient.id } },
  };

  let call = mapped.omnidimCallId
    ? await prisma.call.findUnique({
        where: { omnidimCallId: mapped.omnidimCallId },
      })
    : null;

  if (call) {
    call = await prisma.call.update({
      where: { id: call.id },
      data: {
        phone: patient.phone,
        patientName: mapped.patientName ?? patient.name,
        startedAt: mapped.startedAt,
        endedAt: mapped.endedAt,
        durationSeconds: mapped.durationSeconds,
        callStatus: mapped.callStatus,
        appointmentResult: mapped.appointmentResult,
        transcriptJson:
          mapped.transcript.length > 0
            ? JSON.stringify(mapped.transcript)
            : call.transcriptJson,
        summary: mapped.summary,
        recordingUrl: mapped.recordingUrl,
        rawPayloadJson: JSON.stringify(mapped.raw),
        patientId: patient.id,
      },
    });
  } else {
    call = await prisma.call.create({ data: callData });
  }

  await prisma.activity.create({
    data: {
      type: "CALL_RECEIVED",
      title: "New call received",
      description: `${patient.name} · ${patient.phone}`,
      callId: call.id,
    },
  });

  if (mapped.patientName) {
    await prisma.activity.create({
      data: {
        type: "INFO_COLLECTED",
        title: "Patient information collected",
        description: mapped.patientName,
        callId: call.id,
      },
    });
  }

  let appointmentId: string | null = null;
  const appointmentInfo = mapped.appointment;

  if (appointmentInfo?.cancelled) {
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { callId: call.id },
          {
            patientId: patient.id,
            date: appointmentInfo.date ?? undefined,
            time: appointmentInfo.time ?? undefined,
          },
        ],
      },
    });

    if (existingAppointment) {
      await prisma.appointment.update({
        where: { id: existingAppointment.id },
        data: { status: "CANCELLED" },
      });
      appointmentId = existingAppointment.id;
      await prisma.activity.create({
        data: {
          type: "APPOINTMENT_CANCELLED",
          title: "Appointment cancelled",
          description: `${patient.name}'s appointment was cancelled`,
          callId: call.id,
          appointmentId,
        },
      });
    }
  } else if (
    appointmentInfo &&
    mapped.appointmentResult === "APPOINTMENT_BOOKED" &&
    appointmentInfo.date
  ) {
    // Only persist appointments with a normalized YYYY-MM-DD date.
    // Never invent a date when OmniDimension sent unparseable natural language.
    const doctorId = await resolveDoctorId(appointmentInfo.doctorName);
    const date = appointmentInfo.date;
    const time = appointmentInfo.time ?? "10:00 AM";
    const reason = appointmentInfo.reason ?? "Consultation";
    const callerPhone = patient.phone || mapped.phone;

    const existingByCall = await prisma.appointment.findUnique({
      where: { callId: call.id },
    });

    if (existingByCall) {
      const updated = await prisma.appointment.update({
        where: { id: existingByCall.id },
        data: {
          patientId: patient.id,
          doctorId,
          phone: callerPhone,
          date,
          time,
          reason,
          status: appointmentInfo.status ?? "CONFIRMED",
          source: "OMNIDIMENSION",
        },
      });
      appointmentId = updated.id;
    } else {
      const created = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          phone: callerPhone,
          date,
          time,
          reason,
          status: appointmentInfo.status ?? "CONFIRMED",
          source: "OMNIDIMENSION",
          callId: call.id,
        },
      });
      appointmentId = created.id;
      await prisma.activity.create({
        data: {
          type: "APPOINTMENT_BOOKED",
          title: "Appointment booked",
          description: `${patient.name} · ${date} ${time}`,
          callId: call.id,
          appointmentId,
        },
      });
    }
  }

  await prisma.activity.create({
    data: {
      type: "CALL_COMPLETED",
      title: "Call completed",
      description: `${patient.name} · ${mapped.callStatus.toLowerCase().replace("_", " ")}`,
      callId: call.id,
      appointmentId,
    },
  });

  await prisma.webhookEvent.create({
    data: {
      eventKey: mapped.eventKey,
      provider: "omnidimension",
      payloadJson: JSON.stringify(mapped.raw),
    },
  });

  return { duplicate: false, callId: call.id, appointmentId };
}

/**
 * Optional helper for server-side OmniDimension REST calls.
 * Docs: Authorization Bearer + https://api.omnidim.io
 * Do not call from client components.
 */
export async function omnidimensionFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { apiKey } = getOmniDimensionConfig();
  if (!apiKey) {
    throw new Error(
      "OMNIDIMENSION_API_KEY is not configured. Add it to server environment variables.",
    );
  }

  return fetch(`${OMNIDIM_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
