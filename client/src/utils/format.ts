export function formatMoney(valueMinor: number): string {
  return new Intl.NumberFormat("en-MM", {
    style: "currency",
    currency: "MMK",
    maximumFractionDigits: 0,
  }).format(valueMinor);
}

export function todayYearMonth(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function toDateInputLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateInputValue(): string {
  return toDateInputLocal(new Date());
}

export function toIsoDate(localDateInput: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDateInput);
  if (!match) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Store at local noon to avoid timezone boundary drift around midnight.
  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);
  return localNoon.toISOString();
}

export function fromIsoDate(isoDateTime: string): string {
  // Render date input in local calendar date instead of UTC slice.
  return toDateInputLocal(new Date(isoDateTime));
}
