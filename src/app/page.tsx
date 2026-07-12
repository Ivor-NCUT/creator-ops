import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { getCurrentMember } from "@/lib/authorization";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";

export const dynamic = "force-dynamic";

const modules = [
  ["工作", "项目、任务与 AI 提效需求"],
  ["内容", "短视频、公众号与图书生产排期"],
  ["直播电商", "直播场次、商品经营与客诉"],
  ["人员", "员工、考勤、薪资与绩效"],
  ["商务", "客户、服务商、合同与收付款"],
  ["经营分析", "老板总览与部门指标"],
];

export default async function Home() {
  const organization = await db.organization.findUnique({ where: { slug: "default" } });
  if (!organization) redirect("/initialize");

  const member = await getCurrentMember();
  if (!member || member.status !== "ACTIVE") redirect("/login");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-6 py-10 lg:px-12">
      <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            {organization.name}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            内容公司的运营工作台
          </h1>
          <p className="mt-4 text-slate-600">你好，{member.user.name}。</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {roleCan(member.role, "members:read") && (
            <Link className="button-secondary" href="/settings/members">成员设置</Link>
          )}
          <form action={signOut}><button className="button-secondary" type="submit">退出</button></form>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-3">
        {modules.map(([name, description], index) => (
          <article key={name} className="border-b border-slate-200 py-8">
            <p className="text-sm tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{name}</h2>
            <p className="mt-2 leading-7 text-slate-600">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
