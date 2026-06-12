import { useEffect, useMemo, useState } from "react";
import { HammerIcon, PencilRulerIcon, Save, Sparkles, Speech, Upload, UserCircle2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  WizardTemplate,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@myai-tech/myui";
import { PersonaTraitCard } from "./PersonaTraitCard";
import { PersonaResumePreview } from "./PersonaResumePreview";
import { buildPersonaSystemPrompt } from "./prompt";
import type { PersonaBuilderValues, PersonaTraitOption } from "./types";

const traitOptions: PersonaTraitOption[] = [
  { id: "direct", label: "Direct", description: "Straightforward, clear, and honest." },
  { id: "patient", label: "Patient", description: "Explains with care and does not rush users." },
  { id: "playful", label: "Playful", description: "Adds warmth and light personality where appropriate." },
  { id: "methodical", label: "Methodical", description: "Organized and step-by-step in execution." },
  { id: "analytical", label: "Analytical", description: "Breaks complex problems into logical parts." },
  { id: "empathetic", label: "Empathetic", description: "Acknowledges user emotions and context." },
  { id: "relaxed", label: "Relaxed", description: "Calm and approachable tone." },
  { id: "hand_hold", label: "Hand-hold", description: "Gives guided support and confidence cues." },
  { id: "out_of_sight", label: "Out-of-sight", description: "Stays unobtrusive until needed." },
];

const createSteps = [
  { id: "basics", label: "Basics", description: "Identity, scope, organization", icon: UserCircle2 },
  { id: "personality", label: "Personality", description: "Trait selection", icon: Sparkles },
  { id: "communication", label: "Communication", description: "Tone and initiative", icon: Speech },
  { id: "guidelines", label: "Guidelines", description: "Do, don't, and guardrails", icon: PencilRulerIcon },
  { id: "tools", label: "Tools", description: "Capabilities and integrations", icon: HammerIcon },
  { id: "review", label: "Review", description: "Preview and save", icon: Save },
];

const importSteps = [
  { id: "import", label: "Import", description: "Paste payload", icon: Upload },
  { id: "tune", label: "Tune", description: "Quick adjustments", icon: Sparkles },
  { id: "review", label: "Review", description: "Preview and create", icon: Save },
];

function asObj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asMultilineString(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join("\n");
  }
  return asString(value);
}

export function PersonaResumeBuilder(props: {
  organizationOptions: Array<{ id: string; name: string }>;
  providerOptions?: Array<{ id: string; label: string }>;
  modelOptionsByProvider?: Record<string, Array<{ id: string; label: string }>>;
  initialValues?: Partial<PersonaBuilderValues>;
  onChange?: (values: PersonaBuilderValues, systemPrompt: string) => void;
  onStepChange?: (stepIndex: number) => void;
  onChatTest?: (input: { message: string; values: PersonaBuilderValues; systemPrompt: string }) => Promise<string>;
  onSave: (values: PersonaBuilderValues, systemPrompt: string) => Promise<void> | void;
}) {
  const [mode, setMode] = useState<"create" | "import">("create");
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewTab, setReviewTab] = useState("resume");
  const [chatInput, setChatInput] = useState("Introduce yourself and explain how you can help with a feature rollout.");
  const [chatIsSending, setChatIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([]);
  const [importPayloadText, setImportPayloadText] = useState("{}");
  const [importError, setImportError] = useState("");

  const [values, setValues] = useState<PersonaBuilderValues>({
    name: "",
    role: "",
    industry: "software_development",
    headline: "",
    summary: "",
    orgId: "",
    scope: "organization",
    modelProfile: "reasoning-optimized",
    runtimeProviderId: "",
    runtimeModelId: "",
    traits: ["relaxed", "hand_hold"],
    communicationStyle: "balanced",
    initiativeLevel: "medium",
    tone: "professional",
    doList: "Break down complex tasks into steps\nAsk clarifying questions when scope is ambiguous",
    dontList: "Run destructive commands without explicit approval\nInvent facts about code or systems",
    guardrails: "Decline harmful requests politely\nEscalate compliance-sensitive actions",
    tools: ["knowledge_base_query", "task_management", "documentation"],
    systemPromptOverride: "",
    ...props.initialValues,
  });

  const steps = mode === "create" ? createSteps : importSteps;
  const currentStep = steps[step] ?? steps[0];
  const providerOptions = props.providerOptions ?? [];
  const modelOptionsByProvider = props.modelOptionsByProvider ?? {};
  const selectedProviderModels = values.runtimeProviderId ? (modelOptionsByProvider[values.runtimeProviderId] ?? []) : [];

  useEffect(() => {
    if (!props.initialValues) return;
    setValues((previous) => ({ ...previous, ...props.initialValues }));
  }, [props.initialValues]);

  useEffect(() => {
    if (props.organizationOptions.length === 0) return;
    setValues((previous) => {
      const hasCurrent = props.organizationOptions.some((option) => option.id === previous.orgId);
      if (hasCurrent) return previous;
      const fallbackOrgId = props.organizationOptions[0]?.id ?? "";
      if (!fallbackOrgId || previous.orgId === fallbackOrgId) return previous;
      return { ...previous, orgId: fallbackOrgId };
    });
  }, [props.organizationOptions]);

  useEffect(() => {
    if (!values.runtimeProviderId || !values.runtimeModelId) return;
    if (selectedProviderModels.some((option) => option.id === values.runtimeModelId)) return;
    setValues((previous) => ({ ...previous, runtimeModelId: "" }));
  }, [values.runtimeProviderId, values.runtimeModelId, selectedProviderModels]);

  useEffect(() => {
    setStep(0);
  }, [mode]);

  const organizationOptions = useMemo(() => {
    if (!values.orgId || props.organizationOptions.some((option) => option.id === values.orgId)) return props.organizationOptions;
    return [{ id: values.orgId, name: `Current org (${values.orgId})` }, ...props.organizationOptions];
  }, [props.organizationOptions, values.orgId]);

  const selectedOrganizationLabel = useMemo(() => {
    if (!values.orgId) return "";
    return organizationOptions.find((option) => option.id === values.orgId)?.name ?? values.orgId;
  }, [organizationOptions, values.orgId]);

  const systemPrompt = useMemo(() => buildPersonaSystemPrompt(values), [values]);

  useEffect(() => {
    props.onChange?.(values, systemPrompt);
  }, [props.onChange, systemPrompt, values]);

  useEffect(() => {
    props.onStepChange?.(step);
  }, [props.onStepChange, step]);

  const setValue = <K extends keyof PersonaBuilderValues>(key: K, value: PersonaBuilderValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const toggleTrait = (traitId: string) => {
    setValues((previous) => {
      const selected = previous.traits;
      if (selected.includes(traitId)) return { ...previous, traits: selected.filter((item) => item !== traitId) };
      if (selected.length >= 4) return previous;
      return { ...previous, traits: [...selected, traitId] };
    });
  };

  const toggleTool = (toolId: string) => {
    setValues((previous) => {
      const selected = previous.tools;
      return selected.includes(toolId)
        ? { ...previous, tools: selected.filter((item) => item !== toolId) }
        : { ...previous, tools: [...selected, toolId] };
    });
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await props.onSave(values, systemPrompt);
    } finally {
      setIsSaving(false);
    }
  };

  const loadImportPayload = () => {
    setImportError("");
    try {
      const parsed = asObj(JSON.parse(importPayloadText));
      const data = asObj(parsed.data);
      const personality = asObj(parsed.personality);
      const operationalPolicies = asObj(parsed.operational_policies);
      const promptBlocks = asObj(parsed.prompt_blocks);
      const personaName = asString(parsed.persona_name);
      const personaRole = asString(parsed.persona_role);
      const personaScope = asString(parsed.persona_scope);
      const personaModelProfile = asString(parsed.persona_model_profile);
      const personaOrgId = asString(parsed.persona_org_id) || asString(parsed.org_id);
      const nextValues: Partial<PersonaBuilderValues> = {
        name: personaName || asString(parsed.name) || asString(data.name),
        role: personaRole || asString(parsed.role) || asString(data.role),
        orgId: personaOrgId || values.orgId,
        scope: personaScope || asString(parsed.scope) || asString(data.scope) || values.scope,
        modelProfile: personaModelProfile || asString(parsed.model_profile) || asString(data.model_profile) || values.modelProfile,
        runtimeProviderId: asString(parsed.runtime_provider_id) || asString(data.runtime_provider_id),
        runtimeModelId: asString(parsed.runtime_model_id) || asString(data.runtime_model_id),
        headline: asString(data.headline),
        summary: asString(data.summary),
        industry: asString(data.industry) || values.industry,
        tone: asString(parsed.persona_tone) || asString(data.tone) || values.tone,
        communicationStyle:
          asString(parsed.persona_communication_style) ||
          asString(personality.communication_style) ||
          asString(data.communication_style) ||
          values.communicationStyle,
        initiativeLevel:
          asString(parsed.persona_initiative_level) ||
          asString(personality.initiative_level) ||
          asString(data.initiative_level) ||
          values.initiativeLevel,
        traits:
          asStringArray(parsed.persona_traits).length > 0
            ? asStringArray(parsed.persona_traits)
            : asStringArray(personality.traits).length > 0
              ? asStringArray(personality.traits)
              : values.traits,
        doList:
          asMultilineString(parsed.persona_do_list) ||
          asMultilineString(personality.do_list) ||
          values.doList,
        dontList:
          asMultilineString(parsed.persona_dont_list) ||
          asMultilineString(personality.dont_list) ||
          values.dontList,
        guardrails:
          asMultilineString(parsed.persona_guardrails) ||
          asMultilineString(promptBlocks.guardrails) ||
          values.guardrails,
        tools:
          asStringArray(parsed.persona_tools).length > 0
            ? asStringArray(parsed.persona_tools)
            : asStringArray(data.tools).length > 0
              ? asStringArray(data.tools)
              : values.tools,
        systemPromptOverride:
          asString(parsed.system_prompt) ||
          asString(parsed.persona_system_prompt) ||
          asString(parsed.instructions) ||
          asString(promptBlocks.instructions),
      };
      setValues((previous) => ({ ...previous, ...nextValues }));
      setStep(1);
    } catch {
      setImportError("Import payload is not valid JSON.");
    }
  };

  const sendReviewMessage = async () => {
    const message = chatInput.trim();
    if (!message) return;
    setChatError("");
    setChatMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: "user", text: message }]);
    setChatInput("");
    setChatIsSending(true);
    try {
      const assistantText = props.onChatTest
        ? await props.onChatTest({ message, values, systemPrompt })
        : `${values.name || "Assistant"}: I can help.`;
      setChatMessages((previous) => [...previous, { id: `assistant-${Date.now()}`, role: "assistant", text: assistantText }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Failed to run chat preview.");
    } finally {
      setChatIsSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-3">
      <Tabs value={mode} onValueChange={(value) => setMode(value as "create" | "import")}> 
        <TabsList>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          {/* <TabsTrigger value="installed">Installed</TabsTrigger> */}
        </TabsList>
        {/* <TabsContent value="installed">
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Installed persona list</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2"> */}
                {/* {personaItems.length === 0 ? (
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
                )} */}
              {/* </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Persona detail + export resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3"> */}
                {/* {!selectedPersonaId ? (
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
                )} */}
              {/* </CardContent>
            </Card>
          </div>
        </TabsContent> */}
      </Tabs>

      <WizardTemplate
        title={mode === "create" ? "Persona Resume Builder" : "Persona Import Builder"}
        description={mode === "create" ? "Design and review a persona before saving" : "Import an existing persona payload and tune before creating"}
        contextText={`Step ${step + 1} of ${steps.length}: ${currentStep.label}`}
        steps={steps}
        currentStepId={currentStep.id}
        completedStepIds={steps.slice(0, step).map((s) => s.id)}
        canGoBack={step > 0}
        canGoNext={true}
        backLabel="Back"
        nextLabel={step < steps.length - 1 ? "Next" : isSaving ? "Saving..." : mode === "import" ? "Create From Import" : "Save Persona"}
        onBack={() => setStep((current) => Math.max(0, current - 1))}
        onNext={() => {
          if (step < steps.length - 1) {
            setStep((current) => Math.min(steps.length - 1, current + 1));
            return;
          }
          void save();
        }}
        className="flex-1 min-h-0 [&>div]:h-full [&>div]:min-h-0 md:[&>div]:grid-cols-[248px_1fr]"
        classNames={{ root: "h-full min-h-0 border-zinc-200 bg-white", rail: "h-full min-h-0 bg-zinc-50", panel: "min-h-0", railHeader: "px-5 py-5", railNav: "px-3 py-3", panelHeader: "bg-zinc-50/50", panelBody: "min-h-0 py-4", panelFooter: "shrink-0" }}
        contextValues={{ Traits: String(values.traits.length), Tools: String(values.tools.length) }}
      >
        
        {mode === "create" && step === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={values.name} onChange={(event) => setValue("name", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Role</Label><Input value={values.role} onChange={(event) => setValue("role", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Organization</Label><Select value={values.orgId || undefined} onValueChange={(value) => setValue("orgId", value)}><SelectTrigger><span className={selectedOrganizationLabel ? "" : "text-zinc-500"}>{selectedOrganizationLabel || "Select organization"}</span></SelectTrigger><SelectContent>{organizationOptions.map((org) => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Industry</Label><Input value={values.industry} onChange={(event) => setValue("industry", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Model profile</Label><Select value={values.modelProfile} onValueChange={(value) => setValue("modelProfile", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reasoning-optimized">reasoning-optimized</SelectItem><SelectItem value="balanced">balanced</SelectItem><SelectItem value="fast">fast</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Runtime provider</Label><Select value={values.runtimeProviderId || "__none_provider"} onValueChange={(value) => setValue("runtimeProviderId", value === "__none_provider" ? "" : value)}><SelectTrigger><SelectValue placeholder="Use gateway default" /></SelectTrigger><SelectContent><SelectItem value="__none_provider">Use gateway default</SelectItem>{providerOptions.map((provider) => (<SelectItem key={provider.id} value={provider.id}>{provider.label}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Runtime model</Label><Select value={values.runtimeModelId || "__none_model"} onValueChange={(value) => setValue("runtimeModelId", value === "__none_model" ? "" : value)}><SelectTrigger><SelectValue placeholder="Use provider default" /></SelectTrigger><SelectContent><SelectItem value="__none_model">Use provider default</SelectItem>{selectedProviderModels.map((model) => (<SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Headline</Label><Input value={values.headline} onChange={(event) => setValue("headline", event.target.value)} /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Summary</Label><Textarea value={values.summary} onChange={(event) => setValue("summary", event.target.value)} className="min-h-[110px]" /></div>
          </div>
        ) : null}

        {mode === "create" && step === 1 ? <div><p className="mb-2 text-sm text-zinc-600">Select 2-4 traits.</p><div className="grid gap-2 md:grid-cols-3">{traitOptions.map((option) => (<PersonaTraitCard key={option.id} option={option} selected={values.traits.includes(option.id)} onToggle={toggleTrait} />))}</div></div> : null}
        {mode === "create" && step === 2 ? <div className="grid gap-3 md:grid-cols-3"><div className="space-y-1.5"><Label>Communication</Label><Select value={values.communicationStyle} onValueChange={(value) => setValue("communicationStyle", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="concise">concise</SelectItem><SelectItem value="balanced">balanced</SelectItem><SelectItem value="detailed">detailed</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Tone</Label><Select value={values.tone} onValueChange={(value) => setValue("tone", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">professional</SelectItem><SelectItem value="professional_warm">professional_warm</SelectItem><SelectItem value="conversational">conversational</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Initiative</Label><Select value={values.initiativeLevel} onValueChange={(value) => setValue("initiativeLevel", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">low</SelectItem><SelectItem value="medium">medium</SelectItem><SelectItem value="high">high</SelectItem></SelectContent></Select></div></div> : null}
        {mode === "create" && step === 3 ? <div className="grid gap-3 md:grid-cols-3"><div className="space-y-1.5"><Label>Do</Label><Textarea value={values.doList} onChange={(event) => setValue("doList", event.target.value)} className="min-h-[220px]" /></div><div className="space-y-1.5"><Label>Don't</Label><Textarea value={values.dontList} onChange={(event) => setValue("dontList", event.target.value)} className="min-h-[220px]" /></div><div className="space-y-1.5"><Label>Guardrails</Label><Textarea value={values.guardrails} onChange={(event) => setValue("guardrails", event.target.value)} className="min-h-[220px]" /></div></div> : null}
        {mode === "create" && step === 4 ? <div className="space-y-2"><Label>Tools & Capabilities</Label><div className="grid gap-2 md:grid-cols-3">{["knowledge_base_query", "web_search", "task_management", "documentation", "email_compose", "calendar"].map((tool) => (<button key={tool} type="button" onClick={() => toggleTool(tool)} className={`rounded border px-3 py-2 text-left text-sm ${values.tools.includes(tool) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}>{tool}</button>))}</div></div> : null}

        {mode === "import" && step === 0 ? (
          <div className="space-y-3">
            <Label>Import payload (JSON)</Label>
            <Textarea value={importPayloadText} onChange={(event) => setImportPayloadText(event.target.value)} className="min-h-[240px] font-mono text-xs" />
            {importError ? <p className="text-xs text-red-600">{importError}</p> : null}
            <div className="flex justify-end"><Button type="button" variant="outline" onClick={loadImportPayload}>Load imported values</Button></div>
          </div>
        ) : null}

        {mode === "import" && step === 1 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={values.name} onChange={(event) => setValue("name", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Role</Label><Input value={values.role} onChange={(event) => setValue("role", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Organization</Label><Select value={values.orgId || undefined} onValueChange={(value) => setValue("orgId", value)}><SelectTrigger><span className={selectedOrganizationLabel ? "" : "text-zinc-500"}>{selectedOrganizationLabel || "Select organization"}</span></SelectTrigger><SelectContent>{organizationOptions.map((org) => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Model profile</Label><Select value={values.modelProfile} onValueChange={(value) => setValue("modelProfile", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reasoning-optimized">reasoning-optimized</SelectItem><SelectItem value="balanced">balanced</SelectItem><SelectItem value="fast">fast</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Runtime provider</Label><Select value={values.runtimeProviderId || "__none_provider"} onValueChange={(value) => setValue("runtimeProviderId", value === "__none_provider" ? "" : value)}><SelectTrigger><SelectValue placeholder="Use gateway default" /></SelectTrigger><SelectContent><SelectItem value="__none_provider">Use gateway default</SelectItem>{providerOptions.map((provider) => (<SelectItem key={provider.id} value={provider.id}>{provider.label}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Runtime model</Label><Select value={values.runtimeModelId || "__none_model"} onValueChange={(value) => setValue("runtimeModelId", value === "__none_model" ? "" : value)}><SelectTrigger><SelectValue placeholder="Use provider default" /></SelectTrigger><SelectContent><SelectItem value="__none_model">Use provider default</SelectItem>{selectedProviderModels.map((model) => (<SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tone</Label><Select value={values.tone} onValueChange={(value) => setValue("tone", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">professional</SelectItem><SelectItem value="professional_warm">professional_warm</SelectItem><SelectItem value="conversational">conversational</SelectItem></SelectContent></Select></div>
          </div>
        ) : null}

        {((mode === "create" && step === 5) || (mode === "import" && step === 2)) ? (
          <div className="space-y-4">
            <Tabs value={reviewTab} onValueChange={setReviewTab}>
              <TabsList><TabsTrigger value="resume">Resume</TabsTrigger><TabsTrigger value="chat">Chat Preview</TabsTrigger><TabsTrigger value="advanced">Advanced</TabsTrigger></TabsList>
              <TabsContent value="resume" className="mt-3"><PersonaResumePreview values={values} systemPrompt={systemPrompt} /></TabsContent>
              <TabsContent value="chat" className="mt-3 space-y-3">
                <p className="text-xs text-zinc-500">Chat uses saved persona defaults. Runtime provider/model overrides are applied via persona save.</p>
                <div className="min-h-[320px] space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">{chatMessages.length === 0 ? <p className="text-sm text-zinc-500">No messages yet.</p> : chatMessages.map((message) => (<div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-3 py-2 text-sm text-white" : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 whitespace-pre-wrap"}>{message.text}</div>))}</div>
                {chatError ? <p className="text-sm text-red-600">{chatError}</p> : null}
                <Textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} className="min-h-[96px]" placeholder="Ask a quick question" />
                <div className="flex justify-end"><Button type="button" onClick={() => void sendReviewMessage()} disabled={chatIsSending || !chatInput.trim()}>{chatIsSending ? "Sending..." : "Send message"}</Button></div>
              </TabsContent>
              <TabsContent value="advanced" className="mt-3 space-y-3"><div><p className="mb-1 text-sm font-medium text-zinc-700">Generated prompt</p><pre className="max-h-72 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs whitespace-pre-wrap">{systemPrompt || "No prompt generated yet."}</pre></div><div><p className="mb-1 text-sm font-medium text-zinc-700">Draft payload</p><pre className="max-h-72 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs">{JSON.stringify(values, null, 2)}</pre></div></TabsContent>
            </Tabs>
          </div>
        ) : null}
      </WizardTemplate>
    </div>
  );
}
