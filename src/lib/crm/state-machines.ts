import type { ContractStatus } from "@/generated/prisma/client";

const transitions: Record<ContractStatus, readonly ContractStatus[]> = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "TERMINATED"],
  COMPLETED: [],
  TERMINATED: [],
  CANCELLED: [],
};

export const canTransitionContract = (from: ContractStatus, to: ContractStatus) => transitions[from].includes(to);
