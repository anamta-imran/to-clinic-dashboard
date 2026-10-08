export function todayIsoDate(timeZone = "Asia/Karachi"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dayBounds(
  isoDate: string,
  timeZone = "Asia/Karachi",
): { start: Date; end: Date } {
  const offsetHours = timeZone === "Asia/Karachi" ? 5 : 0;
  const start = new Date(`${isoDate}T00:00:00+0${offsetHours}:00`);
  const end = new Date(`${isoDate}T23:59:59.999+0${offsetHours}:00`);
  return { start, end };
}

export function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
  });
}
