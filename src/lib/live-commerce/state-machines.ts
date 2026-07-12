import type { FeedbackStatus, LiveSessionStatus } from "@/generated/prisma/client";

const liveTransitions: Record<LiveSessionStatus, readonly LiveSessionStatus[]> = {
  PLANNED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["LIVE", "CANCELLED"],
  LIVE: ["COMPLETED"],
  COMPLETED: ["REVIEWED"],
  REVIEWED: [],
  CANCELLED: [],
};

const feedbackTransitions: Record<FeedbackStatus, readonly FeedbackStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED"],
  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export const canTransitionLive = (from: LiveSessionStatus, to: LiveSessionStatus) => liveTransitions[from].includes(to);
export const canTransitionFeedback = (from: FeedbackStatus, to: FeedbackStatus) => feedbackTransitions[from].includes(to);
export const nextLiveStatuses = (status: LiveSessionStatus) => liveTransitions[status];
export const nextFeedbackStatuses = (status: FeedbackStatus) => feedbackTransitions[status];
