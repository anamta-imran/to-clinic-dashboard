/**
 * One-time repair: normalize appointment.date/time from stored OmniDimension
 * raw payloads. Does not invent dates. Leaves unparseable records unchanged.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  isIsoDateString,
  normalizeAppointmentDate,
  normalizeAppointmentTime,
  parseOmniDimensionDateTime,
} from "../lib/dates";

const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    include: { call: true, patient: true },
  });

  let repaired = 0;
  let skipped = 0;

  for (const appointment of appointments) {
    const needsDateRepair = !isIsoDateString(appointment.date);
    const needsTimeRepair = !/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(
      appointment.time.trim(),
    );
    const needsPhoneRepair =
      (!appointment.phone || appointment.phone === "unknown") &&
      Boolean(appointment.patient?.phone || appointment.call?.phone);

    if (!needsDateRepair && !needsTimeRepair && !needsPhoneRepair) {
      skipped += 1;
      continue;
    }

    let reference =
      appointment.call?.startedAt ??
      appointment.call?.createdAt ??
      appointment.createdAt;

    let extractedDate: string | null = null;
    let extractedTime: string | null = null;
    let rawPhone: string | null = null;

    if (appointment.call?.rawPayloadJson) {
      try {
        const raw = JSON.parse(appointment.call.rawPayloadJson) as {
          call_date?: string;
          start_time?: string;
          phone_number?: string;
          from_number?: string;
          call_report?: {
            extracted_variables?: Record<string, unknown>;
          };
        };
        const started =
          parseOmniDimensionDateTime(raw.start_time) ??
          parseOmniDimensionDateTime(raw.call_date);
        if (started) reference = started;

        const extracted = raw.call_report?.extracted_variables ?? {};
        extractedDate =
          (typeof extracted.appointment_date === "string"
            ? extracted.appointment_date
            : null) ??
          (typeof extracted.date === "string" ? extracted.date : null);
        extractedTime =
          (typeof extracted.appointment_time === "string"
            ? extracted.appointment_time
            : null) ??
          (typeof extracted.time === "string" ? extracted.time : null);
        rawPhone = raw.phone_number ?? raw.from_number ?? null;
      } catch {
        // Keep existing values when raw payload cannot be parsed.
      }
    }

    const nextDate = needsDateRepair
      ? normalizeAppointmentDate(
          extractedDate ?? appointment.date,
          reference,
        )
      : appointment.date;

    const nextTime = needsTimeRepair
      ? normalizeAppointmentTime(extractedTime ?? appointment.time) ??
        appointment.time
      : appointment.time;

    const nextPhone = needsPhoneRepair
      ? appointment.patient?.phone ||
        appointment.call?.phone ||
        rawPhone ||
        appointment.phone
      : appointment.phone;

    // Only write when we successfully normalized a bad date, or other safe fixes.
    if (needsDateRepair && !nextDate) {
      skipped += 1;
      continue;
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        date: nextDate ?? appointment.date,
        time: nextTime,
        phone: nextPhone,
      },
    });
    repaired += 1;
  }

  // Align call phones from raw payload when stored as unknown.
  const calls = await prisma.call.findMany({
    where: { OR: [{ phone: "unknown" }, { phone: "" }] },
  });
  let callPhonesFixed = 0;
  for (const call of calls) {
    if (!call.rawPayloadJson) continue;
    try {
      const raw = JSON.parse(call.rawPayloadJson) as {
        phone_number?: string;
        from_number?: string;
      };
      const phone = raw.phone_number ?? raw.from_number;
      if (!phone) continue;
      await prisma.call.update({
        where: { id: call.id },
        data: { phone },
      });
      callPhonesFixed += 1;
    } catch {
      // ignore
    }
  }

  console.log(
    JSON.stringify({
      appointmentsRepaired: repaired,
      appointmentsSkipped: skipped,
      callPhonesFixed,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
