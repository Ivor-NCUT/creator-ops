import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardNav, DashboardView } from "@/components/dashboard-view";
import { dashboardDomains, type DashboardDomain } from "@/lib/analytics/access";
import { parseDateRange } from "@/lib/analytics/date-range";
import { getDashboard } from "@/lib/analytics/service";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DomainDashboard({ params, searchParams }: { params: Promise<{ domain: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const actor = await requirePagePermission(); const { domain } = await params; const allowed = dashboardDomains(actor.role);
  if (!allowed.includes(domain as DashboardDomain)) notFound();
  const organization = await db.organization.findUniqueOrThrow({ where: { id: actor.organizationId }, select: { timezone: true } });
  let range; try { range = parseDateRange(await searchParams, organization.timezone); } catch { range = parseDateRange({}, organization.timezone); }
  const selected = domain as DashboardDomain;
  return <AppShell eyebrow="Analytics" title={`${domain} 明细`}><DashboardNav domains={allowed} /><form className="date-range panel" method="get"><label>开始日期<input name="from" type="date" defaultValue={range.fromValue} /></label><label>结束日期<input name="to" type="date" defaultValue={range.toValue} /></label><button className="button-secondary" type="submit">更新范围</button></form><DashboardView dashboard={await getDashboard(actor, range, [selected])} domains={[selected]} /></AppShell>;
}
