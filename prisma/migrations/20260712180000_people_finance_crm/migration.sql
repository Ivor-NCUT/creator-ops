-- CreateEnum
CREATE TYPE "ExternalPartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'SERVICE_PROVIDER', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'PROBATION', 'LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AttendanceExceptionKind" AS ENUM ('LATE', 'EARLY_LEAVE', 'ABSENCE', 'LEAVE', 'MISSING_PUNCH', 'OVERTIME', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MajorErrorStatus" AS ENUM ('REPORTED', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "CommerceProduct" DROP CONSTRAINT "CommerceProduct_supplierId_fkey";

-- Preserve Issue #4 supplier IDs and product links while broadening the table.
ALTER TABLE "CommerceSupplier" RENAME TO "ExternalParty";
ALTER TABLE "ExternalParty" RENAME CONSTRAINT "CommerceSupplier_pkey" TO "ExternalParty_pkey";
ALTER TABLE "ExternalParty" RENAME CONSTRAINT "CommerceSupplier_organizationId_fkey" TO "ExternalParty_organizationId_fkey";
ALTER INDEX "CommerceSupplier_organizationId_name_key" RENAME TO "ExternalParty_organizationId_name_key";
ALTER TABLE "ExternalParty"
  ADD COLUMN "types" "ExternalPartyType"[] NOT NULL DEFAULT ARRAY['SUPPLIER']::"ExternalPartyType"[],
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "taxNumber" TEXT,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "jobTitle" TEXT,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hiredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeIdentity" (
    "employeeId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "phone" TEXT,
    "personalEmail" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeIdentity_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "EmployeeCompensation" (
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeCompensation_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "AttendanceException" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "kind" "AttendanceExceptionKind" NOT NULL,
    "minutes" INTEGER,
    "days" DECIMAL(6,2),
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceApprovalHistory" (
    "id" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "fromStatus" "ApprovalStatus",
    "toStatus" "ApprovalStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAttendance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "approvedExceptions" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "absenceDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "leaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollMonth" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "baseSalary" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "performance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penalties" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MajorError" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "penaltyAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "includeInPayroll" BOOLEAN NOT NULL DEFAULT true,
    "status" "MajorErrorStatus" NOT NULL DEFAULT 'REPORTED',
    "reportedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MajorError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startsOn" DATE,
    "endsOn" DATE,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractStatusHistory" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "fromStatus" "ContractStatus",
    "toStatus" "ContractStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contractId" TEXT,
    "partyId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "amount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dueOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "paymentItemId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paidOn" DATE NOT NULL,
    "reference" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_memberId_key" ON "EmployeeProfile"("memberId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_organizationId_employmentStatus_idx" ON "EmployeeProfile"("organizationId", "employmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_organizationId_employeeNo_key" ON "EmployeeProfile"("organizationId", "employeeNo");

-- CreateIndex
CREATE INDEX "AttendanceException_organizationId_status_occurredOn_idx" ON "AttendanceException"("organizationId", "status", "occurredOn");

-- CreateIndex
CREATE INDEX "AttendanceException_employeeId_occurredOn_idx" ON "AttendanceException"("employeeId", "occurredOn");

-- CreateIndex
CREATE INDEX "AttendanceApprovalHistory_exceptionId_createdAt_idx" ON "AttendanceApprovalHistory"("exceptionId", "createdAt");

-- CreateIndex
CREATE INDEX "MonthlyAttendance_organizationId_year_month_idx" ON "MonthlyAttendance"("organizationId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAttendance_employeeId_year_month_key" ON "MonthlyAttendance"("employeeId", "year", "month");

-- CreateIndex
CREATE INDEX "PayrollMonth_organizationId_year_month_idx" ON "PayrollMonth"("organizationId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollMonth_employeeId_year_month_key" ON "PayrollMonth"("employeeId", "year", "month");

-- CreateIndex
CREATE INDEX "MajorError_organizationId_status_occurredOn_idx" ON "MajorError"("organizationId", "status", "occurredOn");

-- CreateIndex
CREATE INDEX "MajorError_employeeId_occurredOn_idx" ON "MajorError"("employeeId", "occurredOn");

-- CreateIndex
CREATE INDEX "Contract_organizationId_status_endsOn_idx" ON "Contract"("organizationId", "status", "endsOn");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_organizationId_number_key" ON "Contract"("organizationId", "number");

-- CreateIndex
CREATE INDEX "ContractStatusHistory_contractId_createdAt_idx" ON "ContractStatusHistory"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentItem_organizationId_direction_status_dueOn_idx" ON "PaymentItem"("organizationId", "direction", "status", "dueOn");

-- CreateIndex
CREATE INDEX "PaymentItem_partyId_idx" ON "PaymentItem"("partyId");

-- CreateIndex
CREATE INDEX "PaymentItem_contractId_idx" ON "PaymentItem"("contractId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentItemId_paidOn_idx" ON "PaymentRecord"("paymentItemId", "paidOn");

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ExternalParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIdentity" ADD CONSTRAINT "EmployeeIdentity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCompensation" ADD CONSTRAINT "EmployeeCompensation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceException" ADD CONSTRAINT "AttendanceException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceException" ADD CONSTRAINT "AttendanceException_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceException" ADD CONSTRAINT "AttendanceException_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceException" ADD CONSTRAINT "AttendanceException_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceApprovalHistory" ADD CONSTRAINT "AttendanceApprovalHistory_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "AttendanceException"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceApprovalHistory" ADD CONSTRAINT "AttendanceApprovalHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAttendance" ADD CONSTRAINT "MonthlyAttendance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAttendance" ADD CONSTRAINT "MonthlyAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollMonth" ADD CONSTRAINT "PayrollMonth_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollMonth" ADD CONSTRAINT "PayrollMonth_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorError" ADD CONSTRAINT "MajorError_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorError" ADD CONSTRAINT "MajorError_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorError" ADD CONSTRAINT "MajorError_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorError" ADD CONSTRAINT "MajorError_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "ExternalParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractStatusHistory" ADD CONSTRAINT "ContractStatusHistory_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractStatusHistory" ADD CONSTRAINT "ContractStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "ExternalParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentItemId_fkey" FOREIGN KEY ("paymentItemId") REFERENCES "PaymentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Native invariants keep imports and future write paths honest.
ALTER TABLE "ExternalParty" ADD CONSTRAINT "ExternalParty_types_nonempty" CHECK (cardinality("types") > 0);
ALTER TABLE "EmployeeCompensation" ADD CONSTRAINT "EmployeeCompensation_nonnegative" CHECK ("baseSalary" >= 0);
ALTER TABLE "AttendanceException" ADD CONSTRAINT "AttendanceException_units_nonnegative" CHECK (("minutes" IS NULL OR "minutes" >= 0) AND ("days" IS NULL OR "days" >= 0));
ALTER TABLE "MonthlyAttendance" ADD CONSTRAINT "MonthlyAttendance_valid_month" CHECK ("year" BETWEEN 2000 AND 2200 AND "month" BETWEEN 1 AND 12);
ALTER TABLE "MonthlyAttendance" ADD CONSTRAINT "MonthlyAttendance_nonnegative" CHECK ("approvedExceptions" >= 0 AND "lateMinutes" >= 0 AND "absenceDays" >= 0 AND "leaveDays" >= 0 AND "overtimeMinutes" >= 0);
ALTER TABLE "PayrollMonth" ADD CONSTRAINT "PayrollMonth_valid_month" CHECK ("year" BETWEEN 2000 AND 2200 AND "month" BETWEEN 1 AND 12);
ALTER TABLE "PayrollMonth" ADD CONSTRAINT "PayrollMonth_nonnegative" CHECK ("baseSalary" >= 0 AND "performance" >= 0 AND "commission" >= 0 AND "allowance" >= 0 AND "penalties" >= 0 AND "netPay" >= 0);
ALTER TABLE "PayrollMonth" ADD CONSTRAINT "PayrollMonth_total_matches" CHECK ("netPay" = "baseSalary" + "performance" + "commission" + "allowance" - "penalties");
ALTER TABLE "MajorError" ADD CONSTRAINT "MajorError_penalty_nonnegative" CHECK ("penaltyAmount" >= 0);
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dates_ordered" CHECK ("startsOn" IS NULL OR "endsOn" IS NULL OR "endsOn" >= "startsOn");
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_amounts_valid" CHECK ("amount" > 0 AND "paidAmount" >= 0 AND "paidAmount" <= "amount");
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_amount_positive" CHECK ("amount" > 0);
