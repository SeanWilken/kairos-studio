import { useEffect, useMemo, useState } from "react";
import { Save, Sparkles, UserCircle2, Wrench } from "lucide-react";
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
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@kairosstack/ui";
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

const stepDefinitions = [
  { id: "basics", label: "Basics", description: "Identity, scope, organization", icon: UserCircle2 },
  { id: "personality", label: "Personality", description: "Trait selection", icon: Sparkles },
  { id: "communication", label: "Communication", description: "Tone and initiative", icon: Sparkles },
  { id: "guidelines", label: "Guidelines", description: "Do, don't, and guardrails", icon: Sparkles },
  { id: "tools", label: "Tools", description: "Capabilities and integrations", icon: Wrench },
  { id: "review", label: "Review", description: "Preview and save", icon: Save },
];

export function PersonaResumeBuilderClassic(props: {
  organizationOptions: Array<{ id: string; name: string }>;
  initialValues?: Partial<PersonaBuilderValues>;
  onChange?: (values: PersonaBuilderValues, systemPrompt: string) => void;
  onStepChange?: (stepIndex: number) => void;
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
  const [isSaving, setIsSaving] = useState(false);

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

  const currentStep = stepDefinitions[step] ?? stepDefinitions[0];
  const progress = Math.round((step / (stepDefinitions.length - 1)) * 100);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900">Persona Resume Builder</h2>
        <p className="text-sm text-zinc-600">Classic builder flow for baseline comparison.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>{step + 1} of {stepDefinitions.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stepDefinitions.map((definition, index) => {
          const Icon = definition.icon;
          const active = index === step;
          return (
            <button
              key={definition.id}
              type="button"
              onClick={() => setStep(index)}
              className={`flex items-center gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors ${
                active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{definition.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 p-4">
        <div className="mb-4 border-b border-zinc-200 pb-3">
          <p className="text-sm font-medium text-zinc-900">{currentStep.label}</p>
          <p className="text-xs text-zinc-600">{currentStep.description}</p>
        </div>

        {step === 0 ? (
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
              <Select value={values.orgId || undefined} onValueChange={(value) => setValue("orgId", value)}>
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
        ) : null}

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
            <Tabs defaultValue="chat">
              <TabsList>
                <TabsTrigger value="chat">Chat Preview</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="rounded border p-3 text-sm">
                <p className="font-medium">You: Help me plan a feature rollout.</p>
                <p className="mt-2 text-zinc-700">
                  {values.name || "Assistant"}: I can help. Let&apos;s break this into outcomes, dependencies, rollout phases, and risks.
                </p>
              </TabsContent>
              <TabsContent value="prompt">
                <Textarea value={values.systemPromptOverride || systemPrompt} onChange={(event) => setValue("systemPromptOverride", event.target.value)} className="min-h-[180px]" />
              </TabsContent>
            </Tabs>
            <PersonaResumePreview values={values} systemPrompt={systemPrompt} />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
        <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (step < stepDefinitions.length - 1) {
              setStep((current) => Math.min(stepDefinitions.length - 1, current + 1));
              return;
            }
            void save();
          }}
        >
          {step < stepDefinitions.length - 1 ? "Next" : isSaving ? "Saving..." : "Save Persona"}
        </Button>
      </div>
    </div>
  );
}
