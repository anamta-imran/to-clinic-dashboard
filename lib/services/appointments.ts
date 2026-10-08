import type { AppointmentStatus as DbStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizePhone, paginatedMeta, parsePagination } from "@/lib/api";
import { mapAppointment, toDbAppointmentStatus, todayIsoDate } from "@/lib/mappers";
import type { Appointment, AppointmentStatus, PaginatedResponse } from "@/lib/types";
import type { PageSize } from "@/lib/pagination";

const include = {
  patient: true,
  doctor: true,
} as const;

export async function listAppointments(searchParams: URLSearchParams): Promise<
  PaginatedResponse<Appointment>
> {
  const { page, limit, skip } = parsePagination(searchParams);
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.trim() ?? "All";
  const date = searchParams.get("date")?.trim() ?? "all";

  const where: Prisma.AppointmentWhereInput = {};

  if (statusParam && statusParam !== "All") {
    where.status = toDbAppointmentStatus(statusParam as AppointmentStatus);
  }
  if (date && date !== "all") {
    where.date = date;
  }
  if (search) {
    where.OR = [
      { phone: { contains: search } },
      { reason: { contains: search } },
      { patient: { name: { contains: search } } },
      { doctor: { name: { contains: search } } },
    ];
  }

  const [totalItems, rows, dateRows] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      skip,
      take: limit,
    }),
    prisma.appointment.findMany({
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "asc" },
    }),
  ]);

  const meta = paginatedMeta(totalItems, page, limit as PageSize);

  return {
    items: rows.map(mapAppointment),
    ...meta,
    filters: {
      dates: dateRows.map((row) => row.date),
    },
  };
}

export async function getAppointmentById(id: string) {
  const row = await prisma.appointment.findUnique({
    where: { id },
    include,
  });
  return row ? mapAppointment(row) : null;
}

export async function updateAppointmentRecord(
  id: string,
  input: {
    patient?: string;
    phone?: string;
    doctor?: string;
    date?: string;
    time?: string;
    reason?: string;
    status?: AppointmentStatus;
  },
) {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include,
  });
  if (!existing) return null;

  let patientId = existing.patientId;
  if (input.patient || input.phone) {
    const phone = normalizePhone(input.phone ?? existing.phone) || existing.phone;
    const name = input.patient?.trim() || existing.patient.name;
    const patient = await prisma.patient.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
    });
    patientId = patient.id;
  }

  let doctorId = existing.doctorId;
  if (input.doctor) {
    const doctor = await prisma.doctor.upsert({
      where: { name: input.doctor },
      update: {},
      create: { name: input.doctor, specialty: "Orthopaedics" },
    });
    doctorId = doctor.id;
  }

  const status: DbStatus | undefined = input.status
    ? toDbAppointmentStatus(input.status)
    : undefined;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      patientId,
      doctorId,
      phone: input.phone
        ? normalizePhone(input.phone) || input.phone
        : existing.phone,
      date: input.date ?? existing.date,
      time: input.time ?? existing.time,
      reason: input.reason ?? existing.reason,
      status,
    },
    include,
  });

  if (status === "CANCELLED" && existing.status !== "CANCELLED") {
    await prisma.activity.create({
      data: {
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment cancelled",
        description: `${updated.patient.name} · ${updated.date} ${updated.time}`,
        appointmentId: updated.id,
        callId: updated.callId,
      },
    });
  } else if (
    input.patient ||
    input.phone ||
    input.doctor ||
    input.date ||
    input.time ||
    input.reason ||
    (status && status !== existing.status)
  ) {
    await prisma.activity.create({
      data: {
        type: "APPOINTMENT_UPDATED",
        title: "Appointment updated",
        description: `${updated.patient.name} · ${updated.date} ${updated.time}`,
        appointmentId: updated.id,
        callId: updated.callId,
      },
    });
  }

  return mapAppointment(updated);
}

export async function cancelAppointmentRecord(id: string) {
  return updateAppointmentRecord(id, { status: "Cancelled" });
}

export async function getTodaysUpcomingAppointments(limit = 5) {
  const today = todayIsoDate();
  const rows = await prisma.appointment.findMany({
    where: {
      date: today,
      status: { not: "CANCELLED" },
    },
    include,
    orderBy: [{ time: "asc" }],
    take: limit,
  });
  return rows.map(mapAppointment);
}
