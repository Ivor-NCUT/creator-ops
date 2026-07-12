import { runAutomationsNow, updateAutomation } from "@/app/actions/automations";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AutomationsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission("organization:manage"); const query = await searchParams;
  const [rules, members, runs] = await Promise.all([
    db.automationRule.findMany({ where: { organizationId: actor.organizationId }, include: { recipient: { select: { user: { select: { name: true } } } } }, orderBy: { type: "asc" } }),
    db.member.findMany({ where: { organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    db.automationRun.findMany({ where: { organizationId: actor.organizationId }, include: { rule: { select: { type: true } } }, orderBy: { startedAt: "desc" }, take: 50 }),
  ]);
  return <AppShell eyebrow="Settings" title="固定自动化"><Notice {...query} /><div className="section-heading"><p className="section-copy">规则模板写在代码里；这里只启停和设置固定接收人。失败会保留错误与重试次数。</p><form action={runAutomationsNow}><button className="button-primary" type="submit">立即运行一次</button></form></div>
    <section className="dashboard-grid"><div className="panel span-2"><h2>规则</h2>{rules.length === 0 ? <p className="empty-state">暂无规则，请执行仿真数据种子或初始化规则。</p> : <div className="record-stack">{rules.map((rule) => <form action={updateAutomation} className="automation-row" key={rule.id}><input name="id" type="hidden" value={rule.id} /><div><strong>{rule.type}</strong><small>当前接收：{rule.recipient?.user.name ?? "业务负责人 / Owner"}</small></div><label>状态<select name="enabled" defaultValue={String(rule.enabled)}><option value="true">启用</option><option value="false">停用</option></select></label><label>固定接收人<select name="recipientId" defaultValue={rule.recipientId ?? ""}><option value="">按业务规则</option>{members.map((member) => <option value={member.id} key={member.id}>{member.user.name}</option>)}</select></label><button className="button-secondary" type="submit">保存</button></form>)}</div>}</div>
      <div className="panel"><h2>最近运行</h2>{runs.length === 0 ? <p className="empty-state">尚未运行。</p> : <ol className="timeline">{runs.map((run) => <li key={run.id}><strong>{run.rule.type} <StatusBadge>{run.status}</StatusBadge></strong><span>{run.startedAt.toLocaleString("zh-CN")} · 第 {run.attempt} 次 · {run.notifications} 条通知</span>{run.error && <p className="form-error">{run.error}</p>}</li>)}</ol>}</div>
    </section>
  </AppShell>;
}
