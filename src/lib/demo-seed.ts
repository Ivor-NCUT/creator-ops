const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function shanghaiDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getDemoSeedConfig(env: Readonly<Record<string, string | undefined>> = process.env, currentTime = new Date()) {
  if (env.NODE_ENV === "production" && env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("生产环境默认拒绝演示 seed；如确认使用独立演示库，必须显式设置 ALLOW_DEMO_SEED=true");
  }
  const referenceDate = env.DEMO_REFERENCE_DATE ?? shanghaiDate(currentTime);
  if (!ISO_DATE.test(referenceDate)) throw new Error("DEMO_REFERENCE_DATE 必须是有效的 ISO 日期（YYYY-MM-DD）");
  const [year, month, date] = referenceDate.split("-").map(Number);
  if (new Date(Date.UTC(year, month - 1, date)).toISOString().slice(0, 10) !== referenceDate) {
    throw new Error("DEMO_REFERENCE_DATE 必须是有效的 ISO 日期（YYYY-MM-DD）");
  }
  return { referenceDate, password: env.DEMO_PASSWORD ?? "CreatorOpsDemo!2026" };
}

export function demoDate(referenceDate: string, days: number, hour = 10) {
  return new Date(Date.parse(`${referenceDate}T00:00:00+08:00`) + days * 86_400_000 + hour * 3_600_000);
}
