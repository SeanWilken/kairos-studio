import { useEffect, useMemo, useState } from "react";
import { AlertTriangleIcon, HammerIcon, Pencil, PencilRulerIcon, Save, ScanLineIcon, Sparkles, Speech, UserCircle2, Wrench } from "lucide-react";
import {
  Alert,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  WizardTemplate,
  ChatWorkspace,
  type ChatParticipant,
  type ChatMessage
} from "@kairosstack/ui";
import { PersonaTraitCard } from "./PersonaTraitCard";
import { PersonaResumePreview } from "./PersonaResumePreview";
import { buildPersonaSystemPrompt } from "./prompt";
import type { PersonaBuilderValues, PersonaTraitOption } from "./types";
import { PackImportWorkflow } from "./PackImportWorkflow";
import { createCoreApiClient } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth-session";

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

const stepDefinitions = [
  { id: "basics", label: "Basics", description: "Identity, scope, organization", icon: UserCircle2 },
  { id: "personality", label: "Personality", description: "Trait selection", icon: Sparkles },
  { id: "communication", label: "Communication", description: "Tone and initiative", icon: Speech },
  { id: "guidelines", label: "Guidelines", description: "Do, don't, and guardrails", icon: PencilRulerIcon },
  { id: "tools", label: "Tools", description: "Capabilities and integrations", icon: HammerIcon },
  { id: "review", label: "Review", description: "Preview and save", icon: Save },
];

const mockParticipants: ChatParticipant[] = [
  { id: "assistant-1", name: "Your Assistant", role: "assistant", avatarColor: "bg-blue-500" },
  { id: "pm-1", name: "Alex Chen", role: "user", avatarColor: "bg-green-500" },
  { id: "dev-1", name: "Jordan Kim", role: "user", avatarColor: "bg-purple-500" },
];

export function PersonaResumeBuilder(props: {
  organizationOptions: Array<{ id: string; name: string }>;
  initialValues?: Partial<PersonaBuilderValues>;
  onChange?: (values: PersonaBuilderValues, systemPrompt: string) => void;
  onStepChange?: (stepIndex: number) => void;
  onChatTest?: (input: { message: string; values: PersonaBuilderValues; systemPrompt: string }) => Promise<string>;
  onSave: (values: PersonaBuilderValues, systemPrompt: string) => Promise<void> | void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<PersonaBuilderValues>({
    name: "",
    role: "",
    industry: "software_development",
    headline: "",
    summary: "",
    orgId: "",
    scope: "organization",
    modelProfile: "reasoning-optimized",
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
  
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const defaultOrgId = env.VITE_KAIROS_ORG_ID ?? "Development";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
  const [accessToken] = useState(() => getAccessToken());

  const client = useMemo(
    () =>
      createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId, orgId: defaultOrgId },
      }),
    [runtimeBaseUrl, accessToken, tenantId, defaultOrgId],
  );

  
  const currentStep = stepDefinitions[step] ?? stepDefinitions[0];
  const [activeTab, setActiveTab] = useState("builder");

  const [isSaving, setIsSaving] = useState(false);
  const [reviewTab, setReviewTab] = useState("resume");
  const [chatInput, setChatInput] = useState("Introduce yourself and explain how you can help with a feature rollout.");
  const [chatIsSending, setChatIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([]);

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

  const organizationOptions = useMemo(() => {
    if (!values.orgId || props.organizationOptions.some((option) => option.id === values.orgId)) {
      return props.organizationOptions;
    }
    return [
      { id: values.orgId, name: `Current org (${values.orgId})` },
      ...props.organizationOptions,
    ];
  }, [props.organizationOptions, values.orgId]);

  const systemPrompt = useMemo(() => buildPersonaSystemPrompt(values), [values]);


  const [selectedThreadId, setSelectedThreadId] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  
  function sendMessage(message: string) {
    console.log(message);
  }

  function onDraftChange(draft: string) {
    console.info(draft);
  }

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

  const sendReviewMessage = async () => {
    const message = // chatInput ? chatInput.trim() : 
      "This is a test message to review the persona's communication style and capabilities.";
    if (!message) return;

    const userId = `user-${Date.now()}`;
    setChatError("");
    setChatMessages((previous) => [...previous, { id: userId, role: "user", text: message }]);
    setChatInput("");

    setChatIsSending(true);
    try {
      const assistantText = props.onChatTest
        ? await props.onChatTest({ message, values, systemPrompt })
        : `${values.name || "Assistant"}: I can help. I'll start by clarifying goals, defining rollout stages, and mapping risks before execution.`;
      setChatMessages((previous) => [
        ...previous,
        { id: `assistant-${Date.now()}`, role: "assistant", text: assistantText || "No response received." },
      ]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Failed to run chat preview.");
    } finally {
      setChatIsSending(false);
    }
  };




  return (
    <WizardTemplate
      title="Persona Resume Builder"
      description="Design and review a persona before saving"
      contextText={`Step ${step + 1} of ${stepDefinitions.length}: ${currentStep.label}`}
      steps={stepDefinitions}
      currentStepId={currentStep.id}
      completedStepIds={stepDefinitions.slice(0, step).map((s) => s.id)}
      canGoBack={step > 0}
      canGoNext={true}
      backLabel="Back"
      nextLabel={step < stepDefinitions.length - 1 ? "Next" : isSaving ? "Saving..." : "Save Persona"}
      onBack={() => setStep((current) => Math.max(0, current - 1))}
      onNext={() => {
        if (step < stepDefinitions.length - 1) {
          setStep((current) => Math.min(stepDefinitions.length - 1, current + 1));
          return;
        }
        void save();
      }}
      className="md:[&>div]:grid-cols-[248px_1fr]"
      classNames={{
        root: "min-h-[calc(100vh-12rem)] border-zinc-200 bg-white",
        rail: "min-h-[calc(100vh-12rem)] bg-zinc-50",
        railHeader: "px-5 py-5",
        railNav: "px-3 py-3",
        panelHeader: "bg-zinc-50/50",
        panelBody: "py-4",
      }}
      contextValues={{
        Traits: String(values.traits.length),
        Tools: String(values.tools.length),
      }}
    >
      {step === 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList>
            <TabsTrigger value="builder">Resume Builder</TabsTrigger>
            <TabsTrigger value="import">Import and Review</TabsTrigger>
            <TabsTrigger value="template">Templates</TabsTrigger>
          </TabsList>


          <TabsContent value="Templates">
            {/* <PackImportWorkflow client={client} /> */}
            <div>Templates</div>
          </TabsContent>

          <TabsContent value="import">
            <PackImportWorkflow client={client} />
          </TabsContent>

          <TabsContent value="builder">

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={values.name} onChange={(event) => setValue("name", event.target.value)} placeholder="Kai" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={values.role} onChange={(event) => setValue("role", event.target.value)} placeholder="AI Development Assistant" />
              </div>
              <div className="space-y-1.5">
                <Label>Organization</Label>
                <Select
                  value={values.orgId || undefined}
                  onValueChange={(value) => setValue("orgId", value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>
                    {organizationOptions.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input value={values.industry} onChange={(event) => setValue("industry", event.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Headline</Label>
                <Input value={values.headline} onChange={(event) => setValue("headline", event.target.value)} placeholder="Your helpful coding partner" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Summary</Label>
                <Textarea
                  value={values.summary}
                  onChange={(event) => setValue("summary", event.target.value)}
                  className="min-h-[110px]"
                  placeholder="Resume-style summary used for persona export and editing workflows"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={values.scope} onValueChange={(value) => setValue("scope", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">organization</SelectItem>
                    <SelectItem value="team">team</SelectItem>
                    <SelectItem value="tenant">tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Model profile</Label>
                <Select value={values.modelProfile} onValueChange={(value) => setValue("modelProfile", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reasoning-optimized">reasoning-optimized</SelectItem>
                    <SelectItem value="balanced">balanced</SelectItem>
                    <SelectItem value="fast">fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>) : null
      }

      {step === 1 ? (
        <div>
          <p className="mb-2 text-sm text-zinc-600">Select 2-4 traits.</p>
          <div className="grid gap-2 md:grid-cols-3">
            {traitOptions.map((option) => (
              <PersonaTraitCard key={option.id} option={option} selected={values.traits.includes(option.id)} onToggle={toggleTrait} />
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Communication</Label>
            <Select value={values.communicationStyle} onValueChange={(value) => setValue("communicationStyle", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">concise</SelectItem>
                <SelectItem value="balanced">balanced</SelectItem>
                <SelectItem value="detailed">detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={values.tone} onValueChange={(value) => setValue("tone", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">professional</SelectItem>
                <SelectItem value="professional_warm">professional_warm</SelectItem>
                <SelectItem value="conversational">conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Initiative</Label>
            <Select value={values.initiativeLevel} onValueChange={(value) => setValue("initiativeLevel", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Do</Label>
            <Textarea value={values.doList} onChange={(event) => setValue("doList", event.target.value)} className="min-h-[220px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Don't</Label>
            <Textarea value={values.dontList} onChange={(event) => setValue("dontList", event.target.value)} className="min-h-[220px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Guardrails</Label>
            <Textarea value={values.guardrails} onChange={(event) => setValue("guardrails", event.target.value)} className="min-h-[220px]" />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-2">
          <Label>Tools & Capabilities</Label>
          <div className="grid gap-2 md:grid-cols-3">
            {["knowledge_base_query", "web_search", "task_management", "documentation", "email_compose", "calendar"].map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                className={`rounded border px-3 py-2 text-left text-sm ${values.tools.includes(tool) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <Tabs value={reviewTab} onValueChange={setReviewTab}>
            <TabsList>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="chat">Chat Preview</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-3">
              <PersonaResumePreview values={values} systemPrompt={systemPrompt} />
            </TabsContent>

            <TabsContent value="chat" className="mt-3 space-y-3">
              <div className="min-h-[320px] space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-zinc-500">No messages yet. Send a quick prompt to test this resume-generated system prompt.</p>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={message.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-3 py-2 text-sm text-white"
                        : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 whitespace-pre-wrap"}
                    >
                      {message.text}
                    </div>
                  ))
                )}
              </div>
              {chatError ? <p className="text-sm text-red-600">{chatError}</p> : null}
              <div className="space-y-2">
                <Textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  className="min-h-[96px]"
                  placeholder="Ask a quick question to validate this persona"
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={() => void sendReviewMessage()} disabled={chatIsSending || !chatInput.trim()}>
                    {chatIsSending ? "Sending..." : "Send message"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-3 space-y-3">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-700">Generated prompt</p>
                <pre className="max-h-72 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs whitespace-pre-wrap">{systemPrompt || "No prompt generated yet."}</pre>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-700">Draft payload</p>
                <pre className="max-h-72 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs">{JSON.stringify(values, null, 2)}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </WizardTemplate>
  );
}
