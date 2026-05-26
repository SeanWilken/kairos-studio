import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@myai-tech/myui";
import { PersonaResumeBuilder } from "../../persona-builder/PersonaResumeBuilder";
import { slugify } from "../../persona-builder/prompt";
import type { PersonaBuilderValues } from "../../persona-builder/types";
import { createCoreApiClient, studioApi, systemApi } from "../../../../lib/api";
import { getAccessToken } from "../../../../lib/auth-session";
import { getRuntimeConfig } from "../../../../config/runtime";

function extractAssistantText(payload: Record<string, unknown> | null): string {
  if (!payload) return "";
  const keys = ["response", "content", "message", "text", "assistant_response"];
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object" && typeof (value as Record<string, unknown>).content === "string") {
      return ((value as Record<string, unknown>).content as string) || "";
    }
  }
  return "";
}

function pickString(source: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function pickNullableString(source: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
  }
  return "";
}

export function CreatePersonaStudioABPage() {

  const runtimeConfig = getRuntimeConfig();
  const tenantId = runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const defaultOrgId = runtimeConfig.orgId ?? "org-local";
  const [accessToken] = useState(() => getAccessToken());
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [channelId, setChannelId] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");

  const client = useMemo(
    () =>
      createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId, orgId: defaultOrgId },
      }),
    [runtimeBaseUrl, accessToken, tenantId, defaultOrgId],
  );

  const organizationsQuery = useQuery({
    queryKey: ["persona-ab", "orgs", tenantId],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await studioApi.listOrganizations(client);
      return Array.isArray((response as { items?: unknown[] }).items)
        ? ((response as { items: Array<{ id: string; name: string }> }).items ?? [])
        : [];
    },
  });

  const providersQuery = useQuery({
    queryKey: ["persona-ab", "providers"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await systemApi.listAiProviders(client);
      const items = Array.isArray((response as { items?: unknown[] }).items)
        ? ((response as { items: Array<{ provider_id: string; name?: string }> }).items ?? [])
        : Array.isArray((response as { providers?: unknown[] }).providers)
          ? ((response as { providers: Array<{ provider_id: string; name?: string }> }).providers ?? [])
          : [];
      return items.map((item) => ({ id: item.provider_id, label: item.name ?? item.provider_id }));
    },
  });

  const modelsByProviderQuery = useQuery({
    queryKey: ["persona-ab", "provider-models", providersQuery.data?.map((provider) => provider.id).join(",")],
    enabled: Boolean(accessToken && providersQuery.data && providersQuery.data.length > 0),
    queryFn: async () => {
      const entries = await Promise.all(
        (providersQuery.data ?? []).map(async (provider) => {
          const response = await systemApi.listAiProviderModels(client, provider.id);
          const items = Array.isArray((response as { items?: unknown[] }).items)
            ? ((response as { items: Array<{ model_id: string; name?: string }> }).items ?? [])
            : Array.isArray((response as { models?: unknown[] }).models)
              ? ((response as { models: Array<{ model_id: string; name?: string }> }).models ?? [])
              : [];
          return [provider.id, items.map((item) => ({ id: item.model_id, label: item.name ?? item.model_id }))] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, Array<{ id: string; label: string }>>;
    },
  });

  const versionsQuery = useQuery({
    queryKey: ["persona-ab", "versions", personaId],
    enabled: Boolean(accessToken && personaId),
    queryFn: async () => {
      const response = await studioApi.listPersonaVersions(client, personaId);
      return response.items ?? [];
    },
  });

  const selectedVersionQuery = useQuery({
    queryKey: ["persona-ab", "version", personaId, selectedVersionId],
    enabled: Boolean(accessToken && personaId && selectedVersionId),
    queryFn: async () => studioApi.getPersonaVersion(client, personaId, selectedVersionId),
  });

  const currentPersonaQuery = useQuery({
    queryKey: ["persona-ab", "persona", personaId],
    enabled: Boolean(accessToken && personaId),
    queryFn: async () => studioApi.getPersona(client, personaId),
  });

  const organizationOptions = (organizationsQuery.data ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));
  const activeOrgId = organizationsQuery.data?.[0]?.id ?? defaultOrgId;
  const builderInitialValues = useMemo(() => ({ orgId: activeOrgId }), [activeOrgId]);

  const createPersonaMutation = useMutation({
    mutationFn: async ({ values, systemPrompt }: { values: PersonaBuilderValues; systemPrompt: string }) => {
      const effectiveOrgId = values.orgId || activeOrgId;
      if (!effectiveOrgId) throw new Error("Select an organization before saving persona.");

      return studioApi.createPersona(client, {
        org_id: effectiveOrgId,
        name: values.name,
        slug: slugify(values.name),
        role: values.role,
        scope: values.scope,
        model_profile: values.modelProfile,
        runtime_provider_id: values.runtimeProviderId || undefined,
        runtime_model_id: values.runtimeModelId || undefined,
        system_prompt: values.systemPromptOverride || systemPrompt,
        data: {
          industry: values.industry,
          headline: values.headline,
          summary: values.summary,
          traits: values.traits,
          communication_style: values.communicationStyle,
          initiative_level: values.initiativeLevel,
          tone: values.tone,
          do_list: values.doList,
          dont_list: values.dontList,
          guardrails: values.guardrails,
          tools: values.tools,
        },
      });
    },
    onSuccess: (created) => {
      setSaveError("");
      setSaveSuccess(`Saved persona ${created.name}.`);
      setPersonaId(created.persona_id);
      setSelectedVersionId("");
    },
    onError: (error) => {
      setSaveSuccess("");
      setSaveError(error instanceof Error ? error.message : "Failed to save persona.");
    },
  });

  const handleChatTest = useCallback(async ({
    message,
    values,
    systemPrompt,
  }: {
    message: string;
    values: PersonaBuilderValues;
    systemPrompt: string;
  }): Promise<string> => {
    let nextChannelId = channelId.trim();
    if (!nextChannelId) {
      const channel = await studioApi.createChannel(client, {
        org_id: values.orgId || activeOrgId,
        default_persona_id: personaId.trim() || undefined,
        mode: "single_best",
      });
      nextChannelId = channel.channel_id;
      setChannelId(nextChannelId);
    }

    const basePayload = {
      content: message,
      persona_id: personaId.trim() || undefined,
      mode: "single_best",
    } as const;

    const response = await studioApi.chatInChannel(client, nextChannelId, basePayload);

    return extractAssistantText(response) || JSON.stringify(response, null, 2);
  }, [activeOrgId, channelId, client, personaId]);

  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      if (!personaId) throw new Error("Select a persona first.");
      return studioApi.rollbackPersonaVersion(client, personaId, versionId);
    },
    onSuccess: async () => {
      setSaveError("");
      setSaveSuccess("Persona rolled back successfully.");
      await versionsQuery.refetch();
      if (selectedVersionId) await selectedVersionQuery.refetch();
    },
    onError: (error) => {
      setSaveSuccess("");
      setSaveError(error instanceof Error ? error.message : "Rollback failed.");
    },
  });

  const selectedVersionRecord = (selectedVersionQuery.data ?? null) as Record<string, unknown> | null;
  const currentPersonaRecord = (currentPersonaQuery.data ?? null) as Record<string, unknown> | null;

  const selectedVersionData = selectedVersionRecord && typeof selectedVersionRecord.data === "object"
    ? (selectedVersionRecord.data as Record<string, unknown>)
    : null;
  const currentPersonaData = currentPersonaRecord && typeof currentPersonaRecord.data === "object"
    ? (currentPersonaRecord.data as Record<string, unknown>)
    : null;

  const selectedFields = {
    version: pickString(selectedVersionRecord, ["version_number", "version", "version_id"]),
    changeSummary: pickString(selectedVersionRecord, ["change_summary", "summary"]),
    createdAt: pickString(selectedVersionRecord, ["created_at", "createdAt"]),
    modelProfile: pickNullableString(selectedVersionRecord, ["model_profile"]),
    runtimeProvider: pickNullableString(selectedVersionRecord, ["runtime_provider_id"]),
    runtimeModel: pickNullableString(selectedVersionRecord, ["runtime_model_id"]),
    role: pickNullableString(selectedVersionRecord, ["role"]),
    scope: pickNullableString(selectedVersionRecord, ["scope"]),
    systemPrompt: pickNullableString(selectedVersionRecord, ["system_prompt"]),
    headline: pickNullableString(selectedVersionData, ["headline"]),
    summary: pickNullableString(selectedVersionData, ["summary"]),
  };

  const currentFields = {
    modelProfile: pickNullableString(currentPersonaRecord, ["model_profile"]),
    runtimeProvider: pickNullableString(currentPersonaRecord, ["runtime_provider_id"]),
    runtimeModel: pickNullableString(currentPersonaRecord, ["runtime_model_id"]),
    role: pickNullableString(currentPersonaRecord, ["role"]),
    scope: pickNullableString(currentPersonaRecord, ["scope"]),
    systemPrompt: pickNullableString(currentPersonaRecord, ["system_prompt"]),
    headline: pickNullableString(currentPersonaData, ["headline"]),
    summary: pickNullableString(currentPersonaData, ["summary"]),
  };

  const diffRows = [
    { key: "modelProfile", label: "Model profile", next: selectedFields.modelProfile, current: currentFields.modelProfile },
    { key: "runtimeProvider", label: "Runtime provider", next: selectedFields.runtimeProvider, current: currentFields.runtimeProvider },
    { key: "runtimeModel", label: "Runtime model", next: selectedFields.runtimeModel, current: currentFields.runtimeModel },
    { key: "role", label: "Role", next: selectedFields.role, current: currentFields.role },
    { key: "scope", label: "Scope", next: selectedFields.scope, current: currentFields.scope },
    { key: "headline", label: "Headline", next: selectedFields.headline, current: currentFields.headline },
    { key: "summary", label: "Summary", next: selectedFields.summary, current: currentFields.summary },
  ];

  return (
    <div className="h-full p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Persona Studio</h1>
        <p className="text-sm text-zinc-600">Wizard-based persona builder with resume review, chat preview, and advanced metadata.</p>
      </div>

      {saveError ? <Alert className="mb-3 border-red-200 bg-red-50"><AlertTitle>Save error</AlertTitle><AlertDescription>{saveError}</AlertDescription></Alert> : null}
      {saveSuccess ? <Alert className="mb-3 border-emerald-200 bg-emerald-50"><AlertTitle>Persona saved</AlertTitle><AlertDescription>{saveSuccess}</AlertDescription></Alert> : null}

      <PersonaResumeBuilder
        organizationOptions={organizationOptions}
        providerOptions={providersQuery.data ?? []}
        modelOptionsByProvider={modelsByProviderQuery.data ?? {}}
        initialValues={builderInitialValues}
        onChatTest={handleChatTest}
        onSave={async (values, systemPrompt) => {
          await createPersonaMutation.mutateAsync({ values, systemPrompt });
        }}
      />

      {personaId ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Version History</h2>
          <p className="mb-3 text-xs text-zinc-600">Review versions and rollback quickly if a new model/runtime degrades behavior.</p>
          <div className="grid gap-3 md:grid-cols-[320px_1fr]">
            <div className="space-y-2">
              {(versionsQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-zinc-500">No versions found yet.</p>
              ) : (
                (versionsQuery.data ?? []).map((version) => (
                  <button
                    key={version.version_id}
                    type="button"
                    onClick={() => setSelectedVersionId(version.version_id)}
                    className={`w-full rounded border px-3 py-2 text-left text-xs ${selectedVersionId === version.version_id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
                  >
                    <p className="font-medium">{version.version_number ?? version.version_id}</p>
                    <p className="opacity-80">{version.change_summary || "No summary"}</p>
                  </button>
                ))
              )}
            </div>
            <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
              {!selectedVersionId ? (
                <p className="text-xs text-zinc-500">Select a version to inspect details.</p>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-zinc-200 bg-white p-3">
                      <p className="text-xs text-zinc-500">Version</p>
                      <p className="text-sm font-medium text-zinc-900">{selectedFields.version || selectedVersionId}</p>
                    </div>
                    <div className="rounded border border-zinc-200 bg-white p-3">
                      <p className="text-xs text-zinc-500">Created</p>
                      <p className="text-sm font-medium text-zinc-900">{selectedFields.createdAt || "-"}</p>
                    </div>
                    <div className="rounded border border-zinc-200 bg-white p-3">
                      <p className="text-xs text-zinc-500">Change summary</p>
                      <p className="text-sm font-medium text-zinc-900">{selectedFields.changeSummary || "No summary"}</p>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded border border-zinc-200 bg-white">
                    <div className="grid grid-cols-[180px_1fr_1fr] border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600">
                      <p>Field</p><p>Selected version</p><p>Current persona</p>
                    </div>
                    {diffRows.map((row) => {
                      const changed = (row.next || "") !== (row.current || "");
                      return (
                        <div key={row.key} className={`grid grid-cols-[180px_1fr_1fr] gap-3 border-b border-zinc-100 px-3 py-2 text-xs ${changed ? "bg-amber-50" : "bg-white"}`}>
                          <p className="font-medium text-zinc-700">{row.label}</p>
                          <p className="text-zinc-900">{row.next || "-"}</p>
                          <p className="text-zinc-600">{row.current || "-"}</p>
                        </div>
                      );
                    })}
                  </div>

                  <details className="mt-3 rounded border border-zinc-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-medium text-zinc-700">Raw version payload</summary>
                    <pre className="mt-2 max-h-56 overflow-auto text-xs">{JSON.stringify(selectedVersionQuery.data ?? {}, null, 2)}</pre>
                  </details>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void rollbackMutation.mutate(selectedVersionId)}
                      disabled={rollbackMutation.isPending}
                      className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                    >
                      {rollbackMutation.isPending ? "Rolling back..." : "Rollback to this version"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
