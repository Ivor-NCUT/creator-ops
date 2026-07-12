import { redirect } from "next/navigation";
import { initializeOwner } from "@/app/actions/setup";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const messages = {
  invalid: "请检查所有字段，密码至少 12 位。",
  complete: "系统已完成初始化，请直接登录。",
  failed: "初始化失败，请稍后重试。",
} as const;

export default async function InitializePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await db.organization.findUnique({ where: { slug: "default" }, select: { id: true } })) redirect("/login");
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">首次运行</p>
        <h1 className="text-3xl font-semibold tracking-tight">初始化你的公司</h1>
        <p className="mt-3 text-slate-600">这个账号将成为唯一的初始 Owner。</p>
        {error && <p className="form-error" role="alert">{messages[error as keyof typeof messages] ?? messages.failed}</p>}
        <form action={initializeOwner} className="form-stack">
          <label>公司名称<input name="organizationName" autoComplete="organization" minLength={2} maxLength={80} required /></label>
          <label>姓名<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>
          <label>邮箱<input name="email" type="email" autoComplete="email" required /></label>
          <label>密码<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <button className="button-primary" type="submit">创建 Owner 并进入系统</button>
        </form>
      </section>
    </main>
  );
}
