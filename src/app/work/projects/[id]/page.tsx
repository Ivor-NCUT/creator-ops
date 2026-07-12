import { notFound } from "next/navigation";
import { changeProjectStatus, changeTaskStatus, createTask } from "@/app/actions/work-content";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { StatusForm } from "@/components/status-form";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

const next = { PLANNED: ["ACTIVE", "CANCELLED"], ACTIVE: ["BLOCKED", "DONE", "CANCELLED"], BLOCKED: ["ACTIVE", "CANCELLED"], DONE: ["ACTIVE"], CANCELLED: ["PLANNED"] } as const;

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const member = await requirePagePermission(); const { id } = await params; const query = await searchParams;
  const [project, members] = await Promise.all([
    db.project.findFirst({ where: { id, organizationId: member.organizationId }, include: { owner: { select: { user: { select: { name: true } } } }, tasks: { include: { assignee: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } } } }),
    db.member.findMany({ where: { organizationId: member.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } } }),
  ]);
  if (!project) notFound(); const returnTo = `/work/projects/${project.id}`;
  return <AppShell eyebrow="Project" title={project.name}><Notice {...query} /><section className="dashboard-grid"><div className="panel span-2"><div className="detail-meta"><div><p>负责人</p><strong>{project.owner.user.name}</strong></div><div><p>优先级</p><strong>{project.priority}</strong></div><div><p>状态</p><StatusBadge>{project.status}</StatusBadge></div></div><StatusForm action={changeProjectStatus} id={project.id} options={next[project.status]} returnTo={returnTo} /><p className="mt-5 text-slate-600">{project.description || "暂无项目说明"}</p></div><form action={createTask} className="panel form-stack compact-form"><h2>添加任务</h2><input name="projectId" type="hidden" value={project.id} /><label>任务<input name="title" required /></label><label>负责人<select name="assigneeId"><option value="">待分配</option>{members.map((item) => <option key={item.id} value={item.id}>{item.user.name}</option>)}</select></label><label>优先级<select name="priority"><option>NORMAL</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></label><label>工作量分<input name="points" min="0" type="number" defaultValue="1" /></label><button className="button-primary" type="submit">添加任务</button></form></section><section className="panel mt-6"><h2>任务清单</h2>{project.tasks.length === 0 ? <p className="empty-state">暂无任务。</p> : <div className="record-stack">{project.tasks.map((task) => <article className="record-row" key={task.id}><div><h3>{task.title}</h3><p>{task.assignee?.user.name ?? "待分配"} · {task.points} 分</p></div><div><StatusBadge>{task.status}</StatusBadge><StatusForm action={changeTaskStatus} id={task.id} options={next[task.status]} returnTo={returnTo} /></div></article>)}</div>}</section></AppShell>;
}
