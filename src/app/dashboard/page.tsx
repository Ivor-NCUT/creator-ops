import { AppShell } from "@/components/app-shell";
import { DashboardNav, DashboardView } from "@/components/dashboard-view";
import { dashboardDomains } from "@/lib/analytics/access";
import { parseDateRange } from "@/lib/analytics/date-range";
import { getDashboard } from "@/lib/analytics/service";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const actor = await requirePagePermission();
  const domains = dashboardDomains(actor.role);
  if (domains.length === 0) return <AppShell eyebrow="Analytics" title="经营看板"><p className="panel">你的角色没有经营聚合数据权限。</p></AppShell>;
  const organization = await db.organization.findUniqueOrThrow({ where: { id: actor.organizationId }, select: { timezone: true } });
  let range; try { range = parseDateRange(await searchParams, organization.timezone); } catch { range = parseDateRange({}, organization.timezone); }
  const dashboard = await getDashboard(actor, range, domains);
  return <AppShell eyebrow="Analytics" title="经营总览"><DashboardNav domains={domains} /><form className="date-range panel" method="get"><label>开始日期<input name="from" type="date" defaultValue={range.fromValue} /></label><label>结束日期<input name="to" type="date" defaultValue={range.toValue} /></label><button className="button-secondary" type="submit">更新范围</button></form><p className="range-note">口径：组织时区 {organization.timezone}，开始日 00:00（含）至结束日次日 00:00（不含）。</p><DashboardView dashboard={dashboard} domains={domains} /></AppShell>;
}
