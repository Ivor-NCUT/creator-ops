import { createProduct, createSupplier } from "@/app/actions/live-commerce";
import { AppShell, Notice } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const member = await requirePagePermission(); const query = await searchParams;
  const [products, suppliers] = await Promise.all([
    db.commerceProduct.findMany({ where: { organizationId: member.organizationId }, include: { supplier: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }),
    db.externalParty.findMany({ where: { organizationId: member.organizationId, types: { has: "SUPPLIER" } }, orderBy: { name: "asc" } }),
  ]);
  return <AppShell eyebrow="Live commerce" title="商品与供应商"><Notice {...query} /><div className="subnav"><Link href="/live">直播场次</Link><Link href="/live/products">商品与供应商</Link><Link href="/live/feedback">评价与客诉</Link></div>
    <section className="dashboard-grid"><div className="panel span-2"><h2>商品资料</h2>{products.length === 0 ? <p className="empty-state">暂无商品。</p> : <div className="table-scroll"><table><thead><tr><th>商品</th><th>SKU</th><th>供应商</th><th>标价</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku ?? "—"}</td><td>{product.supplier?.name ?? "—"}</td><td>{product.listPrice?.toFixed(2) ?? "—"} {product.currency}</td></tr>)}</tbody></table></div>}</div><form action={createProduct} className="panel form-stack compact-form"><h2>新建商品</h2><label>名称<input name="name" required /></label><label>SKU<input name="sku" /></label><label>供应商<select name="supplierId"><option value="">未指定</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label><label>币种<input name="currency" defaultValue="CNY" maxLength={3} required /></label><label>标价<input name="listPrice" inputMode="decimal" placeholder="0.00" /></label><button className="button-primary" type="submit">创建商品</button></form></section>
    <section className="dashboard-grid mt-6"><div className="panel span-2"><h2>供应商</h2>{suppliers.length === 0 ? <p className="empty-state">暂无供应商。</p> : <div className="record-stack">{suppliers.map((supplier) => <div className="record-row" key={supplier.id}><div><h3>{supplier.name}</h3><p>{supplier.contactName ?? "未填联系人"} {supplier.contactPhone ?? ""}</p></div></div>)}</div>}</div><form action={createSupplier} className="panel form-stack compact-form"><h2>新建供应商</h2><label>名称<input name="name" required /></label><label>联系人<input name="contactName" /></label><label>联系方式<input name="contactPhone" /></label><label>备注<textarea name="notes" /></label><button className="button-secondary" type="submit">添加供应商</button></form></section>
  </AppShell>;
}
