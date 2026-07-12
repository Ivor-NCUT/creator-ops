-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('PLANNED', 'ACTIVE', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AiRequestStatus" AS ENUM ('SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'VALIDATING', 'DELIVERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'ARTICLE', 'BOOK');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'READY_TO_SHOOT', 'ROUGH_CUT', 'FINE_CUT', 'REVIEW', 'RETAKE', 'REJECTED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentAssignmentRole" AS ENUM ('OWNER', 'DIRECTOR', 'EDITOR', 'WRITER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "WorkEventType" AS ENUM ('CONTENT_CREATED', 'CONTENT_TRANSITION', 'CONTENT_PUBLISHED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "ownerId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","memberId")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assigneeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "status" "AiRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "requesterId" TEXT NOT NULL,
    "ownerId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishingAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "profileId" TEXT,
    "ownerId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'IDEA',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "plannedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoDetail" (
    "contentId" TEXT NOT NULL,
    "scriptUrl" TEXT,
    "footageUrl" TEXT,
    "workloadPoints" INTEGER NOT NULL DEFAULT 1,
    "slaStartedAt" TIMESTAMP(3),

    CONSTRAINT "VideoDetail_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "EditorialDetail" (
    "contentId" TEXT NOT NULL,
    "topic" TEXT,
    "manuscriptUrl" TEXT,
    "workloadPoints" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EditorialDetail_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "ContentAssignment" (
    "contentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "ContentAssignmentRole" NOT NULL,

    CONSTRAINT "ContentAssignment_pkey" PRIMARY KEY ("contentId","memberId","role")
);

-- CreateTable
CREATE TABLE "ContentStatusHistory" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "fromStatus" "ContentStatus",
    "toStatus" "ContentStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMetricSnapshot" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" "WorkEventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_organizationId_status_dueAt_idx" ON "Project"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ProjectMember_memberId_idx" ON "ProjectMember"("memberId");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_dueAt_idx" ON "Task"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_projectId_parentId_idx" ON "Task"("projectId", "parentId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "AiRequest_organizationId_status_dueAt_idx" ON "AiRequest"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "AiRequest_requesterId_idx" ON "AiRequest"("requesterId");

-- CreateIndex
CREATE INDEX "AiRequest_ownerId_idx" ON "AiRequest"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentProfile_organizationId_name_key" ON "ContentProfile"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PublishingAccount_organizationId_channel_name_key" ON "PublishingAccount"("organizationId", "channel", "name");

-- CreateIndex
CREATE INDEX "ContentItem_organizationId_type_status_plannedAt_idx" ON "ContentItem"("organizationId", "type", "status", "plannedAt");

-- CreateIndex
CREATE INDEX "ContentItem_ownerId_idx" ON "ContentItem"("ownerId");

-- CreateIndex
CREATE INDEX "ContentAssignment_memberId_role_idx" ON "ContentAssignment"("memberId", "role");

-- CreateIndex
CREATE INDEX "ContentStatusHistory_contentId_createdAt_idx" ON "ContentStatusHistory"("contentId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentStatusHistory_actorId_createdAt_idx" ON "ContentStatusHistory"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Publication_organizationId_publishedAt_idx" ON "Publication"("organizationId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_contentId_accountId_publishedAt_key" ON "Publication"("contentId", "accountId", "publishedAt");

-- CreateIndex
CREATE INDEX "PublicationMetricSnapshot_capturedAt_idx" ON "PublicationMetricSnapshot"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationMetricSnapshot_publicationId_capturedAt_key" ON "PublicationMetricSnapshot"("publicationId", "capturedAt");

-- CreateIndex
CREATE INDEX "WorkEvent_organizationId_occurredAt_idx" ON "WorkEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "WorkEvent_memberId_occurredAt_idx" ON "WorkEvent"("memberId", "occurredAt");

-- CreateIndex
-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProfile" ADD CONSTRAINT "ContentProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingAccount" ADD CONSTRAINT "PublishingAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ContentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDetail" ADD CONSTRAINT "VideoDetail_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialDetail" ADD CONSTRAINT "EditorialDetail_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStatusHistory" ADD CONSTRAINT "ContentStatusHistory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStatusHistory" ADD CONSTRAINT "ContentStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PublishingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMetricSnapshot" ADD CONSTRAINT "PublicationMetricSnapshot_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEvent" ADD CONSTRAINT "WorkEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEvent" ADD CONSTRAINT "WorkEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEvent" ADD CONSTRAINT "WorkEvent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
