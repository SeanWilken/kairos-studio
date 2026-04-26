import type { CoreApiClient } from "./client";

export type BootstrapSessionPayload = {
  runtime: Record<string, unknown>;
  database: Record<string, unknown>;
  deployment: Record<string, unknown>;
  secrets: Record<string, unknown>;
  vector: Record<string, unknown>;
};

export type BootstrapSessionPatch = {
  status?: string;
  runtime?: Record<string, unknown>;
  database?: Record<string, unknown>;
  deployment?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  vector?: Record<string, unknown>;
};

export type BootstrapSession = {
  session_id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type TenantBootstrapStatus = {
  configured: boolean;
  tenant_id?: string;
  [key: string]: unknown;
};

export type TenantBootstrapPayload = {
  tenant_id: string;
  name: string;
};

export type TenantBootstrapResult = {
  tenant_id: string;
  name: string;
  created_at?: string;
  [key: string]: unknown;
};

export const bootstrapApi = {
  createSession: (client: CoreApiClient, payload: BootstrapSessionPayload) =>
    client.post<BootstrapSession>("/v1/bootstrap/sessions", payload),

  listSessions: (client: CoreApiClient, options?: { latest?: boolean }) =>
    client.get<BootstrapSession[] | BootstrapSession | null>("/v1/bootstrap/sessions", {
      latest: options?.latest ?? false,
    }),

  getSession: (client: CoreApiClient, sessionId: string) =>
    client.get<BootstrapSession>(`/v1/bootstrap/sessions/${sessionId}`),

  patchSession: (client: CoreApiClient, sessionId: string, payload: BootstrapSessionPatch) =>
    client.patch<BootstrapSession>(`/v1/bootstrap/sessions/${sessionId}`, payload),

  getTenantStatus: (client: CoreApiClient) =>
    client.get<TenantBootstrapStatus>("/v1/bootstrap/tenant/status"),

  bootstrapTenant: (client: CoreApiClient, payload: TenantBootstrapPayload) =>
    client.post<TenantBootstrapResult>("/v1/bootstrap/tenant", payload),
};
