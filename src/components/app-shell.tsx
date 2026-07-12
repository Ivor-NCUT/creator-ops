import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";

export function AppShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main className="app-shell">
    <aside className="app-sidebar">
      <Link className="brand" href="/">Creator Ops</Link>
      <nav aria-label="主要导航">
        <Link href="/work">工作</Link>
        <Link href="/content">内容生产</Link>
        <Link href="/live">直播电商</Link>
        <Link href="/settings/members">成员设置</Link>
      </nav>
      <form action={signOut}><button className="button-secondary w-full" type="submit">退出</button></form>
    </aside>
    <div className="app-main">
      <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div></header>
      {children}
    </div>
  </main>;
}

export function Notice({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p className="form-error" role="alert">操作未完成，请检查输入或状态流转。</p>}{success && <p className="form-success" role="status">操作已完成。</p>}</>;
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="status-badge">{children}</span>;
}
