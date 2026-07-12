CREATE TYPE "AutomationRuleType" AS ENUM ('LIVE_REMINDER', 'CONTRACT_EXPIRY', 'NEGATIVE_FEEDBACK', 'VIDEO_SLA', 'OWNER_EXCEPTIONS');
CREATE TYPE "AutomationRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "Notification" ADD COLUMN "href" TEXT;
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

CREATE TABLE "AutomationRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" "AutomationRuleType" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "recipientId" TEXT,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AutomationRule_organizationId_type_key" ON "AutomationRule"("organizationId", "type");
CREATE INDEX "AutomationRule_organizationId_enabled_idx" ON "AutomationRule"("organizationId", "enabled");
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AutomationRun" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "AutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "notifications" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AutomationRun_organizationId_idempotencyKey_key" ON "AutomationRun"("organizationId", "idempotencyKey");
CREATE INDEX "AutomationRun_organizationId_startedAt_idx" ON "AutomationRun"("organizationId", "startedAt");
CREATE INDEX "AutomationRun_ruleId_status_startedAt_idx" ON "AutomationRun"("ruleId", "status", "startedAt");
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
