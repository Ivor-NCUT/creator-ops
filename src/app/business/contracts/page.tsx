import Link from "next/link";
import { changeContractStatus, createContract } from "@/app/actions/crm";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission("crm:read"); const query = await searchParams; const manage = roleCan(actor.role, "crm:manage");
  const [contracts, parties, members] = await Promise.all([
    db.contract.findMany({ where: { organizationId: actor.organizationId }, include: { party: { select: { name: true } }, owner: { select: { user: { select: { name: true } } } }, _count: { select: { paymentItems: true } } }, orderBy: { updatedAt: "desc" } }),
    db.externalParty.findMany({ where: { organizationId: actor.organizationId, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.member.findMany({ where: { organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  return <AppShell eyebrow="CRM" title="合同"><Notice {...query} /><div className="subnav"><Link href="/business">外部主体</Link><Link href="/business/contracts">合同</Link><Link href="/business/payments">收付款</Link></div>
    <section className="dashboard-grid"><div className="panel span-2"><h2>合同台账</h2>{contracts.length === 0 ? <p className="empty-state">暂无合同。</p> : <div className="record-stack">{contracts.map((contract) => <article className="record-row" key={contract.id}><div><h3>{contract.number} · {contract.title}</h3><p>{contract.party.name} · {contract.owner.user.name} · {contract.amount.toFixed(2)} {contract.currency} · 到期 {contract.endsOn?.toLocaleDateString("zh-CN") ?? "未设置"}</p></div><div><StatusBadge>{contract.status}</StatusBadge>{manage && ["DRAFT", "ACTIVE"].includes(contract.status) && <form action={changeContractStatus} className="status-form"><input type="hidden" name="id" value={contract.id} /><select name="to">{contract.status === "DRAFT" ? <><option value="ACTIVE">生效</option><option value="CANCELLED">取消</option></> : <><option value="COMPLETED">完成</option><option value="TERMINATED">终止</option></>}</select><button className="button-secondary" type="submit">流转</button></form>}</div></article>)}</div>}</div>
      {manage && <form action={createContract} className="panel form-stack compact-form"><h2>新建合同</h2><label>合同编号<input name="number" required /></label><label>标题<input name="title" required /></label><label>外部主体<select name="partyId">{parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>负责人<select name="ownerId">{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</select></label><label>开始日期<input name="startsOn" type="date" /></label><label>结束日期<input name="endsOn" type="date" /></label><label>合同金额<input name="amount" inputMode="decimal" defaultValue="0.00" /></label><label>币种<input name="currency" defaultValue="CNY" maxLength={3} /></label><button className="button-primary" type="submit">创建合同</button></form>}
    </section>
  </AppShell>;
}
