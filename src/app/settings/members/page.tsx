import Link from "next/link";
import { createDepartment, createMember } from "@/app/actions/core";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

const roleLabels = { OWNER: "Owner", ADMIN: "管理员", HR: "人事", FINANCE: "财务", MANAGER: "经理", MEMBER: "成员", VIEWER: "访客" } as const;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission("members:read");
  const canManage = actor.role === "OWNER" || actor.role === "ADMIN";
  const [members, departments, params] = await Promise.all([
    db.member.findMany({
      where: { organizationId: actor.organizationId },
      select: { id: true, role: true, status: true, user: { select: { name: true, email: true } }, department: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.department.findMany({ where: { organizationId: actor.organizationId }, orderBy: { name: "asc" } }),
    searchParams,
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
        <div><p className="eyebrow">设置</p><h1 className="text-3xl font-semibold">成员与部门</h1></div>
        <Link className="button-secondary" href="/">返回总览</Link>
      </header>
      {(params.error || params.success) && <p className={params.error ? "form-error" : "form-success"} role="status">{params.error ? "操作失败，请检查输入是否重复或无效。" : "已保存。"}</p>}

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th>姓名</th><th>邮箱</th><th>部门</th><th>角色</th><th>状态</th></tr></thead>
          <tbody>{members.map((member) => <tr key={member.id}><td>{member.user.name}</td><td>{member.user.email}</td><td>{member.department?.name ?? "—"}</td><td>{roleLabels[member.role]}</td><td>{member.status === "ACTIVE" ? "正常" : "停用"}</td></tr>)}</tbody>
        </table>
      </section>

      {canManage && <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="panel"><h2 className="text-xl font-semibold">新建部门</h2><form action={createDepartment} className="form-stack"><label>部门名称<input name="name" minLength={2} maxLength={80} required /></label><button className="button-primary" type="submit">新建部门</button></form></section>
        <section className="panel"><h2 className="text-xl font-semibold">创建成员</h2><p className="mt-2 text-sm text-slate-600">请通过安全渠道把初始密码交给成员。</p><form action={createMember} className="form-stack">
          <label>姓名<input name="name" minLength={2} maxLength={80} required /></label>
          <label>邮箱<input name="email" type="email" required /></label>
          <label>初始密码<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
          <label>角色<select name="role" defaultValue="MEMBER">{Object.entries(roleLabels).filter(([role]) => role !== "OWNER").map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select></label>
          <label>部门<select name="departmentId" defaultValue=""><option value="">未分配</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <button className="button-primary" type="submit">创建成员</button>
        </form></section>
      </div>}
    </main>
  );
}
