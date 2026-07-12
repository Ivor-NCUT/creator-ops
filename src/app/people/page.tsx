import Link from "next/link";
import { createEmployee } from "@/app/actions/people-finance";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { canManagePeople, employeeSensitiveInclude } from "@/lib/people-finance/access";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission(); const query = await searchParams;
  const managerScope = actor.role === "MANAGER" ? { member: { departmentId: actor.departmentId ?? "__none__" } } : ["MEMBER", "VIEWER"].includes(actor.role) ? { memberId: actor.id } : {};
  const { identity: identityAllowed, compensation: compensationAllowed } = employeeSensitiveInclude(actor); const manageAllowed = canManagePeople(actor);
  const [employees, members] = await Promise.all([
    db.employeeProfile.findMany({ where: { organizationId: actor.organizationId, ...managerScope }, include: { member: { select: { department: { select: { name: true } }, user: { select: { name: true, email: true } } } }, identity: identityAllowed, compensation: compensationAllowed }, orderBy: { employeeNo: "asc" } }),
    manageAllowed ? db.member.findMany({ where: { organizationId: actor.organizationId, employeeProfile: null }, select: { id: true, user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }) : [],
  ]);
  return <AppShell eyebrow="People" title="人员与档案"><Notice {...query} /><div className="subnav"><Link href="/people">员工</Link><Link href="/people/attendance">考勤异常</Link><Link href="/people/payroll">薪资绩效</Link></div>
    <section className="dashboard-grid"><div className={manageAllowed ? "panel span-2" : "panel span-2"}><h2>员工档案</h2>{employees.length === 0 ? <p className="empty-state">暂无可查看的员工档案。</p> : <div className="table-scroll"><table><thead><tr><th>员工</th><th>工号 / 部门</th><th>岗位</th><th>状态</th>{identityAllowed && <th>身份与联系</th>}{compensationAllowed && <th>基础薪资</th>}</tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td>{employee.member.user.name}<small className="cell-note">{employee.member.user.email}</small></td><td>{employee.employeeNo}<small className="cell-note">{employee.member.department?.name ?? "未分配"}</small></td><td>{employee.jobTitle ?? "—"}</td><td><StatusBadge>{employee.employmentStatus}</StatusBadge></td>{identityAllowed && <td>{employee.identity?.legalName ?? "—"}<small className="cell-note">{employee.identity?.phone ?? "未填电话"}</small></td>}{compensationAllowed && <td>{employee.compensation?.baseSalary.toFixed(2) ?? "—"} {employee.compensation?.currency ?? ""}</td>}</tr>)}</tbody></table></div>}</div>
      {manageAllowed && <form action={createEmployee} className="panel form-stack compact-form"><h2>建立员工档案</h2><label>系统成员<select name="memberId" required>{members.map((member) => <option key={member.id} value={member.id}>{member.user.name}</option>)}</select></label><label>工号<input name="employeeNo" required /></label><label>岗位<input name="jobTitle" /></label><label>任职状态<select name="employmentStatus"><option value="ACTIVE">在职</option><option value="PROBATION">试用</option><option value="LEAVE">休假</option><option value="TERMINATED">离职</option></select></label><label>入职日期<input name="hiredAt" type="date" /></label><label>法定姓名<input name="legalName" required /></label><label>证件类型<input name="idType" /></label><label>证件号码<input name="idNumber" /></label><label>个人电话<input name="phone" /></label><label>个人邮箱<input name="personalEmail" type="email" /></label><label>住址<input name="address" /></label><label>紧急联系人<input name="emergencyContact" /></label><label>紧急联系电话<input name="emergencyPhone" /></label><label>基础薪资<input name="baseSalary" inputMode="decimal" defaultValue="0.00" required /></label><label>币种<input name="currency" defaultValue="CNY" maxLength={3} required /></label><button className="button-primary" type="submit">保存档案</button></form>}
    </section>
  </AppShell>;
}
