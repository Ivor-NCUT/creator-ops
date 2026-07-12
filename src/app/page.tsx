const modules = [
  ["工作", "项目、任务与 AI 提效需求"],
  ["内容", "短视频、公众号与图书生产排期"],
  ["直播电商", "直播场次、商品经营与客诉"],
  ["人员", "员工、考勤、薪资与绩效"],
  ["商务", "客户、服务商、合同与收付款"],
  ["经营分析", "老板总览与部门指标"],
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-6 py-12 lg:px-12">
      <header className="border-b border-slate-200 pb-10">
        <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-emerald-700 uppercase">
          Private deployment · Open source
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
          内容公司的运营工作台
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          把项目、内容生产、直播电商、人事与经营数据放回同一个可信系统。
        </p>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-3">
        {modules.map(([name, description], index) => (
          <article key={name} className="border-b border-slate-200 py-8">
            <p className="text-sm tabular-nums text-slate-400">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{name}</h2>
            <p className="mt-2 leading-7 text-slate-600">{description}</p>
          </article>
        ))}
      </section>

      <footer className="pt-10 text-sm text-slate-500">
        Creator Ops 正在构建首个可部署版本。
      </footer>
    </main>
  );
}
