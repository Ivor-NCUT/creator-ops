import Link from "next/link";
import { addPaymentRecord, createPaymentItem } from "@/app/actions/crm";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import { remainingBalance } from "@/lib/people-finance/calculations";
import { roleCan } from "@/lib/roles";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission("crm:read"); const query = await searchParams; const manage = roleCan(actor.role, "crm:manage");
  const [items, parties, contracts] = await Promise.all([db.paymentItem.findMany({ where: { organizationId: actor.organizationId }, include: { party: { select: { name: true } }, contract: { select: { number: true } }, payments: { orderBy: { paidOn: "desc" }, take: 3 } }, orderBy: [{ dueOn: "asc" }, { createdAt: "desc" }] }), db.externalParty.findMany({ where: { organizationId: actor.organizationId, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }), db.contract.findMany({ where: { organizationId: actor.organizationId }, select: { id: true, number: true, title: true, partyId: true }, orderBy: { updatedAt: "desc" } })]);
  const receivable = items.filter((i) => i.direction === "RECEIVABLE").reduce((sum, i) => sum.add(remainingBalance(i.amount, i.paidAmount)), new Prisma.Decimal(0)); const payable = items.filter((i) => i.direction === "PAYABLE").reduce((sum, i) => sum.add(remainingBalance(i.amount, i.paidAmount)), new Prisma.Decimal(0));
  return <AppShell eyebrow="Finance" title="应收、应付与付款"><Notice {...query} /><div className="subnav"><Link href="/business">外部主体</Link><Link href="/business/contracts">合同</Link><Link href="/business/payments">收付款</Link></div>
    <div className="summary-strip"><div><span>待收</span><strong>{receivable.toFixed(2)}</strong></div><div><span>待付</span><strong>{payable.toFixed(2)}</strong></div></div>
    <section className="dashboard-grid"><div className="panel span-2"><h2>款项计划</h2>{items.length === 0 ? <p className="empty-state">暂无应收或应付款。</p> : <div className="record-stack">{items.map((item) => <article className="payment-card" key={item.id}><div className="record-row"><div><h3>{item.direction === "RECEIVABLE" ? "应收" : "应付"} · {item.title}</h3><p>{item.party.name} · {item.contract?.number ?? "无合同"} · 到期 {item.dueOn?.toLocaleDateString("zh-CN") ?? "未设置"}</p></div><div><StatusBadge>{item.status}</StatusBadge><strong>{item.paidAmount.toFixed(2)} / {item.amount.toFixed(2)} {item.currency}</strong></div></div>{manage && ["OPEN", "PARTIAL"].includes(item.status) && <form action={addPaymentRecord} className="payment-form"><input type="hidden" name="paymentItemId" value={item.id} /><label>本次金额<input name="amount" inputMode="decimal" required /></label><label>日期<input name="paidOn" type="date" required /></label><label>凭证号<input name="reference" /></label><button className="button-secondary" type="submit">登记收/付款</button></form>}</article>)}</div>}</div>
      {manage && <form action={createPaymentItem} className="panel form-stack compact-form"><h2>新建款项</h2><label>方向<select name="direction"><option value="RECEIVABLE">应收</option><option value="PAYABLE">应付</option></select></label><label>标题<input name="title" required /></label><label>外部主体<select name="partyId">{parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>关联合同<select name="contractId"><option value="">无</option>{contracts.map((c) => <option key={c.id} value={c.id}>{c.number} · {c.title}</option>)}</select></label><label>金额<input name="amount" inputMode="decimal" required /></label><label>币种<input name="currency" defaultValue="CNY" maxLength={3} /></label><label>到期日<input name="dueOn" type="date" /></label><button className="button-primary" type="submit">创建款项</button></form>}
    </section>
  </AppShell>;
}
