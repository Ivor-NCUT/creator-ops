import Link from "next/link";
import { createAiRequest, createProject, changeAiStatus } from "@/app/actions/work-content";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { StatusForm } from "@/components/status-form";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const aiNext = { SUBMITTED: ["TRIAGED", "REJECTED"], TRIAGED: ["IN_PROGRESS", "REJECTED"], IN_PROGRESS: ["VALIDATING", "REJECTED"], VALIDATING: ["IN_PROGRESS", "DELIVERED"], DELIVERED: ["IN_PROGRESS"], REJECTED: ["SUBMITTED"] } as const;

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const member = await requirePagePermission();
  const query = await searchParams;
  const [projects, requests, members] = await Promise.all([
    db.project.findMany({ where: { organizationId: member.organizationId }, include: { owner: { select: { user: { select: { name: true } } } }, _count: { select: { tasks: true } } }, orderBy: { updatedAt: "desc" } }),
    db.aiRequest.findMany({ where: { organizationId: member.organizationId }, include: { requester: { select: { user: { select: { name: true } } } }, owner: { select: { user: { select: { name: true } } } } }, orderBy: { updatedAt: "desc" } }),
    db.member.findMany({ where: { organizationId: member.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
  ]);

  return <AppShell eyebrow="Work" title="项目、任务与 AI 提效">
    <Notice {...query} />
    <section className="dashboard-grid">
      <div className="panel span-2"><div className="section-heading"><div><h2>项目</h2><p>{projects.length} 个项目</p></div></div>
        {projects.length === 0 ? <p className="empty-state">还没有项目，从右侧创建第一个。</p> : <div className="table-scroll"><table><thead><tr><th>项目</th><th>负责人</th><th>状态</th><th>优先级</th><th>任务</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td><Link className="record-link" href={`/work/projects/${project.id}`}>{project.name}</Link></td><td>{project.owner.user.name}</td><td><StatusBadge>{project.status}</StatusBadge></td><td>{project.priority}</td><td>{project._count.tasks}</td></tr>)}</tbody></table></div>}
      </div>
      <form action={createProject} className="panel form-stack compact-form"><h2>新建项目</h2><label>名称<input name="title" required /></label><label>负责人<select name="ownerId" required>{members.map((item) => <option key={item.id} value={item.id}>{item.user.name}</option>)}</select></label><label>优先级<select name="priority"><option>NORMAL</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></label><label>截止日期<input name="dueAt" type="datetime-local" /></label><label>说明<textarea name="description" /></label><button className="button-primary" type="submit">创建项目</button></form>
    </section>
    <section className="dashboard-grid mt-6">
      <div className="panel span-2"><div className="section-heading"><div><h2>AI 提效需求</h2><p>从问题提交到交付验证</p></div></div>
        {requests.length === 0 ? <p className="empty-state">暂无 AI 提效需求。</p> : <div className="record-stack">{requests.map((request) => <article className="record-row" key={request.id}><div><h3>{request.title}</h3><p>{request.problem}</p><small>提出：{request.requester.user.name} · 负责：{request.owner?.user.name ?? "待分配"}</small></div><div><StatusBadge>{request.status}</StatusBadge><StatusForm action={changeAiStatus} id={request.id} options={aiNext[request.status]} returnTo="/work" /></div></article>)}</div>}
      </div>
      <form action={createAiRequest} className="panel form-stack compact-form"><h2>提交 AI 需求</h2><label>标题<input name="title" required /></label><label>真实问题<textarea name="problem" required /></label><label>期望结果<textarea name="expectedOutcome" required /></label><label>负责人<select name="ownerId"><option value="">待分配</option>{members.map((item) => <option key={item.id} value={item.id}>{item.user.name}</option>)}</select></label><label>优先级<select name="priority"><option>NORMAL</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></label><button className="button-primary" type="submit">提交需求</button></form>
    </section>
  </AppShell>;
}
