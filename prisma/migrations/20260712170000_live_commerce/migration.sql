-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'LIVE', 'COMPLETED', 'REVIEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveStaffRole" AS ENUM ('HOST', 'CO_HOST', 'OPERATOR', 'MODERATOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "FeedbackKind" AS ENUM ('REVIEW', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('PRODUCT_QUALITY', 'SHIPPING', 'SERVICE', 'REFUND', 'CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'PLANNED',
    "ownerId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "actualStartsAt" TIMESTAMP(3),
    "actualEndsAt" TIMESTAMP(3),
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "newFollowers" INTEGER NOT NULL DEFAULT 0,
    "reviewSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSessionStaff" (
    "liveSessionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "LiveStaffRole" NOT NULL,

    CONSTRAINT "LiveSessionStaff_pkey" PRIMARY KEY ("liveSessionId","memberId","role")
);

-- CreateTable
CREATE TABLE "LiveSessionPreview" (
    "liveSessionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "LiveSessionPreview_pkey" PRIMARY KEY ("liveSessionId","contentId")
);

-- CreateTable
CREATE TABLE "LiveSessionStatusHistory" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "fromStatus" "LiveSessionStatus",
    "toStatus" "LiveSessionStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSessionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceSupplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceProduct" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "listPrice" DECIMAL(18,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveProductPerformance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "buyers" INTEGER NOT NULL DEFAULT 0,
    "gmv" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "refundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveProductPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "productId" TEXT,
    "kind" "FeedbackKind" NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "isNegative" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "source" TEXT,
    "assigneeId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackStatusHistory" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "fromStatus" "FeedbackStatus",
    "toStatus" "FeedbackStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveSession_organizationId_startsAt_idx" ON "LiveSession"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "LiveSession_organizationId_status_startsAt_idx" ON "LiveSession"("organizationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "LiveSessionStaff_memberId_idx" ON "LiveSessionStaff"("memberId");

-- CreateIndex
CREATE INDEX "LiveSessionPreview_contentId_idx" ON "LiveSessionPreview"("contentId");

-- CreateIndex
CREATE INDEX "LiveSessionStatusHistory_liveSessionId_createdAt_idx" ON "LiveSessionStatusHistory"("liveSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveSessionStatusHistory_actorId_createdAt_idx" ON "LiveSessionStatusHistory"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceSupplier_organizationId_name_key" ON "CommerceSupplier"("organizationId", "name");

-- CreateIndex
CREATE INDEX "CommerceProduct_organizationId_active_idx" ON "CommerceProduct"("organizationId", "active");

-- CreateIndex
CREATE INDEX "CommerceProduct_supplierId_idx" ON "CommerceProduct"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceProduct_organizationId_sku_key" ON "CommerceProduct"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "LiveProductPerformance_organizationId_liveSessionId_idx" ON "LiveProductPerformance"("organizationId", "liveSessionId");

-- CreateIndex
CREATE INDEX "LiveProductPerformance_productId_idx" ON "LiveProductPerformance"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveProductPerformance_liveSessionId_productId_key" ON "LiveProductPerformance"("liveSessionId", "productId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_organizationId_status_createdAt_idx" ON "CustomerFeedback"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_assigneeId_status_idx" ON "CustomerFeedback"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "CustomerFeedback_liveSessionId_idx" ON "CustomerFeedback"("liveSessionId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_productId_idx" ON "CustomerFeedback"("productId");

-- CreateIndex
CREATE INDEX "FeedbackStatusHistory_feedbackId_createdAt_idx" ON "FeedbackStatusHistory"("feedbackId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackStatusHistory_actorId_createdAt_idx" ON "FeedbackStatusHistory"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionStaff" ADD CONSTRAINT "LiveSessionStaff_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionStaff" ADD CONSTRAINT "LiveSessionStaff_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionPreview" ADD CONSTRAINT "LiveSessionPreview_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionPreview" ADD CONSTRAINT "LiveSessionPreview_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionStatusHistory" ADD CONSTRAINT "LiveSessionStatusHistory_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSessionStatusHistory" ADD CONSTRAINT "LiveSessionStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceSupplier" ADD CONSTRAINT "CommerceSupplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "CommerceSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveProductPerformance" ADD CONSTRAINT "LiveProductPerformance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveProductPerformance" ADD CONSTRAINT "LiveProductPerformance_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveProductPerformance" ADD CONSTRAINT "LiveProductPerformance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CommerceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CommerceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackStatusHistory" ADD CONSTRAINT "FeedbackStatusHistory_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackStatusHistory" ADD CONSTRAINT "FeedbackStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business invariants kept at the persistence boundary.
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_schedule_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_metrics_check" CHECK ("viewers" >= 0 AND "peakViewers" >= 0 AND "peakViewers" <= "viewers" AND "newFollowers" >= 0);
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_listPrice_check" CHECK ("listPrice" IS NULL OR "listPrice" >= 0);
ALTER TABLE "LiveProductPerformance" ADD CONSTRAINT "LiveProductPerformance_funnel_check" CHECK ("impressions" >= 0 AND "clicks" >= 0 AND "clicks" <= "impressions" AND "orders" >= 0 AND "orders" <= "clicks" AND "buyers" >= 0 AND "buyers" <= "orders");
ALTER TABLE "LiveProductPerformance" ADD CONSTRAINT "LiveProductPerformance_money_check" CHECK ("gmv" >= 0 AND "refundAmount" >= 0 AND "refundAmount" <= "gmv" AND "commission" >= 0 AND "commission" <= "gmv" AND "inventory" >= 0);
