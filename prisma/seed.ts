import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { AutomationRuleType } from "../src/generated/prisma/client";

const DEMO_SLUG = "demo-lighthouse";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "CreatorOpsDemo!2026";
const DEMO_EMAILS = ["owner", "manager", "editor", "host", "hr", "finance"].map((name) => `${name}@demo.creator-ops.example.com`);
const day = 86_400_000;
const now = new Date();
const at = (days: number, hour = 10) => {
  const date = new Date(now.getTime() + days * day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function createUser(name: string, email: string) {
  const result = await auth.api.signUpEmail({ body: { name, email, password: DEMO_PASSWORD } });
  return result.user.id;
}

async function main() {
  if (await db.organization.findUnique({ where: { slug: DEMO_SLUG } })) {
    throw new Error("演示组织已存在；如需重建，请运行 pnpm db:demo:reset（仅限非生产环境）");
  }
  if (await db.organization.count()) {
    throw new Error("数据库已有组织。为避免覆盖真实数据，演示 seed 已中止。");
  }

  const users = await Promise.all([
    createUser("林舟（虚构）", DEMO_EMAILS[0]),
    createUser("周遥（虚构）", DEMO_EMAILS[1]),
    createUser("许澄（虚构）", DEMO_EMAILS[2]),
    createUser("顾禾（虚构）", DEMO_EMAILS[3]),
    createUser("沈安（虚构）", DEMO_EMAILS[4]),
    createUser("陆宁（虚构）", DEMO_EMAILS[5]),
  ]);

  await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: "灯塔内容实验室（虚构演示）", slug: DEMO_SLUG } });
    const [contentDept, commerceDept, supportDept] = await Promise.all([
      tx.department.create({ data: { organizationId: organization.id, name: "内容增长部" } }),
      tx.department.create({ data: { organizationId: organization.id, name: "直播电商部" } }),
      tx.department.create({ data: { organizationId: organization.id, name: "综合支持部" } }),
    ]);
    const members = await Promise.all([
      tx.member.create({ data: { organizationId: organization.id, userId: users[0], departmentId: supportDept.id, role: "OWNER" } }),
      tx.member.create({ data: { organizationId: organization.id, userId: users[1], departmentId: contentDept.id, role: "MANAGER" } }),
      tx.member.create({ data: { organizationId: organization.id, userId: users[2], departmentId: contentDept.id, role: "MEMBER" } }),
      tx.member.create({ data: { organizationId: organization.id, userId: users[3], departmentId: commerceDept.id, role: "MEMBER" } }),
      tx.member.create({ data: { organizationId: organization.id, userId: users[4], departmentId: supportDept.id, role: "HR" } }),
      tx.member.create({ data: { organizationId: organization.id, userId: users[5], departmentId: supportDept.id, role: "FINANCE" } }),
    ]);
    const [owner, manager, editor, host, hr, finance] = members;

    const project = await tx.project.create({ data: {
      organizationId: organization.id, name: "春日轻生活增长战役（虚构）", description: "用内容种草、直播转化和私域复购验证一条完整增长链路。", status: "ACTIVE", priority: "HIGH", ownerId: manager.id, startsAt: at(-20), dueAt: at(20),
      members: { create: [{ memberId: manager.id }, { memberId: editor.id }, { memberId: host.id }] },
    } });
    await tx.project.create({ data: { organizationId: organization.id, name: "旧版素材归档（虚构）", status: "BLOCKED", priority: "NORMAL", ownerId: manager.id, startsAt: at(-30), dueAt: at(-2) } });
    const task = await tx.task.create({ data: { organizationId: organization.id, projectId: project.id, title: "完成三条直播预热视频", status: "ACTIVE", priority: "HIGH", assigneeId: editor.id, dueAt: at(2), points: 5 } });
    await tx.task.createMany({ data: [
      { organizationId: organization.id, projectId: project.id, title: "确认直播货盘与机制", status: "DONE", assigneeId: host.id, dueAt: at(-3), completedAt: at(-4), points: 3 },
      { organizationId: organization.id, projectId: project.id, parentId: task.id, title: "补拍产品使用特写", status: "BLOCKED", priority: "URGENT", assigneeId: editor.id, dueAt: at(-1), points: 2 },
    ] });
    await tx.aiRequest.createMany({ data: [
      { organizationId: organization.id, projectId: project.id, title: "批量生成视频标题备选", problem: "每周标题脑暴耗时约三小时", expectedOutcome: "从选题信息生成十个可编辑标题", status: "DELIVERED", priority: "NORMAL", requesterId: manager.id, ownerId: editor.id, dueAt: at(-4) },
      { organizationId: organization.id, projectId: project.id, title: "直播复盘自动摘要", problem: "复盘数据和话术改进散落在多处", expectedOutcome: "自动汇总核心指标与改进动作", status: "VALIDATING", priority: "HIGH", requesterId: host.id, ownerId: editor.id, dueAt: at(3) },
    ] });

    const [profile, videoAccount, articleAccount] = await Promise.all([
      tx.contentProfile.create({ data: { organizationId: organization.id, name: "灯塔主理人（虚构）" } }),
      tx.publishingAccount.create({ data: { organizationId: organization.id, name: "灯塔轻生活视频号（虚构）", channel: "视频号" } }),
      tx.publishingAccount.create({ data: { organizationId: organization.id, name: "灯塔生活手册（虚构）", channel: "公众号" } }),
    ]);
    const publishedVideo = await tx.contentItem.create({ data: {
      organizationId: organization.id, projectId: project.id, profileId: profile.id, ownerId: manager.id, type: "VIDEO", title: "桌面凌乱的人，先别急着买收纳盒（虚构）", summary: "从真实使用场景引出产品解决方案。", status: "PUBLISHED", priority: "HIGH", plannedAt: at(-7), dueAt: at(-6),
      video: { create: { scriptUrl: "https://example.invalid/demo-script", footageUrl: "https://example.invalid/demo-footage", workloadPoints: 5, slaStartedAt: at(-10) } },
      assignments: { create: [{ memberId: editor.id, role: "EDITOR" }, { memberId: manager.id, role: "REVIEWER" }] },
    } });
    const slaVideo = await tx.contentItem.create({ data: {
      organizationId: organization.id, projectId: project.id, profileId: profile.id, ownerId: editor.id, type: "VIDEO", title: "通勤包里真正有用的五件东西（虚构）", status: "ROUGH_CUT", priority: "URGENT", plannedAt: at(-3), dueAt: at(-1),
      video: { create: { workloadPoints: 8, slaStartedAt: at(-5) } }, assignments: { create: [{ memberId: editor.id, role: "EDITOR" }] },
    } });
    const article = await tx.contentItem.create({ data: {
      organizationId: organization.id, projectId: project.id, profileId: profile.id, ownerId: manager.id, type: "ARTICLE", title: "一场直播背后的七天协作清单（虚构）", status: "PUBLISHED", plannedAt: at(-35), dueAt: at(-36),
      editorial: { create: { topic: "透明展示内容团队的协作过程", manuscriptUrl: "https://example.invalid/demo-manuscript", workloadPoints: 5 } }, assignments: { create: [{ memberId: manager.id, role: "WRITER" }, { memberId: editor.id, role: "REVIEWER" }] },
    } });
    await tx.contentItem.create({ data: { organizationId: organization.id, projectId: project.id, profileId: profile.id, ownerId: manager.id, type: "ARTICLE", title: "如何读懂一次直播复盘（虚构）", status: "SCHEDULED", plannedAt: at(3), dueAt: at(2), editorial: { create: { topic: "把数据变成下一场直播的动作", workloadPoints: 3 } } } });
    await tx.contentItem.create({ data: { organizationId: organization.id, profileId: profile.id, ownerId: manager.id, type: "BOOK", title: "小团队内容运营手册（虚构）", status: "IDEA", summary: "把本次增长战役的方法沉淀成图书选题。", editorial: { create: { topic: "内容公司的协作系统", workloadPoints: 13 } } } });
    await tx.contentStatusHistory.createMany({ data: [
      { contentId: publishedVideo.id, fromStatus: "SCHEDULED", toStatus: "PUBLISHED", actorId: manager.id, note: "按排期发布（虚构）", createdAt: at(-6) },
      { contentId: slaVideo.id, fromStatus: "READY_TO_SHOOT", toStatus: "ROUGH_CUT", actorId: editor.id, note: "已完成首版剪辑（虚构）", createdAt: at(-3) },
      { contentId: article.id, fromStatus: "REVIEW", toStatus: "PUBLISHED", actorId: manager.id, createdAt: at(-35) },
    ] });
    const publication = await tx.publication.create({ data: { organizationId: organization.id, contentId: publishedVideo.id, accountId: videoAccount.id, publishedAt: at(-6), url: "https://example.invalid/demo-video" } });
    const articlePublication = await tx.publication.create({ data: { organizationId: organization.id, contentId: article.id, accountId: articleAccount.id, publishedAt: at(-35), url: "https://example.invalid/demo-article" } });
    await tx.publicationMetricSnapshot.createMany({ data: [
      { publicationId: publication.id, capturedAt: at(-5), views: 8200, likes: 516, comments: 74, shares: 123, followers: 18800 },
      { publicationId: publication.id, capturedAt: at(-1), views: 23600, likes: 1480, comments: 196, shares: 382, followers: 19240 },
      { publicationId: articlePublication.id, capturedAt: at(-30), views: 4200, likes: 180, comments: 31, shares: 89, followers: 7600 },
    ] });
    await tx.workEvent.createMany({ data: [
      { organizationId: organization.id, memberId: editor.id, contentId: publishedVideo.id, type: "CONTENT_PUBLISHED", points: 5, occurredAt: at(-6) },
      { organizationId: organization.id, memberId: editor.id, contentId: slaVideo.id, type: "CONTENT_TRANSITION", points: 8, occurredAt: at(-3) },
      { organizationId: organization.id, memberId: manager.id, contentId: article.id, type: "CONTENT_PUBLISHED", points: 5, occurredAt: at(-35) },
    ] });

    const [supplier, customer, service] = await Promise.all([
      tx.externalParty.create({ data: { organizationId: organization.id, name: "青屿生活制造（虚构）", types: ["SUPPLIER"], contactName: "唐青（虚构）", contactEmail: "supplier@example.invalid" } }),
      tx.externalParty.create({ data: { organizationId: organization.id, name: "云杉品牌中心（虚构）", types: ["CUSTOMER"], contactName: "白榆（虚构）", contactEmail: "customer@example.invalid" } }),
      tx.externalParty.create({ data: { organizationId: organization.id, name: "晴窗摄影工作室（虚构）", types: ["SERVICE_PROVIDER"], contactEmail: "studio@example.invalid" } }),
    ]);
    const [organizer, cup] = await Promise.all([
      tx.commerceProduct.create({ data: { organizationId: organization.id, supplierId: supplier.id, name: "模块化桌面收纳架（虚构）", sku: "DEMO-ORG-01", listPrice: "129.00" } }),
      tx.commerceProduct.create({ data: { organizationId: organization.id, supplierId: supplier.id, name: "轻量随行杯（虚构）", sku: "DEMO-CUP-02", listPrice: "79.00" } }),
    ]);
    const completedLive = await tx.liveSession.create({ data: {
      organizationId: organization.id, title: "春日轻生活专场（虚构）", channel: "视频号", status: "REVIEWED", ownerId: host.id, startsAt: at(-5, 19), endsAt: at(-5, 22), actualStartsAt: at(-5, 19), actualEndsAt: at(-5, 21), viewers: 18600, peakViewers: 2310, newFollowers: 860, reviewSummary: "收纳架演示转化突出；下次提前说明杯盖清洁方法。",
      staff: { create: [{ memberId: host.id, role: "HOST" }, { memberId: manager.id, role: "OPERATOR" }] }, previews: { create: [{ contentId: publishedVideo.id }] },
    } });
    const upcomingLive = await tx.liveSession.create({ data: {
      organizationId: organization.id, title: "通勤轻装返场（虚构）", channel: "视频号", status: "CONFIRMED", ownerId: host.id, startsAt: at(1, 19), endsAt: at(1, 22), staff: { create: [{ memberId: host.id, role: "HOST" }, { memberId: editor.id, role: "SUPPORT" }] }, previews: { create: [{ contentId: slaVideo.id }] },
    } });
    await tx.liveSessionStatusHistory.createMany({ data: [
      { liveSessionId: completedLive.id, fromStatus: "COMPLETED", toStatus: "REVIEWED", actorId: host.id, note: "复盘已完成（虚构）", createdAt: at(-4) },
      { liveSessionId: upcomingLive.id, fromStatus: "PLANNED", toStatus: "CONFIRMED", actorId: host.id, createdAt: at(-1) },
    ] });
    await tx.liveProductPerformance.createMany({ data: [
      { organizationId: organization.id, liveSessionId: completedLive.id, productId: organizer.id, impressions: 15400, clicks: 6200, orders: 486, buyers: 451, gmv: "62694.00", refundAmount: "2580.00", inventory: 210, commission: "9404.10" },
      { organizationId: organization.id, liveSessionId: completedLive.id, productId: cup.id, impressions: 12100, clicks: 3900, orders: 312, buyers: 300, gmv: "24648.00", refundAmount: "1185.00", inventory: 388, commission: "2957.76" },
    ] });
    const complaint = await tx.customerFeedback.create({ data: { organizationId: organization.id, liveSessionId: completedLive.id, productId: cup.id, kind: "COMPLAINT", category: "PRODUCT_QUALITY", status: "IN_PROGRESS", isNegative: true, title: "杯盖清洁说明不清楚（虚构）", detail: "顾客反馈拆洗步骤难理解。", source: "直播售后", assigneeId: host.id } });
    await tx.customerFeedback.create({ data: { organizationId: organization.id, liveSessionId: completedLive.id, productId: organizer.id, kind: "REVIEW", category: "CONTENT", status: "RESOLVED", title: "演示直观，尺寸说明清楚（虚构）", source: "商品评价", assigneeId: host.id, resolution: "感谢反馈并整理为下次直播素材", resolvedAt: at(-3) } });
    await tx.feedbackStatusHistory.create({ data: { feedbackId: complaint.id, fromStatus: "OPEN", toStatus: "IN_PROGRESS", actorId: host.id, note: "已向供应商索取新版说明图（虚构）", createdAt: at(-1) } });

    const employeeData = [
      [manager, "D001", "内容增长负责人", "11800.00"], [editor, "D002", "视频剪辑", "8800.00"], [host, "D003", "直播主理人", "9800.00"], [hr, "D004", "人事行政", "8500.00"], [finance, "D005", "财务", "9200.00"],
    ] as const;
    const employees = [];
    for (const [member, employeeNo, jobTitle, salary] of employeeData) {
      employees.push(await tx.employeeProfile.create({ data: { organizationId: organization.id, memberId: member.id, employeeNo, jobTitle, hiredAt: at(-300), identity: { create: { legalName: `${member.id.slice(0, 4)}（虚构身份）`, personalEmail: `${employeeNo.toLowerCase()}@example.invalid` } }, compensation: { create: { baseSalary: salary } } } }));
    }
    const [managerEmployee, editorEmployee, hostEmployee] = employees;
    const late = await tx.attendanceException.create({ data: { organizationId: organization.id, employeeId: editorEmployee.id, occurredOn: at(-8), kind: "LATE", minutes: 18, reason: "地铁临时停运（虚构）", status: "APPROVED", submittedById: editor.id, approvedById: hr.id, decidedAt: at(-7) } });
    await tx.attendanceApprovalHistory.create({ data: { exceptionId: late.id, fromStatus: "PENDING", toStatus: "APPROVED", actorId: hr.id, note: "交通公告已核验（虚构）" } });
    await tx.attendanceException.create({ data: { organizationId: organization.id, employeeId: hostEmployee.id, occurredOn: at(-1), kind: "MISSING_PUNCH", reason: "直播彩排后漏打卡（虚构）", status: "PENDING", submittedById: host.id } });
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    await tx.monthlyAttendance.createMany({ data: [
      { organizationId: organization.id, employeeId: editorEmployee.id, year, month, approvedExceptions: 1, lateMinutes: 18 },
      { organizationId: organization.id, employeeId: hostEmployee.id, year, month, approvedExceptions: 0, overtimeMinutes: 240 },
    ] });
    const error = await tx.majorError.create({ data: { organizationId: organization.id, employeeId: editorEmployee.id, occurredOn: at(-6), title: "预热视频字幕商品规格写错（虚构）", detail: "发布十分钟后发现并下架修正。", penaltyAmount: "200.00", status: "CONFIRMED", reportedById: manager.id, reviewedById: hr.id, reviewedAt: at(-5) } });
    await tx.payrollMonth.createMany({ data: [
      { organizationId: organization.id, employeeId: managerEmployee.id, year, month, baseSalary: "11800.00", performance: "1800.00", netPay: "13600.00", note: "虚构演示薪资" },
      { organizationId: organization.id, employeeId: editorEmployee.id, year, month, baseSalary: "8800.00", performance: "1200.00", penalties: "200.00", netPay: "9800.00", note: `含重大失误 ${error.id.slice(0, 6)}（虚构）` },
      { organizationId: organization.id, employeeId: hostEmployee.id, year, month, baseSalary: "9800.00", commission: "2100.00", allowance: "300.00", netPay: "12200.00", note: "虚构演示薪资" },
    ] });

    const customerContract = await tx.contract.create({ data: { organizationId: organization.id, partyId: customer.id, ownerId: owner.id, number: "DEMO-C-2026-001", title: "春日内容增长服务（虚构）", status: "ACTIVE", startsOn: at(-20), endsOn: at(12), amount: "120000.00" } });
    const serviceContract = await tx.contract.create({ data: { organizationId: organization.id, partyId: service.id, ownerId: manager.id, number: "DEMO-P-2026-002", title: "季度摄影制作服务（虚构）", status: "ACTIVE", startsOn: at(-30), endsOn: at(90), amount: "36000.00" } });
    await tx.contractStatusHistory.createMany({ data: [
      { contractId: customerContract.id, fromStatus: "DRAFT", toStatus: "ACTIVE", actorId: owner.id, createdAt: at(-20) },
      { contractId: serviceContract.id, fromStatus: "DRAFT", toStatus: "ACTIVE", actorId: manager.id, createdAt: at(-30) },
    ] });
    const receivable = await tx.paymentItem.create({ data: { organizationId: organization.id, contractId: customerContract.id, partyId: customer.id, direction: "RECEIVABLE", status: "PARTIAL", title: "增长服务第二期款（虚构）", amount: "60000.00", paidAmount: "30000.00", dueOn: at(-2) } });
    await tx.paymentRecord.create({ data: { paymentItemId: receivable.id, amount: "30000.00", paidOn: at(-10), reference: "DEMO-R-001", actorId: finance.id } });
    await tx.paymentItem.create({ data: { organizationId: organization.id, contractId: serviceContract.id, partyId: service.id, direction: "PAYABLE", status: "OPEN", title: "四月摄影制作费（虚构）", amount: "12000.00", dueOn: at(5) } });

    await tx.automationRule.createMany({ data: Object.values(AutomationRuleType).map((type) => ({ organizationId: organization.id, type, recipientId: type === "OWNER_EXCEPTIONS" ? owner.id : null })) });
    const feedbackRule = await tx.automationRule.findUniqueOrThrow({ where: { organizationId_type: { organizationId: organization.id, type: "NEGATIVE_FEEDBACK" } } });
    await tx.automationRun.create({ data: { organizationId: organization.id, ruleId: feedbackRule.id, idempotencyKey: `demo:${feedbackRule.id}:${at(-1).toISOString().slice(0, 13)}`, status: "SUCCEEDED", notifications: 1, startedAt: at(-1), finishedAt: at(-1) } });
    await tx.notification.createMany({ data: [
      { organizationId: organization.id, recipientId: owner.id, title: "存在逾期应收款（虚构演示）", body: "云杉品牌中心第二期款尚余 30,000 元。", href: "/business/payments", dedupeKey: "demo-overdue-payment" },
      { organizationId: organization.id, recipientId: host.id, title: "待处理负面反馈（虚构演示）", body: "杯盖清洁说明需要补充。", href: "/live/feedback", dedupeKey: "demo-negative-feedback" },
    ] });
    await tx.auditEvent.createMany({ data: [
      { organizationId: organization.id, actorId: owner.id, action: "demo.seeded", entityType: "Organization", entityId: organization.id, metadata: { fictional: true } },
      { organizationId: organization.id, actorId: finance.id, action: "payment.recorded", entityType: "PaymentItem", entityId: receivable.id, metadata: { fictional: true } },
    ] });
    await tx.fileMetadata.create({ data: { organizationId: organization.id, storageKey: "demo-only/content/spring-campaign-cover.jpg", originalName: "春日活动封面-虚构示例.jpg", contentType: "image/jpeg", sizeBytes: BigInt(348_210) } });
  });

  console.log(`已创建虚构演示组织与 ${users.length} 个可登录账号。密码：${DEMO_PASSWORD}`);
}

main().catch(async (error) => {
  console.error(error);
  await db.user.deleteMany({ where: { email: { in: DEMO_EMAILS }, member: null } }).catch(() => undefined);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
