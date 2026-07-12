import type { SystemRole } from "@/generated/prisma/client";

export type PeopleActor = { role: SystemRole; departmentId: string | null };

export const canReadIdentity = ({ role }: PeopleActor) => ["OWNER", "ADMIN", "HR"].includes(role);
export const canReadCompensation = ({ role }: PeopleActor) => ["OWNER", "ADMIN", "HR", "FINANCE"].includes(role);
export const canManagePeople = ({ role }: PeopleActor) => ["OWNER", "ADMIN", "HR"].includes(role);
export const canManageFinance = ({ role }: PeopleActor) => ["OWNER", "ADMIN", "HR", "FINANCE"].includes(role);
export const employeeSensitiveInclude = (actor: PeopleActor) => ({ identity: canReadIdentity(actor), compensation: canReadCompensation(actor) });
export const canApproveAttendance = (actor: PeopleActor, employeeDepartmentId: string | null) =>
  ["OWNER", "ADMIN", "HR"].includes(actor.role) || (actor.role === "MANAGER" && actor.departmentId !== null && actor.departmentId === employeeDepartmentId);
