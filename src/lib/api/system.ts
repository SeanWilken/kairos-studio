import type { CoreApiClient } from "./client";

export type RuntimeCheckStatus = "pass" | "warn" | "fail" | "pending";

export type RuntimeCheck = {
  check_id?: string;
  label?: string;
  required?: boolean;
  status?: RuntimeCheckStatus;
  message?: string;
};

export type RuntimeStatus = {
  checks?: RuntimeCheck[];
  summary?: {
    required_passed?: number;
    required_failed?: number;
    required_pending?: number;
  };
  [key: string]: unknown;
};

export type RuntimeChecksRunPayload = {
  session_id: string;
  check_ids?: string[];
};

export type AiProvider = {
  provider_id: string;
  name?: string;
  status?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

export type AiProviderModel = {
  model_id: string;
  name?: string;
  capability?: string;
  [key: string]: unknown;
};

export const systemApi = {
  getStatus: (client: CoreApiClient, sessionId: string) =>
    client.get<RuntimeStatus>("/v1/system/status", { session_id: sessionId }),

  runChecks: (client: CoreApiClient, payload: RuntimeChecksRunPayload) =>
    client.post<RuntimeStatus>("/v1/system/checks/run", payload),

  listAiProviders: (client: CoreApiClient) =>
    client.get<{ items?: AiProvider[] } | { providers?: AiProvider[] }>("/v1/system/ai/providers"),

  listAiProviderModels: (client: CoreApiClient, providerId: string, options?: { capability?: string }) =>
    client.get<{ items?: AiProviderModel[] } | { models?: AiProviderModel[] }>(`/v1/system/ai/providers/${providerId}/models`, {
      capability: options?.capability,
    }),
};
