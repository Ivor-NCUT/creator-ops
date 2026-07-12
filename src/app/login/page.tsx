import { redirect } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { getCurrentMember } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await db.organization.findUnique({ where: { slug: "default" }, select: { id: true } }))) {
    redirect("/initialize");
  }
  if ((await getCurrentMember())?.status === "ACTIVE") redirect("/");
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Creator Ops</p>
        <h1 className="text-3xl font-semibold tracking-tight">登录工作台</h1>
        <p className="mt-3 text-slate-600">使用管理员为你创建的账号。</p>
        {error && <p className="form-error" role="alert">邮箱或密码不正确。</p>}
        <form action={signIn} className="form-stack">
          <label>邮箱<input name="email" type="email" autoComplete="email" required /></label>
          <label>密码<input name="password" type="password" autoComplete="current-password" minLength={12} maxLength={128} required /></label>
          <button className="button-primary" type="submit">登录</button>
        </form>
      </section>
    </main>
  );
}
