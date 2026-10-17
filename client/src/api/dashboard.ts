import { apiFetch } from "./client";
export type DashboardActivity = {
  id: string;
  recordId: number;
  employeeId: number;
  employee: string;
  initials: string;
  action: string;
  detail: string;
  occurredAt: string;
  type: "evaluation" | "note" | "writeup";
};
export async function getRecentActivity(): Promise<DashboardActivity[]> {
  const response = await apiFetch("/dashboard/recent-activity");
  if (!response.ok) throw new Error("Unable to load recent activity.");
  return response.json();
}
