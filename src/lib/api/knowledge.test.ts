import { describe, expect, test } from "bun:test";
import type { CoreApiClient } from "./client";
import { knowledgeApi } from "./knowledge";

describe("knowledge organization isolation", () => {
  test("uses only the explicitly authorized organization for document listing", async () => {
    let query: Record<string, unknown> | undefined;
    const client = {
      get: async (_path: string, nextQuery?: Record<string, unknown>) => {
        query = nextQuery;
        return { items: [] };
      },
    } as unknown as CoreApiClient;

    await knowledgeApi.listDocuments(client, "org-authorized", { search: "runbook" });
    expect(query).toMatchObject({ org_id: "org-authorized", query: "runbook" });
  });
});
