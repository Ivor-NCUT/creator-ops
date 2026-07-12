import Link from "next/link";
import { createLiveSession } from "@/app/actions/live-commerce";
import { AppShell, Notice, StatusBadge } from "@/components/app-shell";
import { requirePagePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LivePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const member = await requirePagePermission(); const query = await searchParams;
  const [sessions, members, videos] = await Promise.all([
    db.liveSession.findMany({ where: { organizationId: member.organizationId }, include: { owner: { select: { user: { select: { name: true } } } }, _count: { select: { staff: true, productPerformance: true, feedback: true } } }, orderBy: { startsAt: "desc" } }),
    db.member.findMany({ where: { organizationId: member.organizationId, status: "ACTIVE" }, select: { id: true, user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    db.contentItem.findMany({ where: { organizationId: member.organizationId, type: "VIDEO" }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  return <AppShell eyebrow="Live commerce" title="直播电商"><Notice {...query} />
    <div className="subnav"><Link href="/live">直播场次</Link><Link href="/live/products">商品与供应商</Link><Link href="/live/feedback">评价与客诉</Link></div>
    <section className="dashboard-grid"><div className="panel span-2"><div className="section-heading"><div><h2>直播排期</h2><p>从计划、开播到复盘保留完整状态历史</p></div></div>{sessions.length === 0 ? <p className="empty-state">暂无直播，从右侧创建第一场。</p> : <div className="table-scroll"><table><thead><tr><th>场次</th><th>渠道</th><th>负责人</th><th>开始时间</th><th>状态</th><th>关联</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td><Link className="record-link" href={`/live/${session.id}`}>{session.title}</Link></td><td>{session.channel}</td><td>{session.owner.user.name}</td><td>{session.startsAt.toLocaleString("zh-CN")}</td><td><StatusBadge>{session.status}</StatusBadge></td><td>{session._count.staff} 人 / {session._count.productPerformance} 商品 / {session._count.feedback} 反馈</td></tr>)}</tbody></table></div>}</div>
      <form action={createLiveSession} className="panel form-stack compact-form"><h2>新建直播</h2><label>场次名称<input name="title" required /></label><label>渠道<input name="channel" placeholder="如：视频号" required /></label><label>负责人<select name="ownerId" required>{members.map((item) => <option value={item.id} key={item.id}>{item.user.name}</option>)}</select></label><label>计划开始<input name="startsAt" type="datetime-local" required /></label><label>计划结束<input name="endsAt" type="datetime-local" /></label><label>首位人员<select name="staffMemberId"><option value="">未指定</option>{members.map((item) => <option value={item.id} key={item.id}>{item.user.name}</option>)}</select></label><label>人员角色<select name="staffRole"><option value="HOST">主播</option><option value="OPERATOR">运营</option><option value="MODERATOR">场控</option><option value="SUPPORT">支持</option></select></label><label>预热视频<select name="previewContentId"><option value="">未关联</option>{videos.map((video) => <option value={video.id} key={video.id}>{video.title}</option>)}</select></label><button className="button-primary" type="submit">创建场次</button></form>
    </section>
  </AppShell>;
}
