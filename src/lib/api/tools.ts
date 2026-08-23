import type { CoreApiClient } from "./client";

export type ToolCatalogItem = {
  tool_id: string;
  label: string;
  category: string;
  description: string;
  risk_level: string;
  approval_mode: string;
  side_effect_level: string;
  capabilities: string[];
  status: string;
  implementations?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ToolRuntimeEntry = {
  tool_id: string;
  implementation_id: string;
  installed: boolean;
  validated?: boolean;
  binary_path?: string;
  version?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ToolGeneratedContentPayload = {
  org_id: string;
  title: string;
  prompt: string;
  profile_id?: string;
  output_profile?: string;
  provider_id?: string;
  model_id?: string;
  context?: Record<string, unknown>;
};

export type ToolTaskCreatePayload = {
  org_id: string;
  prompt: string;
  title?: string;
  description?: string;
  profile_id?: string;
  visibility?: string;
  status?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  team_id?: string;
  channel_id?: string;
};

export const toolsApi = {
  getCatalog: (client: CoreApiClient) =>
    client.get<{ tools: ToolCatalogItem[] }>("/v1/tools/catalog"),

  getProviderStatus: (client: CoreApiClient) =>
    client.get<Record<string, unknown>>("/v1/tools/providers/status"),

  getRuntimeRegistry: (client: CoreApiClient) =>
    client.get<{ items: ToolRuntimeEntry[] }>("/v1/tools/runtime-registry"),

  listExecutions: (client: CoreApiClient, orgId: string, limit = 50) =>
    client.get<{ items: Array<Record<string, unknown>> }>("/v1/tools/executions", {
      org_id: orgId,
      limit,
    }),

  draftDocument: (client: CoreApiClient, payload: ToolGeneratedContentPayload) =>
    client.post<Record<string, unknown>>("/v1/tools/documents/draft", payload),

  scaffoldWorkflow: (client: CoreApiClient, payload: ToolGeneratedContentPayload) =>
    client.post<Record<string, unknown>>("/v1/tools/workflows/scaffold", payload),

  createTask: (client: CoreApiClient, payload: ToolTaskCreatePayload) =>
    client.post<Record<string, unknown>>("/v1/tools/tasks/create", payload),
};
