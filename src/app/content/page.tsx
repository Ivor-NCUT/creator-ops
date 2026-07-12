import Link from "next/link";
import { createContent, createPublishingProfile } from "@/app/actions/work-content";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import { getWorkload } from "@/lib/work-content/service";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const member = await requirePagePermission(); const query = await searchParams;
  const from = new Date(); from.setUTCDate(1); from.setUTCHours(0, 0, 0, 0); const to = new Date(from); to.setUTCMonth(to.getUTCMonth() + 1);
  const [items, members, profiles, workload] = await Promise.all([
    db.contentItem.findMany({ where: { organizationId: member.organizationId }, include: { owner: { select: { user: { select: { name: true } } } }, profile: { select: { name: true } } }, orderBy: [{ plannedAt: "asc" }, { updatedAt: "desc" }] }),
    db.member.findMany({ where: { organizationId: member.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } } }),
    db.contentProfile.findMany({ where: { organizationId: member.organizationId, active: true }, orderBy: { name: "asc" } }),
    getWorkload(member.organizationId, from, to),
  ]);
  return <AppShell eyebrow="Content" title="统一内容生产"><Notice {...query} />
    <section className="dashboard-grid"><div className="panel span-2"><div className="section-heading"><div><h2>生产排期</h2><p>视频、公众号与图书共用一份内容主记录</p></div></div>{items.length === 0 ? <p className="empty-state">暂无内容，从右侧创建选题。</p> : <div className="table-scroll"><table><thead><tr><th>内容</th><th>类型</th><th>IP / 栏目</th><th>负责人</th><th>状态</th><th>计划</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><Link className="record-link" href={`/content/${item.id}`}>{item.title}</Link></td><td>{item.type}</td><td>{item.profile?.name ?? "—"}</td><td>{item.owner.user.name}</td><td><StatusBadge>{item.status}</StatusBadge></td><td>{item.plannedAt?.toLocaleDateString("zh-CN") ?? "—"}</td></tr>)}</tbody></table></div>}</div>
      <form action={createContent} className="panel form-stack compact-form"><h2>新建内容</h2><label>标题<input name="title" required /></label><label>类型<select name="type"><option>VIDEO</option><option>ARTICLE</option><option>BOOK</option></select></label><label>IP / 栏目<select name="profileId"><option value="">未指定</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label>负责人<select name="ownerId" required>{members.map((item) => <option key={item.id} value={item.id}>{item.user.name}</option>)}</select></label><label>主题（文章/图书）<input name="topic" /></label><label>计划时间<input name="plannedAt" type="datetime-local" /></label><label>工作量分<input name="workloadPoints" min="0" type="number" defaultValue="1" /></label><label>优先级<select name="priority"><option>NORMAL</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></label><button className="button-primary" type="submit">创建内容</button></form></section>
    <section className="dashboard-grid mt-6"><div className="panel span-2"><h2>本月工作量</h2><p className="section-copy">直接汇总已完成任务和内容事件，不维护人工统计表。</p>{workload.length === 0 ? <p className="empty-state">本月还没有可统计的工作事件。</p> : <ol className="metric-list">{workload.map((row) => <li key={row.memberId}><span>{row.name}</span><strong>{row.points} 分</strong></li>)}</ol>}</div><div className="panel"><h2>组织内基础记录</h2><form action={createPublishingProfile} className="form-stack compact-form"><input name="kind" type="hidden" value="profile" /><label>新增 IP / 栏目<input name="name" required /></label><button className="button-secondary" type="submit">添加</button></form><form action={createPublishingProfile} className="form-stack compact-form border-top"><input name="kind" type="hidden" value="account" /><label>发布账号<input name="name" required /></label><label>渠道<input name="channel" placeholder="如：视频号" required /></label><button className="button-secondary" type="submit">添加</button></form></div></section>
  </AppShell>;
}
