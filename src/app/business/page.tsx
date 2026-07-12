import Link from "next/link";
import { createExternalParty } from "@/app/actions/crm";
import { AppShell, Notice } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function BusinessPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const actor = await requirePagePermission("crm:read"); const query = await searchParams; const manage = roleCan(actor.role, "crm:manage");
  const parties = await db.externalParty.findMany({ where: { organizationId: actor.organizationId }, include: { _count: { select: { contracts: true, paymentItems: true, products: true } } }, orderBy: { name: "asc" } });
  return <AppShell eyebrow="CRM" title="客户与合作方"><Notice {...query} /><div className="subnav"><Link href="/business">外部主体</Link><Link href="/business/contracts">合同</Link><Link href="/business/payments">收付款</Link></div>
    <section className="dashboard-grid"><div className="panel span-2"><h2>统一外部主体</h2>{parties.length === 0 ? <p className="empty-state">暂无客户、供应商、服务商或顾问。</p> : <div className="table-scroll"><table><thead><tr><th>名称</th><th>角色</th><th>联系人</th><th>关联业务</th></tr></thead><tbody>{parties.map((party) => <tr key={party.id}><td>{party.name}</td><td>{party.types.join(" / ")}</td><td>{party.contactName ?? "—"}<small className="cell-note">{party.contactPhone ?? party.contactEmail ?? "未填联系方式"}</small></td><td>{party._count.contracts} 合同 / {party._count.paymentItems} 款项 / {party._count.products} 商品</td></tr>)}</tbody></table></div>}</div>
      {manage && <form action={createExternalParty} className="panel form-stack compact-form"><h2>新增外部主体</h2><label>名称<input name="name" required /></label><fieldset><legend>主体角色</legend><label className="checkbox-label"><input type="checkbox" name="types" value="CUSTOMER" />客户</label><label className="checkbox-label"><input type="checkbox" name="types" value="SUPPLIER" />供应商</label><label className="checkbox-label"><input type="checkbox" name="types" value="SERVICE_PROVIDER" />服务商</label><label className="checkbox-label"><input type="checkbox" name="types" value="CONSULTANT" />顾问</label></fieldset><label>联系人<input name="contactName" /></label><label>电话<input name="contactPhone" /></label><label>邮箱<input name="contactEmail" type="email" /></label><label>税号<input name="taxNumber" /></label><label>备注<textarea name="notes" /></label><button className="button-primary" type="submit">保存主体</button></form>}
    </section>
  </AppShell>;
}
