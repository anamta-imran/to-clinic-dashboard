export const CLINIC_TIMEZONE = "Asia/Karachi";

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

export function todayIsoDate(timeZone = CLINIC_TIMEZONE): string {
  return toZonedIsoDate(new Date(), timeZone);
}

export function dayBounds(
  isoDate: string,
  timeZone = CLINIC_TIMEZONE,
): { start: Date; end: Date } {
  // Karachi is UTC+5 year-round (no DST).
  const offset =
    timeZone === CLINIC_TIMEZONE || timeZone === "Asia/Karachi" ? "+05:00" : "Z";
  const start = new Date(`${isoDate}T00:00:00${offset}`);
  const end = new Date(`${isoDate}T23:59:59.999${offset}`);
  return { start, end };
}

export function toZonedIsoDate(
  date: Date,
  timeZone = CLINIC_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isIsoDateString(value: string | null | undefined): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  probe.setUTCDate(probe.getUTCDate() + days);
  return probe.toISOString().slice(0, 10);
}

function weekdayIndexFromIso(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function nextWeekdayIso(refIso: string, targetWeekday: number): string {
  const current = weekdayIndexFromIso(refIso);
  const delta = (targetWeekday - current + 7) % 7;
  return addDaysToIsoDate(refIso, delta);
}

function looksLikePlaceholder(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return (
    !lower ||
    lower.startsWith("test value") ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na"
  );
}

function parseMonthDayYear(
  text: string,
  referenceIso: string,
): string | null {
  // October 15, 2026 | Oct 15 2026 | 15 October 2026 | October 15
  const monthFirst =
    text.match(
      /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i,
    ) ?? null;
  const dayFirst =
    text.match(
      /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:,?\s*(\d{4}))?$/i,
    ) ?? null;

  let monthName: string | undefined;
  let day: number | undefined;
  let year: number | undefined;

  if (monthFirst) {
    monthName = monthFirst[1];
    day = Number(monthFirst[2]);
    year = monthFirst[3] ? Number(monthFirst[3]) : undefined;
  } else if (dayFirst) {
    day = Number(dayFirst[1]);
    monthName = dayFirst[2];
    year = dayFirst[3] ? Number(dayFirst[3]) : undefined;
  } else {
    return null;
  }

  const month = MONTH_INDEX[monthName.toLowerCase()];
  if (month === undefined || !day || day < 1 || day > 31) return null;

  const refYear = Number(referenceIso.slice(0, 4));
  const candidateYear = year ?? refYear;
  let iso = `${candidateYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (!isIsoDateString(iso)) return null;

  // If year omitted and date already passed relative to reference, use next year.
  if (!year && iso < referenceIso) {
    iso = `${candidateYear + 1}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!isIsoDateString(iso)) return null;
  }

  return iso;
}

/**
 * Normalize OmniDimension appointment_date values (including natural language)
 * into YYYY-MM-DD using the call timestamp as the reference in Asia/Karachi.
 */
export function normalizeAppointmentDate(
  raw: string | null | undefined,
  reference: Date,
  timeZone = CLINIC_TIMEZONE,
): string | null {
  const text = raw?.trim() ?? "";
  if (!text || looksLikePlaceholder(text)) return null;

  if (isIsoDateString(text)) return text;

  const slashMatch = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slashMatch) {
    const iso = `${slashMatch[1]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[3].padStart(2, "0")}`;
    return isIsoDateString(iso) ? iso : null;
  }

  const dmyMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
    return isIsoDateString(iso) ? iso : null;
  }

  const refIso = toZonedIsoDate(reference, timeZone);
  const lower = text.toLowerCase().replace(/[,]/g, " ").replace(/\s+/g, " ").trim();

  if (lower === "today") return refIso;
  if (lower === "tomorrow") return addDaysToIsoDate(refIso, 1);
  if (lower === "yesterday") return addDaysToIsoDate(refIso, -1);

  if (lower.startsWith("next ")) {
    const dayName = lower.slice(5).trim();
    const weekday = WEEKDAY_INDEX[dayName];
    if (weekday !== undefined) {
      const sameOrNext = nextWeekdayIso(refIso, weekday);
      // "next Monday" should be strictly in the future week if today is Monday.
      if (sameOrNext === refIso) return addDaysToIsoDate(refIso, 7);
      return sameOrNext;
    }
  }

  const weekday = WEEKDAY_INDEX[lower];
  if (weekday !== undefined) {
    return nextWeekdayIso(refIso, weekday);
  }

  const monthDay = parseMonthDayYear(text, refIso);
  if (monthDay) return monthDay;

  return null;
}

export function normalizeAppointmentTime(
  raw: string | null | undefined,
): string | null {
  const text = raw?.trim() ?? "";
  if (!text || looksLikePlaceholder(text)) return null;

  const compact = text.replace(/\./g, "").replace(/\s+/g, " ").trim();

  const ampm = compact.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampm) {
    const hour = Number(ampm[1]);
    const minutes = ampm[2] ?? "00";
    if (hour < 1 || hour > 12) return null;
    return `${hour}:${minutes.padStart(2, "0")} ${ampm[3].toUpperCase()}`;
  }

  const twentyFour = compact.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    let hour = Number(twentyFour[1]);
    const minutes = twentyFour[2];
    if (hour > 23) return null;
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes} ${period}`;
  }

  return null;
}

export function combineScheduledAt(
  isoDate: string,
  timeLabel: string | null,
  timeZone = CLINIC_TIMEZONE,
): Date | null {
  if (!isIsoDateString(isoDate)) return null;
  const offset =
    timeZone === CLINIC_TIMEZONE || timeZone === "Asia/Karachi" ? "+05:00" : "Z";

  let hours = 10;
  let minutes = 0;
  if (timeLabel) {
    const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      hours = Number(match[1]);
      minutes = Number(match[2]);
      const period = match[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
    }
  }

  const value = new Date(
    `${isoDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00${offset}`,
  );
  return Number.isNaN(value.getTime()) ? null : value;
}

/** Never returns JavaScript's "Invalid Date". */
export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (isIsoDateString(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const instant = Date.parse(trimmed);
  if (!Number.isNaN(instant)) {
    return new Date(instant).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: CLINIC_TIMEZONE,
    });
  }

  return "—";
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (isIsoDateString(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  const instant = Date.parse(trimmed);
  if (!Number.isNaN(instant)) {
    return new Date(instant).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: CLINIC_TIMEZONE,
    });
  }

  return "—";
}

export function formatDateTimeLabel(
  value: Date | string | null | undefined,
): string {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = Number.isNaN(value.getTime()) ? null : value;
  } else if (typeof value === "string" && value.trim()) {
    if (isIsoDateString(value.trim())) {
      return formatDisplayDate(value.trim());
    }
    const parsed = new Date(value);
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!date) return "—";

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: CLINIC_TIMEZONE,
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CLINIC_TIMEZONE,
  });
  return `${datePart} · ${timePart}`;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  const value = phone?.trim() ?? "";
  if (!value || value.toLowerCase() === "unknown") return "Unavailable";
  return value;
}

/**
 * Parse OmniDimension naive timestamps.
 * Documented examples are "YYYY-MM-DD HH:mm:ss" without timezone.
 * Treat them as UTC instants (common for telephony platforms / UTC hosts).
 */
export function parseOmniDimensionDateTime(
  value: unknown,
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    const date = new Date(`${text.replace(" ", "T")}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) {
    const date = new Date(`${text}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}
