import type { CoreApiClient } from "./client";

export type OrgKnowledgePolicy = {
  default_visibility_scope: "private" | "user" | "group" | "team" | "org" | "tenant" | "restricted";
  acl_policy_id: string;
  allow_private_creators: string[];
  allow_restricted_creators: string[];
  allow_uploaders: string[];
  allow_team_sharing: boolean;
  allow_group_sharing: boolean;
  require_membership_for_team_group: boolean;
  sensitivity_tags: string[];
};

export type StudioGovernanceSettings = {
  org_id: string;
  knowledge_policy: OrgKnowledgePolicy;
};

export type GovernanceBaselineRow = {
  action: string;
  owner_admin: string;
  lead: string;
  member: string;
  viewer: string;
};

export type GovernanceBaseline = {
  items: GovernanceBaselineRow[];
};

export type AppAccessGrantApps = {
  knowledger?: boolean;
  council?: boolean;
  myaide?: boolean;
};

export type AppAccessGrant = {
  id?: string;
  org_id: string;
  principal_kind: "user" | "role_template";
  principal_id: string;
  apps: AppAccessGrantApps;
  created_at?: string;
  updated_at?: string;
};

export type ListAppAccessGrantsResponse = {
  items: AppAccessGrant[];
};

export type ContextExplainRequest = {
  org_id: string;
  principal_id: string;
  principal_kind: "user" | "agent";
  lens?: string;
  include_ids?: string[];
  exclude_ids?: string[];
};

export type PolicyDecisionRequest = {
  org_id: string;
  principal_id: string;
  principal_kind: "user" | "agent";
  action: string;
  resource: Record<string, unknown>;
  context?: Record<string, unknown>;
};

export const governanceApi = {
  getBaseline: (client: CoreApiClient) =>
    client.get<GovernanceBaseline>("/v1/studio/governance/baseline"),

  getSettings: (client: CoreApiClient, orgId: string) =>
    client.get<StudioGovernanceSettings>("/v1/studio/settings", { org_id: orgId }),

  patchSettings: (client: CoreApiClient, orgId: string, knowledgePolicy: OrgKnowledgePolicy) =>
    client.patch<StudioGovernanceSettings>("/v1/studio/settings", {
      org_id: orgId,
      knowledge_policy: knowledgePolicy,
    }),

  listAppAccessGrants: (client: CoreApiClient, orgId: string) =>
    client.get<ListAppAccessGrantsResponse>("/v1/studio/app-access-grants", { org_id: orgId }),

  upsertAppAccessGrant: (client: CoreApiClient, payload: AppAccessGrant) =>
    client.post<AppAccessGrant>("/v1/studio/app-access-grants", payload),

  explainContextAccess: (client: CoreApiClient, payload: ContextExplainRequest) =>
    client.post<Record<string, unknown>>("/v1/context/explain", payload),

  evaluatePolicyDecision: (client: CoreApiClient, payload: PolicyDecisionRequest) =>
    client.post<Record<string, unknown>>("/v1/policy/decision", payload),
};
