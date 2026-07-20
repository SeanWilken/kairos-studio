import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from "@myai-tech/myui";
import { PackImportWorkflow } from "../../persona-builder/PackImportWorkflow";
import { PersonaResumeBuilder_OLD } from "../../persona-builder/PersonaResumeBuilder_OLD";
import { slugify } from "../../persona-builder/prompt";
import type { PersonaBuilderValues } from "../../persona-builder/types";
import { createCoreApiClient, studioApi } from "../../../../lib/api";
import { getAccessToken } from "../../../../lib/auth-session";
import { getRuntimeConfig } from "@/config/runtime";

function maybeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function maybeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function maybeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function joinLines(input: unknown): string {
  if (Array.isArray(input)) return maybeStringArray(input).join("\n");
  return maybeString(input);
}

function mapExportToBuilderValues(
  exportResume: Record<string, unknown> | undefined,
  personaDetail: Record<string, unknown> | undefined,
  activeOrgId: string,
): Partial<PersonaBuilderValues> {
  const resume = maybeRecord(exportResume);
  const detail = maybeRecord(personaDetail);
  const detailData = maybeRecord(detail.data);

  return {
    orgId: maybeString(resume.org_id) || maybeString(detail.org_id) || activeOrgId,
    name: maybeString(resume.name) || maybeString(detail.name),
    role: maybeString(resume.role) || maybeString(detail.role),
    industry: maybeString(resume.industry) || maybeString(detailData.industry),
    headline: maybeString(resume.headline) || maybeString(detailData.headline),
    summary: maybeString(resume.summary) || maybeString(detailData.summary),
    scope: maybeString(resume.scope) || maybeString(detail.scope) || "organization",
    modelProfile: maybeString(resume.model_profile) || maybeString(detail.model_profile) || "reasoning-optimized",
    runtimeProviderId: maybeString(resume.runtime_provider_id) || maybeString(detail.runtime_provider_id),
    runtimeModelId: maybeString(resume.runtime_model_id) || maybeString(detail.runtime_model_id),
    traits: maybeStringArray(resume.traits).length > 0 ? maybeStringArray(resume.traits) : maybeStringArray(detailData.traits),
    communicationStyle: maybeString(resume.communication_style) || maybeString(detailData.communication_style) || "balanced",
    initiativeLevel: maybeString(resume.initiative_level) || maybeString(detailData.initiative_level) || "medium",
    tone: maybeString(resume.tone) || maybeString(detailData.tone) || "professional",
    doList: joinLines(resume.do_list || detailData.do_list),
    dontList: joinLines(resume.dont_list || detailData.dont_list),
    guardrails: joinLines(resume.guardrails || detailData.guardrails),
    tools: maybeStringArray(resume.tools).length > 0 ? maybeStringArray(resume.tools) : maybeStringArray(detailData.tools),
    systemPromptOverride: maybeString(resume.system_prompt) || maybeString(detail.system_prompt),
  };
}

export function CreatePersonaStudioPage() {
  const runtimeConfig = getRuntimeConfig();
  const tenantId = runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const defaultOrgId = runtimeConfig.orgId ?? "org-local";
  const [accessToken] = useState(() => getAccessToken());
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("resume");
  const [builderSeed, setBuilderSeed] = useState<Partial<PersonaBuilderValues>>({});
  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderStep, setBuilderStep] = useState(0);
  const [testChannelId, setTestChannelId] = useState("");
  const [testPersonaId, setTestPersonaId] = useState("");
  const [testMode, setTestMode] = useState("single_best");
  const [testMessage, setTestMessage] = useState("Can you introduce yourself and explain how you would help with a feature rollout?");
  const [testResponse, setTestResponse] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError] = useState("");

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
    queryKey: ["persona-studio", "orgs", tenantId],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await studioApi.listOrganizations(client);
      const items = Array.isArray((response as { items?: unknown[] }).items)
        ? ((response as { items: Array<{ id: string; name: string }> }).items ?? [])
        : [];
      return items;
    },
  });

  const activeOrgId = organizationsQuery.data?.[0]?.id ?? defaultOrgId;

  const personasQuery = useQuery({
    queryKey: ["persona-studio", "personas", activeOrgId],
    enabled: Boolean(accessToken && activeOrgId),
    queryFn: async () => studioApi.listPersonas(client, { orgId: activeOrgId }),
  });

  const personaDetailQuery = useQuery({
    queryKey: ["persona-studio", "persona", selectedPersonaId],
    enabled: Boolean(accessToken && selectedPersonaId),
    queryFn: async () => studioApi.getPersona(client, selectedPersonaId),
  });

  const personaResumeQuery = useQuery({
    queryKey: ["persona-studio", "persona-resume", selectedPersonaId],
    enabled: Boolean(accessToken && selectedPersonaId),
    queryFn: async () => studioApi.exportPersonaResume(client, selectedPersonaId),
  });

  const createPersonaMutation = useMutation({
    mutationFn: async ({ values, systemPrompt }: { values: PersonaBuilderValues; systemPrompt: string }) => {
      const effectiveOrgId = values.orgId || activeOrgId;
      if (!effectiveOrgId) {
        throw new Error("Select an organization before saving persona.");
      }
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
    onSuccess: async (created, variables) => {
      setSaveError("");
      const personaLabel = variables.values.name.trim() || created.name || created.persona_id || "persona";
      setSaveSuccess(`Saved persona ${personaLabel}.`);
      setSelectedPersonaId(created.persona_id);
      await personasQuery.refetch();
    },
    onError: (error) => {
      setSaveSuccess("");
      setSaveError(error instanceof Error ? error.message : "Failed to save persona.");
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async () =>
      studioApi.createChannel(client, {
        org_id: activeOrgId,
        default_persona_id: testPersonaId.trim() || undefined,
        mode: testMode,
        title: `Prompt test ${new Date().toISOString()}`,
      }),
    onSuccess: (channel) => {
      setTestError("");
      setTestChannelId(channel.channel_id);
    },
    onError: (error) => {
      setTestError(error instanceof Error ? error.message : "Failed to create test channel.");
    },
  });

  const sendTestChatMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const basePayload = {
        content: testMessage,
        persona_id: testPersonaId.trim() || undefined,
        mode: testMode,
      };

      return studioApi.chatInChannel(client, channelId, basePayload);
    },
    onSuccess: (response) => {
      setTestError("");
      setTestResponse(response);
    },
    onError: (error) => {
      setTestError(error instanceof Error ? error.message : "Test chat failed.");
    },
  });

  const organizationOptions = (organizationsQuery.data ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));

  const resumeInitialValues = useMemo(
    () => ({
      orgId: activeOrgId,
      ...builderSeed,
    }),
    [activeOrgId, builderSeed],
  );

  const handleBuilderChange = useCallback((_values: PersonaBuilderValues, systemPrompt: string) => {
    setBuilderPrompt(systemPrompt);
  }, []);

  const handleBuilderStepChange = useCallback((stepIndex: number) => {
    setBuilderStep(stepIndex);
  }, []);

  const personaItems = (personasQuery.data?.items ?? []).filter((item) => typeof item.persona_id === "string");

  const prefillFromSelectedPersona = () => {
    if (!selectedPersonaId) return;
    const seed = mapExportToBuilderValues(
      maybeRecord(personaResumeQuery.data),
      maybeRecord(personaDetailQuery.data),
      activeOrgId,
    );
    setBuilderSeed(seed);
    setActiveTab("resume");
    setSaveError("");
    setSaveSuccess(`Loaded persona ${selectedPersonaId} into builder draft.`);
  };

  const runPromptTest = async () => {
    if (!testMessage.trim()) {
      setTestError("Enter a test message first.");
      return;
    }
    setTestError("");
    let channelId = testChannelId.trim();
    if (!channelId) {
      const channel = await createChannelMutation.mutateAsync();
      channelId = channel.channel_id;
      setTestChannelId(channelId);
    }
    await sendTestChatMutation.mutateAsync(channelId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Persona Studio</h1>
        <p className="text-sm text-zinc-600">Import, review, install, and retrieve persona configurations.</p>
      </div>

      {!accessToken ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>Sign in before using Persona Studio workflows.</AlertDescription>
        </Alert>
      ) : null}

      {saveError ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle>Save error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}

      {saveSuccess ? (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle>Persona saved</AlertTitle>
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList>
          <TabsTrigger value="resume">Resume Builder</TabsTrigger>
          <TabsTrigger value="import">Import and Review</TabsTrigger>
          <TabsTrigger value="installed">Installed Personas</TabsTrigger>
        </TabsList>

        <TabsContent value="resume">
          <PersonaResumeBuilder_OLD
            organizationOptions={organizationOptions}
            initialValues={resumeInitialValues}
            onChange={handleBuilderChange}
            onStepChange={handleBuilderStepChange}
            onSave={async (values, systemPrompt) => {
              await createPersonaMutation.mutateAsync({ values, systemPrompt });
            }}
          />

          {builderStep === 5 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Draft Prompt Chat Test (Pre-save)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-600">
                Uses `/v1/studio/channels` + `/v1/studio/channels/{"{channel_id}"}/chat` with the current generated prompt and draft persona payload.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Channel id</Label>
                  <Input
                    value={testChannelId}
                    onChange={(event) => setTestChannelId(event.target.value)}
                    placeholder="Leave empty to auto-create"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mode</Label>
                  <Select value={testMode} onValueChange={setTestMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_best">single_best</SelectItem>
                      <SelectItem value="council">council</SelectItem>
                      <SelectItem value="summarized">summarized</SelectItem>
                      <SelectItem value="threaded">threaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label>Persona id (optional)</Label>
                  <Input value={testPersonaId} onChange={(event) => setTestPersonaId(event.target.value)} placeholder="installed_persona_id for side-by-side comparison" />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label>Test message</Label>
                  <Textarea value={testMessage} onChange={(event) => setTestMessage(event.target.value)} className="min-h-[90px]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void createChannelMutation.mutate()}>
                  Create test channel
                </Button>
                <Button type="button" onClick={() => void runPromptTest()} disabled={!builderPrompt.trim()}>
                  Run prompt test chat
                </Button>
              </div>
              {!builderPrompt.trim() ? (
                <p className="text-xs text-amber-700">Complete at least required identity fields to generate prompt before testing.</p>
              ) : null}
              {testError ? (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTitle>Prompt test error</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              ) : null}
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-600">Generated prompt sent as `prompt_override`</p>
                <pre className="max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">{builderPrompt || "No prompt generated yet."}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-600">Chat response payload</p>
                <pre className="max-h-64 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">{JSON.stringify(testResponse ?? {}, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="import">
          <PackImportWorkflow client={client} />
        </TabsContent>

        <TabsContent value="installed">
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Installed persona list</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {personaItems.length === 0 ? (
                  <p className="text-sm text-zinc-500">No personas found for selected org.</p>
                ) : (
                  personaItems.map((persona) => (
                    <button
                      key={persona.persona_id}
                      type="button"
                      onClick={() => setSelectedPersonaId(persona.persona_id)}
                      className={`w-full rounded border px-3 py-2 text-left text-xs ${selectedPersonaId === persona.persona_id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
                    >
                      <p className="font-medium">{persona.name}</p>
                      <p className="opacity-75">{persona.persona_id}</p>
                      <div className="mt-1 flex gap-1">
                        <Badge variant="outline" className="text-[10px]">{persona.approval_status ?? "unknown"}</Badge>
                        <Badge variant="outline" className="text-[10px]">{persona.model_profile ?? "default"}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Persona detail + export resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedPersonaId ? (
                  <p className="text-sm text-zinc-500">Select a persona to load /v1/studio/personas and export-resume.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{selectedPersonaId}</Badge>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void Promise.all([personaDetailQuery.refetch(), personaResumeQuery.refetch()])}>
                          Refresh
                        </Button>
                        <Button type="button" size="sm" onClick={prefillFromSelectedPersona}>
                          Prefill Builder
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-zinc-600">GET /v1/studio/personas/{"{persona_id}"}</p>
                      <pre className="max-h-52 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">
                        {JSON.stringify(personaDetailQuery.data ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-zinc-600">GET /v1/studio/personas/{"{persona_id}"}/export-resume</p>
                      <pre className="max-h-52 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">
                        {JSON.stringify(personaResumeQuery.data ?? {}, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
