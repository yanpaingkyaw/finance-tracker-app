import { AppError } from "../lib/errors.js";

export const YEAR_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertYearMonth(value: string): string {
  if (!YEAR_MONTH_REGEX.test(value)) {
    throw new AppError("yearMonth must be in YYYY-MM format", 400, "VALIDATION_ERROR");
  }

  return value;
}

export function getYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function parseYearMonthToRange(yearMonth: string): { start: Date; end: Date } {
  assertYearMonth(yearMonth);
  const [yearRaw, monthRaw] = yearMonth.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

export function previousYearMonth(yearMonth: string): string {
  const { start } = parseYearMonthToRange(yearMonth);
  const previous = new Date(start);
  previous.setMonth(previous.getMonth() - 1);
  return getYearMonth(previous);
}

export function nextYearMonth(yearMonth: string): string {
  const { start } = parseYearMonthToRange(yearMonth);
  const next = new Date(start);
  next.setMonth(next.getMonth() + 1);
  return getYearMonth(next);
}

export function monthRangeList(fromYearMonth: string, toYearMonth: string): string[] {
  const from = parseYearMonthToRange(fromYearMonth).start;
  const to = parseYearMonthToRange(toYearMonth).start;
  if (from.getTime() > to.getTime()) {
    throw new AppError("from must be before or equal to to", 400, "VALIDATION_ERROR");
  }

  const out: string[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    out.push(getYearMonth(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return out;
}
