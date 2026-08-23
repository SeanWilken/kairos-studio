import type { WorkspaceScope } from "./workspace-scope";

export type AuthorizedContext = {
  tenantId?: string;
  orgId?: string;
};

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

export function readAuthorizedContext(accessToken: string): AuthorizedContext {
  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) return {};
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as Record<string, unknown>;
    const auth = payload.auth && typeof payload.auth === "object" ? payload.auth as Record<string, unknown> : {};
    return {
      tenantId: readString(auth, ["tenant_id", "tenantId"]) ?? readString(payload, ["tenant_id", "tenantId"]),
      orgId: readString(auth, ["org_id", "orgId"]) ?? readString(payload, ["org_id", "orgId"]),
    };
  } catch {
    return {};
  }
}

export function constrainWorkspaceScope(
  accessToken: string,
  fallbackTenantId: string,
  scope: WorkspaceScope,
): WorkspaceScope {
  const context = readAuthorizedContext(accessToken);
  const tenantId = context.tenantId ?? fallbackTenantId;
  if (!context.orgId) return { type: "tenant", id: tenantId, name: tenantId };
  if (scope.type === "team" && scope.orgId === context.orgId) return scope;
  if (scope.type === "organization" && scope.id === context.orgId) return scope;
  return { type: "organization", id: context.orgId, name: context.orgId };
}
