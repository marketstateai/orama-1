import type { WeekStartsOn } from "./types";

export function parseISODate(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date: ${date}`);
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, monthIndex, day);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isBeforeOrEqual(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

export function isAfterOrEqual(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime();
}

export function clampDate(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return min;
  if (d.getTime() > max.getTime()) return max;
  return d;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function monthKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthKeyToDate(monthKey: string): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) throw new Error(`Invalid monthKey: ${monthKey}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

export function startOfWeek(d: Date, weekStartsOn: WeekStartsOn): Date {
  const dayIndex = d.getDay(); // 0..6 (Sun..Sat)
  const delta = (dayIndex - weekStartsOn + 7) % 7;
  return addDays(d, -delta);
}

export function endOfWeek(d: Date, weekStartsOn: WeekStartsOn): Date {
  return addDays(startOfWeek(d, weekStartsOn), 6);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isWithinInclusive(d: Date, start: Date, end: Date): boolean {
  return isAfterOrEqual(d, start) && isBeforeOrEqual(d, end);
}

export function formatMonthLabel(monthKey: string): string {
  const d = monthKeyToDate(monthKey);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function formatShortDate(date: string): string {
  const d = parseISODate(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatWeekLabel(weekStartISO: string): string {
  const d = parseISODate(weekStartISO);
  const end = addDays(d, 6);
  const startLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function monthKeysInRange(startISO: string, endISO: string): string[] {
  const start = startOfMonth(parseISODate(startISO));
  const end = startOfMonth(parseISODate(endISO));
  const out: string[] = [];
  let cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    out.push(monthKeyFromDate(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return out;
}

export function weekStartsForMonth(monthKey: string, weekStartsOn: WeekStartsOn): string[] {
  const monthStart = monthKeyToDate(monthKey);
  const monthEnd = endOfMonth(monthStart);
  let cursor = startOfWeek(monthStart, weekStartsOn);
  const out: string[] = [];
  while (cursor.getTime() <= monthEnd.getTime()) {
    out.push(toISODate(cursor));
    cursor = addDays(cursor, 7);
  }
  return out;
}

export function daysForWeekInMonth(
  weekStartISO: string,
  monthKey: string,
  rangeStartISO: string,
  rangeEndISO: string
): string[] {
  const weekStart = parseISODate(weekStartISO);
  const monthStart = monthKeyToDate(monthKey);
  const monthEnd = endOfMonth(monthStart);
  const rangeStart = parseISODate(rangeStartISO);
  const rangeEnd = parseISODate(rangeEndISO);

  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    if (!isSameMonth(d, monthStart)) continue;
    if (!isWithinInclusive(d, rangeStart, rangeEnd)) continue;
    if (!isWithinInclusive(d, monthStart, monthEnd)) continue;
    out.push(toISODate(d));
  }
  return out;
}

export function yearsInRange(startISO: string, endISO: string): number[] {
  const startY = parseISODate(startISO).getFullYear();
  const endY = parseISODate(endISO).getFullYear();
  const years: number[] = [];
  for (let y = startY; y <= endY; y++) years.push(y);
  return years;
}

