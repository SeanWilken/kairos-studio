import type { CoreApiClient } from "./client";

export type PersonaTemplateCategory = {
  category_name: string;
  display_name?: string;
  description?: string;
  [key: string]: unknown;
};

export type PersonaTemplateOption = {
  option_id?: string;
  option_name?: string;
  category_name?: string;
  display_name?: string;
  description?: string;
  [key: string]: unknown;
};

export type PersonaPrefab = {
  prefab_id?: string;
  name?: string;
  role?: string;
  industry?: string;
  [key: string]: unknown;
};

export const personaConfigApi = {
  listTemplateCategories: (client: CoreApiClient) =>
    client.get<{ items: PersonaTemplateCategory[] }>("/v1/persona-config/templates/categories"),

  listTemplateOptions: (client: CoreApiClient, categoryName: string) =>
    client.get<{ items: PersonaTemplateOption[] }>(`/v1/persona-config/templates/options/${encodeURIComponent(categoryName)}`),

  listPrefabs: (client: CoreApiClient, filters?: { industry?: string; role?: string }) =>
    client.get<{ items: PersonaPrefab[] }>("/v1/persona-config/prefabs", {
      industry: filters?.industry,
      role: filters?.role,
    }),

  exportCatalog: (client: CoreApiClient, orgId?: string) =>
    client.get<Record<string, unknown>>("/v1/persona-config/export", {
      org_id: orgId,
    }),

  importCatalog: (client: CoreApiClient, payload: Record<string, unknown>, options?: { dryRun?: boolean }) =>
    client.request<Record<string, unknown>>("/v1/persona-config/import", {
      method: "POST",
      query: { dry_run: options?.dryRun ?? false },
      body: payload,
    }),
};
