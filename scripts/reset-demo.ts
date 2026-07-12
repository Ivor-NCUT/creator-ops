import { db } from "../src/lib/db";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_RESET !== "true") {
    throw new Error("拒绝重置：仅可在非生产环境显式设置 ALLOW_DEMO_RESET=true");
  }
  const organizations = await db.organization.findMany({ select: { id: true, slug: true, members: { select: { userId: true } } } });
  if (organizations.length !== 1 || organizations[0].slug !== "demo-lighthouse") {
    throw new Error("拒绝重置：数据库必须只包含 demo-lighthouse 虚构演示组织");
  }
  const { id: organizationId, members } = organizations[0];
  await db.$transaction(async (tx) => {
    await tx.automationRun.deleteMany({ where: { organizationId } });
    await tx.automationRule.deleteMany({ where: { organizationId } });
    await tx.notification.deleteMany({ where: { organizationId } });
    await tx.auditEvent.deleteMany({ where: { organizationId } });
    await tx.fileMetadata.deleteMany({ where: { organizationId } });
    await tx.feedbackStatusHistory.deleteMany({ where: { feedback: { organizationId } } });
    await tx.customerFeedback.deleteMany({ where: { organizationId } });
    await tx.liveProductPerformance.deleteMany({ where: { organizationId } });
    await tx.liveSessionStatusHistory.deleteMany({ where: { liveSession: { organizationId } } });
    await tx.liveSessionPreview.deleteMany({ where: { liveSession: { organizationId } } });
    await tx.liveSessionStaff.deleteMany({ where: { liveSession: { organizationId } } });
    await tx.liveSession.deleteMany({ where: { organizationId } });
    await tx.paymentRecord.deleteMany({ where: { paymentItem: { organizationId } } });
    await tx.paymentItem.deleteMany({ where: { organizationId } });
    await tx.contractStatusHistory.deleteMany({ where: { contract: { organizationId } } });
    await tx.contract.deleteMany({ where: { organizationId } });
    await tx.commerceProduct.deleteMany({ where: { organizationId } });
    await tx.externalParty.deleteMany({ where: { organizationId } });
    await tx.attendanceApprovalHistory.deleteMany({ where: { exception: { organizationId } } });
    await tx.attendanceException.deleteMany({ where: { organizationId } });
    await tx.monthlyAttendance.deleteMany({ where: { organizationId } });
    await tx.payrollMonth.deleteMany({ where: { organizationId } });
    await tx.majorError.deleteMany({ where: { organizationId } });
    await tx.employeeProfile.deleteMany({ where: { organizationId } });
    await tx.publicationMetricSnapshot.deleteMany({ where: { publication: { organizationId } } });
    await tx.publication.deleteMany({ where: { organizationId } });
    await tx.contentStatusHistory.deleteMany({ where: { content: { organizationId } } });
    await tx.contentAssignment.deleteMany({ where: { content: { organizationId } } });
    await tx.workEvent.deleteMany({ where: { organizationId } });
    await tx.videoDetail.deleteMany({ where: { content: { organizationId } } });
    await tx.editorialDetail.deleteMany({ where: { content: { organizationId } } });
    await tx.contentItem.deleteMany({ where: { organizationId } });
    await tx.publishingAccount.deleteMany({ where: { organizationId } });
    await tx.contentProfile.deleteMany({ where: { organizationId } });
    await tx.aiRequest.deleteMany({ where: { organizationId } });
    await tx.task.deleteMany({ where: { organizationId } });
    await tx.projectMember.deleteMany({ where: { project: { organizationId } } });
    await tx.project.deleteMany({ where: { organizationId } });
    await tx.member.deleteMany({ where: { organizationId } });
    await tx.department.deleteMany({ where: { organizationId } });
    await tx.organization.delete({ where: { id: organizationId } });
  });
  await db.user.deleteMany({ where: { id: { in: members.map(({ userId }) => userId) } } });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
