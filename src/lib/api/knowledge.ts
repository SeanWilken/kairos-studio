import type { CoreApiClient } from "./client";

export type KnowledgeSourceType = "file" | "note" | "url" | "generated";
export type KnowledgeProcessingStatus = "uploaded" | "extracting" | "extracted" | "indexing" | "indexed" | "failed" | "archived";

export type KnowledgeDocument = {
  id: string;
  org_id?: string;
  title?: string;
  filename?: string;
  source_type?: KnowledgeSourceType;
  content_type?: string;
  size_bytes?: number;
  namespace?: string;
  visibility_scope?: "private" | "user" | "group" | "team" | "org" | "tenant" | "restricted";
  processing_status?: KnowledgeProcessingStatus;
  status?: string;
  storage_backend?: string;
  storage_uri?: string;
  extracted_text_length?: number;
  warnings?: string[];
  errors?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  ingest_job_id?: string;
  [key: string]: unknown;
};

export type ListKnowledgeDocumentsResponse = {
  items: KnowledgeDocument[];
};

export type UploadKnowledgeFilePayload = {
  org_id: string;
  file: File;
  title?: string;
  summary?: string;
  tags_json?: string;
  contexts_json?: string;
  facets_json?: string;
  visibility_json?: string;
  owners_json?: string;
  metadata_json?: string;
};

export type CreateKnowledgeNotePayload = {
  org_id: string;
  title: string;
  content: string;
  summary?: string;
  tags_json?: string;
  contexts_json?: string;
  facets_json?: string;
  visibility_json?: string;
  owners_json?: string;
  metadata_json?: string;
};

function normalizePath(baseUrl: string, path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

export const knowledgeApi = {
  listDocuments: (
    client: CoreApiClient,
    orgId: string,
    query?: { search?: string; namespace?: string; status?: string; sourceType?: string },
  ) =>
    client.get<ListKnowledgeDocumentsResponse>("/v1/knowledge/documents", {
      org_id: orgId,
      q: query?.search,
      namespace: query?.namespace,
      status: query?.status,
      source_type: query?.sourceType,
    }),

  getDocument: (client: CoreApiClient, documentId: string) =>
    client.get<KnowledgeDocument>(`/v1/knowledge/documents/${documentId}`),

  uploadFile: async (client: CoreApiClient, payload: UploadKnowledgeFilePayload): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append("org_id", payload.org_id);
    formData.append("file", payload.file);
    if (payload.title) formData.append("title", payload.title);
    if (payload.summary) formData.append("summary", payload.summary);
    if (payload.tags_json) formData.append("tags_json", payload.tags_json);
    if (payload.contexts_json) formData.append("contexts_json", payload.contexts_json);
    if (payload.facets_json) formData.append("facets_json", payload.facets_json);
    if (payload.visibility_json) formData.append("visibility_json", payload.visibility_json);
    if (payload.owners_json) formData.append("owners_json", payload.owners_json);
    if (payload.metadata_json) formData.append("metadata_json", payload.metadata_json);

    const response = await fetch(normalizePath(client.baseUrl, "/v1/knowledge/documents/upload"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(client.scope.tenantId ? { "X-Tenant-ID": client.scope.tenantId } : {}),
        ...(client.scope.orgId ? { "X-Org-ID": client.scope.orgId } : {}),
        ...((client as { accessToken?: string }).accessToken ? { Authorization: `Bearer ${(client as { accessToken?: string }).accessToken}` } : {}),
      },
      body: formData,
    });

    const payloadBody = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((payloadBody as { error?: { message?: string } })?.error?.message ?? "Document upload failed.");
    }
    if (payloadBody && typeof payloadBody === "object" && "data" in (payloadBody as Record<string, unknown>)) {
      return ((payloadBody as { data?: KnowledgeDocument }).data ?? {}) as KnowledgeDocument;
    }
    return payloadBody as KnowledgeDocument;
  },

  createNote: (client: CoreApiClient, payload: CreateKnowledgeNotePayload) =>
    client.post<KnowledgeDocument>("/v1/knowledge/documents/note", payload),

  reprocessDocument: (client: CoreApiClient, documentId: string) =>
    client.post<Record<string, unknown>>(`/v1/knowledge/documents/${documentId}/reprocess`),
};
