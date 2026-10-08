import { prisma } from "@/lib/db";
import { formatCallTime } from "@/lib/utils";
import { dayBounds, mapActivity, mapAppointment, mapCall, todayIsoDate } from "@/lib/mappers";
import type { DashboardResponse } from "@/lib/types";

export async function getDashboardData(): Promise<DashboardResponse> {
  const today = todayIsoDate();
  const { start, end } = dayBounds(today);

  const [
    todaysAppointmentsCount,
    callsToday,
    bookedToday,
    callDurationAgg,
    upcoming,
    recentCalls,
    recentActivity,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        date: today,
        status: { not: "CANCELLED" },
      },
    }),
    prisma.call.count({
      where: {
        OR: [
          { startedAt: { gte: start, lte: end } },
          {
            AND: [{ startedAt: null }, { createdAt: { gte: start, lte: end } }],
          },
        ],
      },
    }),
    prisma.call.count({
      where: {
        appointmentResult: "APPOINTMENT_BOOKED",
        OR: [
          { startedAt: { gte: start, lte: end } },
          {
            AND: [{ startedAt: null }, { createdAt: { gte: start, lte: end } }],
          },
        ],
      },
    }),
    prisma.call.aggregate({
      _sum: { durationSeconds: true },
      where: {
        OR: [
          { startedAt: { gte: start, lte: end } },
          {
            AND: [{ startedAt: null }, { createdAt: { gte: start, lte: end } }],
          },
        ],
      },
    }),
    prisma.appointment.findMany({
      where: {
        date: today,
        status: { not: "CANCELLED" },
      },
      include: { patient: true, doctor: true },
      orderBy: [{ time: "asc" }],
      take: 5,
    }),
    prisma.call.findMany({
      include: {
        patient: true,
        appointment: { include: { doctor: true } },
      },
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const callTimeTodaySeconds = callDurationAgg._sum.durationSeconds ?? 0;

  return {
    metrics: {
      todaysAppointments: todaysAppointmentsCount,
      callsToday,
      bookedToday,
      callTimeTodaySeconds,
      callTimeToday: formatCallTime(callTimeTodaySeconds),
    },
    upcomingAppointments: upcoming.map(mapAppointment),
    recentCalls: recentCalls.map(mapCall),
    recentActivity: recentActivity.map(mapActivity),
    generatedAt: new Date().toISOString(),
  };
}
