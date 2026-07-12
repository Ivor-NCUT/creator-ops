import type { SystemRole } from "@/generated/prisma/client";

export type DashboardDomain = "content" | "live" | "projects" | "people" | "cash";

export function dashboardDomains(role: SystemRole): DashboardDomain[] {
  if (role === "OWNER" || role === "ADMIN") return ["content", "live", "projects", "people", "cash"];
  if (role === "MANAGER") return ["content", "live", "projects"];
  if (role === "HR") return ["people"];
  if (role === "FINANCE") return ["cash"];
  return [];
}
