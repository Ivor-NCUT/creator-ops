import type { AiRequestStatus, ContentStatus, WorkStatus } from "@/generated/prisma/client";

const contentTransitions = {
  IDEA: ["READY_TO_SHOOT", "REVIEW", "ARCHIVED"],
  READY_TO_SHOOT: ["ROUGH_CUT", "RETAKE", "ARCHIVED"],
  ROUGH_CUT: ["FINE_CUT", "RETAKE", "ARCHIVED"],
  FINE_CUT: ["REVIEW", "RETAKE", "ARCHIVED"],
  REVIEW: ["SCHEDULED", "RETAKE", "REJECTED", "ARCHIVED"],
  RETAKE: ["READY_TO_SHOOT", "ROUGH_CUT", "ARCHIVED"],
  REJECTED: ["IDEA", "ARCHIVED"],
  SCHEDULED: ["PUBLISHED", "RETAKE", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
} as const satisfies Record<ContentStatus, readonly ContentStatus[]>;

const workTransitions = {
  PLANNED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["BLOCKED", "DONE", "CANCELLED"],
  BLOCKED: ["ACTIVE", "CANCELLED"],
  DONE: ["ACTIVE"],
  CANCELLED: ["PLANNED"],
} as const satisfies Record<WorkStatus, readonly WorkStatus[]>;

const aiTransitions = {
  SUBMITTED: ["TRIAGED", "REJECTED"],
  TRIAGED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["VALIDATING", "REJECTED"],
  VALIDATING: ["IN_PROGRESS", "DELIVERED"],
  DELIVERED: ["IN_PROGRESS"],
  REJECTED: ["SUBMITTED"],
} as const satisfies Record<AiRequestStatus, readonly AiRequestStatus[]>;

export function nextContentStatuses(status: ContentStatus) {
  return contentTransitions[status] as readonly ContentStatus[];
}

export function canTransitionContent(from: ContentStatus, to: ContentStatus) {
  return nextContentStatuses(from).includes(to);
}

export function canTransitionWork(from: WorkStatus, to: WorkStatus) {
  return (workTransitions[from] as readonly WorkStatus[]).includes(to);
}

export function canTransitionAi(from: AiRequestStatus, to: AiRequestStatus) {
  return (aiTransitions[from] as readonly AiRequestStatus[]).includes(to);
}
