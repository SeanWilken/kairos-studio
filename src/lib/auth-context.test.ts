import { describe, expect, test } from "bun:test";
import { constrainWorkspaceScope, readAuthorizedContext } from "./auth-context";

function token(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${encoded}.signature`;
}

describe("authorized context", () => {
  test("reads tenant and organization claims from the JWT", () => {
    expect(readAuthorizedContext(token({ tenant_id: "tenant-a", org_id: "org-a" }))).toEqual({
      tenantId: "tenant-a",
      orgId: "org-a",
    });
  });

  test("replaces a persisted organization that differs from the JWT", () => {
    expect(constrainWorkspaceScope(token({ tenant_id: "tenant-a", org_id: "org-a" }), "tenant-local", {
      type: "organization",
      id: "org-other",
      name: "Other org",
    })).toEqual({ type: "organization", id: "org-a", name: "org-a" });
  });

  test("retains a team only within the JWT organization", () => {
    const team = { type: "team" as const, id: "team-a", name: "Team A", orgId: "org-a" };
    expect(constrainWorkspaceScope(token({ org_id: "org-a" }), "tenant-a", team)).toEqual(team);
    expect(constrainWorkspaceScope(token({ org_id: "org-b" }), "tenant-a", team).id).toBe("org-b");
  });
});
