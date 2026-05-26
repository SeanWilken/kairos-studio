import type { CoreApiClient } from "./client";

export type AuditEventRecord = {
  event_id?: string;
  timestamp?: string;
  actor?: string;
  action?: string;
  category?: string;
  target?: string;
  details?: string;
  status?: "success" | "warning" | "error" | string;
  ip_address?: string;
};

export type ActivitySummaryRecord = {
  category: string;
  count: number;
  change?: string;
  trend?: "up" | "down" | string;
};

export type ActivityTopUserRecord = {
  name: string;
  actions: number;
  role?: string;
};

export type ActivityBreakdownRecord = {
  name: string;
  value: number;
  color?: string;
};

export type ActivitySummaryResponse = {
  summary?: ActivitySummaryRecord[];
  breakdown?: ActivityBreakdownRecord[];
  top_users?: ActivityTopUserRecord[];
};

export const auditApi = {
  listEvents: (client: CoreApiClient, query?: { orgId?: string; category?: string; status?: string; q?: string }) =>
    client.get<{ items: AuditEventRecord[] }>("/v1/audit/events", {
      org_id: query?.orgId,
      category: query?.category,
      status: query?.status,
      q: query?.q,
    }),

  getSummary: (client: CoreApiClient, query?: { orgId?: string }) =>
    client.get<ActivitySummaryResponse>("/v1/audit/summary", {
      org_id: query?.orgId,
    }),
};
