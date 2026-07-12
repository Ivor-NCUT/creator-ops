const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function zonedMidnight(value: string, timeZone: string) {
  if (!datePattern.test(value)) throw new Error("Invalid date range");
  const [year, month, day] = value.split("-").map(Number);
  if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== value) throw new Error("Invalid date range");
  let instant = Date.UTC(year, month - 1, day);
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = localParts(new Date(instant), timeZone);
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    instant += Date.UTC(year, month - 1, day) - represented;
  }
  return new Date(instant);
}

export function parseDateRange(input: { from?: string; to?: string }, timeZone: string, now = new Date()) {
  const today = localParts(now, timeZone);
  const defaultTo = `${today.year}-${today.month}-${today.day}`;
  const defaultFromDate = new Date(Date.UTC(Number(today.year), Number(today.month) - 2, 1));
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);
  const fromValue = input.from || defaultFrom;
  const toValue = input.to || defaultTo;
  const from = zonedMidnight(fromValue, timeZone);
  const nextLocal = new Date(`${toValue}T00:00:00Z`); nextLocal.setUTCDate(nextLocal.getUTCDate() + 1);
  const to = zonedMidnight(nextLocal.toISOString().slice(0, 10), timeZone);
  if (from >= to) throw new Error("Invalid date range");
  return { from, to, fromValue, toValue };
}
