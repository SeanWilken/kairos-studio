import type { CoreApiClient } from "./client";
import { getAccessToken } from "../auth-session";

export type KnowledgeSourceType = "file" | "note" | "url" | "generated";
export type KnowledgeProcessingStatus = "uploaded" | "extracting" | "extracted" | "indexing" | "indexed" | "failed" | "archived";

export type KnowledgeDocument = {
  id: string;
  document_id?: string;
  entity_id?: string;
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

function normalizePath(baseUrl: string, path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

function normalizeKnowledgeDocument(value: unknown): KnowledgeDocument {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const entity = record.entity && typeof record.entity === "object" ? (record.entity as Record<string, unknown>) : record;
  const document = record.document && typeof record.document === "object" ? (record.document as Record<string, unknown>) : {};
  const kindPayload = entity.kind_payload && typeof entity.kind_payload === "object" ? (entity.kind_payload as Record<string, unknown>) : {};
  const id = [record.document_id, record.entity_id, record.id, entity.entity_id, entity.id]
    .find((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0) ?? "";

  return {
    ...record,
    ...entity,
    ...document,
    id,
    document_id: typeof record.document_id === "string" ? record.document_id : id,
    entity_id: typeof record.entity_id === "string" ? record.entity_id : id,
    title: typeof record.title === "string" ? record.title : typeof entity.title === "string" ? entity.title : undefined,
    filename: typeof record.filename === "string"
      ? record.filename
      : typeof document.filename === "string"
        ? document.filename
        : typeof kindPayload.filename === "string"
          ? kindPayload.filename
          : undefined,
  } as KnowledgeDocument;
}

export const knowledgeApi = {
  listDocuments: (
    client: CoreApiClient,
    orgId: string,
    query?: { search?: string; namespace?: string; status?: string; sourceType?: string },
  ) => client.get<ListKnowledgeDocumentsResponse>("/v1/knowledge/documents", {
      org_id: orgId,
      query: query?.search,
      namespace: query?.namespace,
      status: query?.status,
      source_type: query?.sourceType,
    }).then((response) => ({
      ...response,
      items: (response.items ?? []).map(normalizeKnowledgeDocument),
    })),

  getDocument: (client: CoreApiClient, documentId: string) =>
    client.get<KnowledgeDocument>(`/v1/knowledge/documents/${documentId}`).then(normalizeKnowledgeDocument),

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

    const accessToken = getAccessToken();
    const response = await fetch(normalizePath(client.baseUrl, "/v1/knowledge/documents/upload"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(client.scope.tenantId ? { "X-Tenant-ID": client.scope.tenantId } : {}),
        ...(client.scope.orgId ? { "X-Org-ID": client.scope.orgId } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: formData,
    });

    const payloadBody = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((payloadBody as { error?: { message?: string } })?.error?.message ?? "Document upload failed.");
    }
    if (payloadBody && typeof payloadBody === "object" && "data" in (payloadBody as Record<string, unknown>)) {
      return normalizeKnowledgeDocument((payloadBody as { data?: KnowledgeDocument }).data);
    }
    return normalizeKnowledgeDocument(payloadBody);
  },

};
