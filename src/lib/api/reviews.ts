import type { CoreApiClient } from "./client";

export const reviewsApi = {
  listPacks: (client: CoreApiClient, status?: string) =>
    client.get<{ items: Array<Record<string, unknown>> }>("/v1/reviews/packs", {
      status,
    }),

  getPack: (client: CoreApiClient, queueId: string) =>
    client.get<Record<string, unknown>>(`/v1/reviews/packs/${queueId}`),

  submitConversation: (
    client: CoreApiClient,
    queueId: string,
    payload: { test_case_key: string; prompt?: string; response?: string; passed: boolean; notes?: string },
  ) => client.post<Record<string, unknown>>(`/v1/reviews/packs/${queueId}/conversation`, payload),

  approvePack: (client: CoreApiClient, queueId: string, reviewNotes = "") =>
    client.post<Record<string, unknown>>(`/v1/reviews/packs/${queueId}/approve`, {
      review_notes: reviewNotes,
    }),

  installPack: (client: CoreApiClient, queueId: string) =>
    client.post<Record<string, unknown>>(`/v1/reviews/packs/${queueId}/install`),
};
