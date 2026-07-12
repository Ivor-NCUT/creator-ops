import assert from "node:assert/strict";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";

async function main() {
  const organization = await db.organization.findUniqueOrThrow({ where: { slug: "demo-lighthouse" } });
  const counts = Object.fromEntries(await Promise.all(Object.entries({
    members: db.member.count({ where: { organizationId: organization.id } }),
    projects: db.project.count({ where: { organizationId: organization.id } }),
    tasks: db.task.count({ where: { organizationId: organization.id } }),
    aiRequests: db.aiRequest.count({ where: { organizationId: organization.id } }),
    content: db.contentItem.count({ where: { organizationId: organization.id } }),
    publications: db.publication.count({ where: { organizationId: organization.id } }),
    liveSessions: db.liveSession.count({ where: { organizationId: organization.id } }),
    products: db.commerceProduct.count({ where: { organizationId: organization.id } }),
    feedback: db.customerFeedback.count({ where: { organizationId: organization.id } }),
    employees: db.employeeProfile.count({ where: { organizationId: organization.id } }),
    attendance: db.attendanceException.count({ where: { organizationId: organization.id } }),
    payroll: db.payrollMonth.count({ where: { organizationId: organization.id } }),
    contracts: db.contract.count({ where: { organizationId: organization.id } }),
    payments: db.paymentItem.count({ where: { organizationId: organization.id } }),
    automations: db.automationRule.count({ where: { organizationId: organization.id } }),
    automationRuns: db.automationRun.count({ where: { organizationId: organization.id } }),
  }).map(async ([key, value]) => [key, await value])));
  for (const [key, count] of Object.entries(counts)) assert.ok(Number(count) > 0, `${key} should not be empty`);

  assert.ok(await db.contentItem.findFirst({ where: { organizationId: organization.id, status: "PUBLISHED", publications: { some: { metricSnapshots: { some: {} } } }, livePreviews: { some: {} } } }), "published content must connect metrics and a live session");
  assert.ok(await db.customerFeedback.findFirst({ where: { organizationId: organization.id, isNegative: true, status: { in: ["OPEN", "IN_PROGRESS"] } } }), "negative feedback exception is missing");
  assert.ok(await db.paymentItem.findFirst({ where: { organizationId: organization.id, dueOn: { lt: new Date() }, status: { in: ["OPEN", "PARTIAL"] } } }), "overdue payment exception is missing");
  assert.ok(await db.contentItem.findFirst({ where: { organizationId: organization.id, type: "VIDEO", dueAt: { lt: new Date() }, status: { notIn: ["PUBLISHED", "ARCHIVED"] } } }), "video SLA exception is missing");
  assert.ok(await db.liveSession.findFirst({ where: { organizationId: organization.id, startsAt: { gt: new Date() }, status: "CONFIRMED" } }), "upcoming live reminder case is missing");

  const email = "owner@demo.creator-ops.example.com";
  const password = process.env.DEMO_PASSWORD ?? "CreatorOpsDemo!2026";
  const login = await auth.api.signInEmail({ body: { email, password } });
  assert.equal(login.user.email, email, "documented demo owner cannot sign in");
  console.log(JSON.stringify({ organization: organization.name, counts, login: "ok", exceptions: "ok" }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
