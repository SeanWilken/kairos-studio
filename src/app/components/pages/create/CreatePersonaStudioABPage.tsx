import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@kairosstack/ui";
import { PersonaResumeBuilder } from "../../persona-builder/PersonaResumeBuilder";
import { slugify } from "../../persona-builder/prompt";
import type { PersonaBuilderValues } from "../../persona-builder/types";
import { createCoreApiClient, studioApi } from "../../../../lib/api";
import { getAccessToken } from "../../../../lib/auth-session";

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

export function CreatePersonaStudioABPage() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const defaultOrgId = env.VITE_KAIROS_ORG_ID ?? "8a56c7f2-5506-46a3-ae3a-f8dfa36548e2";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
  const [accessToken] = useState(() => getAccessToken());
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [channelId, setChannelId] = useState("");
  const [personaId, setPersonaId] = useState("");

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

    let response: Record<string, unknown>;
    try {
      response = await studioApi.chatInChannel(client, nextChannelId, {
        ...basePayload,
        prompt_override: systemPrompt,
        draft_persona: {
          name: values.name,
          role: values.role,
          industry: values.industry,
          headline: values.headline,
          summary: values.summary,
          scope: values.scope,
          model_profile: values.modelProfile,
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
    } catch {
      response = await studioApi.chatInChannel(client, nextChannelId, basePayload);
    }

    return extractAssistantText(response) || JSON.stringify(response, null, 2);
  }, [activeOrgId, channelId, client, personaId]);

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
        initialValues={builderInitialValues}
        onChatTest={handleChatTest}
        onSave={async (values, systemPrompt) => {
          await createPersonaMutation.mutateAsync({ values, systemPrompt });
        }}
      />
    </div>
  );
}
