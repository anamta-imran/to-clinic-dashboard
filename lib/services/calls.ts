import type { AppointmentResult, CallStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paginatedMeta, parsePagination } from "@/lib/api";
import { dayBounds, toZonedIsoDate } from "@/lib/dates";
import { mapCall } from "@/lib/mappers";
import type { CallRecord, PaginatedResponse } from "@/lib/types";
import type { PageSize } from "@/lib/pagination";

const include = {
  patient: true,
  appointment: {
    include: { doctor: true },
  },
} as const;

const resultToDb: Record<string, AppointmentResult> = {
  "Appointment Booked": "APPOINTMENT_BOOKED",
  "Information Provided": "INFORMATION_PROVIDED",
  "Callback Requested": "CALLBACK_REQUESTED",
  "No Action": "NO_ACTION",
};

const statusToDb: Record<string, CallStatus> = {
  Completed: "COMPLETED",
  Missed: "MISSED",
  "In Progress": "IN_PROGRESS",
};

export async function listCalls(
  searchParams: URLSearchParams,
): Promise<PaginatedResponse<CallRecord>> {
  const { page, limit, skip } = parsePagination(searchParams);
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.trim() ?? "All";
  const resultParam = searchParams.get("result")?.trim() ?? "All";
  const date = searchParams.get("date")?.trim() ?? "all";

  const where: Prisma.CallWhereInput = {};

  if (statusParam && statusParam !== "All" && statusToDb[statusParam]) {
    where.callStatus = statusToDb[statusParam];
  }
  if (resultParam && resultParam !== "All" && resultToDb[resultParam]) {
    where.appointmentResult = resultToDb[resultParam];
  }
  if (date && date !== "all") {
    const { start, end } = dayBounds(date);
    where.OR = [
      { startedAt: { gte: start, lte: end } },
      {
        AND: [{ startedAt: null }, { createdAt: { gte: start, lte: end } }],
      },
    ];
  }
  if (search) {
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { phone: { contains: search } },
          { patientName: { contains: search } },
          { patient: { name: { contains: search } } },
        ],
      },
    ];
  }

  const [totalItems, rows, dateRows] = await Promise.all([
    prisma.call.count({ where }),
    prisma.call.findMany({
      where,
      include,
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.call.findMany({
      select: { startedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const dates = Array.from(
    new Set(
      dateRows.map((row) => toZonedIsoDate(row.startedAt ?? row.createdAt)),
    ),
  ).sort();

  const meta = paginatedMeta(totalItems, page, limit as PageSize);

  return {
    items: rows.map(mapCall),
    ...meta,
    filters: { dates },
  };
}

export async function getCallById(id: string) {
  const row = await prisma.call.findUnique({
    where: { id },
    include,
  });
  return row ? mapCall(row) : null;
}

export async function getRecentCalls(limit = 5) {
  const rows = await prisma.call.findMany({
    include,
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(mapCall);
}
