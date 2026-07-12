import Link from "next/link";
import type { DashboardDomain } from "@/lib/analytics/access";

const labels: Record<DashboardDomain, string> = { content: "内容", live: "直播电商", projects: "项目", people: "人员", cash: "现金" };
const money = (value: unknown) => typeof value === "object" && value && "toFixed" in value ? (value as { toFixed(n: number): string }).toFixed(2) : String(value ?? 0);

export function DashboardNav({ domains }: { domains: DashboardDomain[] }) {
  return <nav className="subnav" aria-label="看板分类"><Link href="/dashboard">总览</Link>{domains.map((domain) => <Link href={`/dashboard/${domain}`} key={domain}>{labels[domain]}</Link>)}</nav>;
}

export function DashboardView({ dashboard, domains }: { dashboard: Record<string, unknown>; domains: DashboardDomain[] }) {
  return <div className="analytics-stack">{domains.map((domain) => {
    const value = dashboard[domain] as Record<string, unknown> | undefined;
    if (!value) return null;
    const records = (value.records ?? []) as Array<Record<string, unknown>>;
    const metrics = Object.entries(value).filter(([key]) => key !== "records" && !["refundRate"].includes(key));
    return <section className="panel" key={domain} id={domain}><div className="section-heading"><div><h2>{labels[domain]}看板</h2><p>所选日期内的服务端实时聚合；点击记录可追溯到业务源。</p></div><Link className="record-link" href={`/dashboard/${domain}`}>查看明细</Link></div>
      <div className="metric-cards">{metrics.map(([key, metric]) => <div key={key}><span>{key}</span><strong>{money(metric)}</strong></div>)}</div>
      {records.length === 0 ? <p className="empty-state">该日期范围暂无记录。</p> : <div className="table-scroll"><table><thead><tr><th>源记录</th><th>状态 / 类型</th><th>日期 / 数值</th></tr></thead><tbody>{records.slice(0, 20).map((record) => {
        const id = String(record.id); const href = domain === "content" ? `/content/${id}` : domain === "live" ? `/live/${id}` : domain === "projects" ? `/work/projects/${id}` : domain === "people" ? "/people/payroll" : "/business/payments";
        const title = String(record.title ?? record.name ?? id);
        return <tr key={id}><td><Link className="record-link" href={href}>{title}</Link></td><td>{String(record.status ?? record.direction ?? record.type ?? `${record.year ?? ""}-${record.month ?? ""}`)}</td><td>{record.startsAt instanceof Date ? record.startsAt.toLocaleString("zh-CN") : record.dueAt instanceof Date ? record.dueAt.toLocaleDateString("zh-CN") : record.netPay ? money(record.netPay) : "—"}</td></tr>;
      })}</tbody></table></div>}
    </section>;
  })}</div>;
}
