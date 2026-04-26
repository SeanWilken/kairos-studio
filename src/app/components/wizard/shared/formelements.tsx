import React, { useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  cn,
} from "@kairosstack/ui";
import { ArrowRight, CheckCheck, CheckCircle2, ChevronRight, Circle } from "lucide-react";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "multiselect"
  | "toggle"
  | "button-group"
  | "boolean"
  | "switch"
  | "radio"
  | "sensitive_input"
  | "selectionlist"
  | "file_upload";

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldProps = {
  index: number;
  id: string;
  name: string;
  field_type: FieldType;
  currentValue: unknown;
  onChange: (value: unknown) => void;
  renderer?: (props: FormFieldProps) => React.ReactNode;
  description?: string;
  hint?: string;
  required?: boolean;
  classNames?: [string, string?];
  image_content_url?: string;
  default_value?: unknown;
  options?: FormFieldOption[];
};

export type FormStepProps = {
  index: number;
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isGrid?: boolean;
  isRequired: boolean;
  fields: FormFieldProps[];
};

export type FormProps = {
  title: string;
  description?: string;
  steps: FormStepProps[];
  mode: string;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onStepChange?: (step: number) => void;
  onValuesChange?: (values: Record<string, unknown>) => void;
  submitLabel?: string;
  initialValues?: Record<string, unknown>;
  storageKey?: string;
  showValuesPreview?: boolean;
};

type SidebarStep = {
  id: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

function normalizeInitialValues(formProps: FormProps): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(formProps.initialValues ?? {}) };

  formProps.steps.forEach((step) => {
    step.fields.forEach((field) => {
      if (next[field.id] !== undefined) return;
      if (field.default_value !== undefined) {
        next[field.id] = field.default_value;
        return;
      }
      if (field.field_type === "multiselect" || field.field_type === "selectionlist") {
        next[field.id] = [];
        return;
      }
      if (
        field.field_type === "boolean" ||
        field.field_type === "switch" ||
        field.field_type === "toggle" ||
        field.field_type === "checkbox"
      ) {
        next[field.id] = false;
        return;
      }
      next[field.id] = "";
    });
  });

  return next;
}

function readStoredValues(storageKey?: string): Record<string, unknown> | null {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function TextInputField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Input
        value={String(field.currentValue ?? "")}
        type="text"
        onChange={(event) => field.onChange(event.target.value)}
        placeholder={field.hint}
      />
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function SensitiveInputField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Input
        value={String(field.currentValue ?? "")}
        type="password"
        onChange={(event) => field.onChange(event.target.value)}
        placeholder={field.hint}
      />
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function TextAreaField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Textarea
        value={String(field.currentValue ?? "")}
        onChange={(event) => field.onChange(event.target.value)}
        placeholder={field.hint}
      />
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function NumberInputField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Input
        value={String(field.currentValue ?? "")}
        type="number"
        onChange={(event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))}
        placeholder={field.hint}
      />
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function DateField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Input
        value={String(field.currentValue ?? "")}
        type="date"
        onChange={(event) => field.onChange(event.target.value)}
      />
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function SelectField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <Select value={String(field.currentValue ?? "")} onValueChange={(value) => field.onChange(value)}>
        <SelectTrigger>
          <SelectValue placeholder={field.hint ?? "Select"} />
        </SelectTrigger>
        <SelectContent className="kairos-overlay-content kairos-select-content">
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value} className="kairos-overlay-item">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function ButtonGroupField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <Label>{field.name}</Label>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((option) => (
          <Button
            key={option.value}
            variant={field.currentValue === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => field.onChange(option.value)}
            type="button"
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function SwitchField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3">
      <div>
        <Label>{field.name}</Label>
        {field.description ? <p className="text-xs text-zinc-500 mt-0.5">{field.description}</p> : null}
      </div>
      <Switch checked={Boolean(field.currentValue)} onCheckedChange={(value) => field.onChange(value)} />
    </div>
  );
}

export function RadioField(field: FormFieldProps): React.ReactNode {
  return (
    <div className="space-y-2">
      <Label>{field.name}</Label>
      <div className="space-y-1">
        {field.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => field.onChange(option.value)}
            className={cn(
              "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
              field.currentValue === option.value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function MultiSelectField(field: FormFieldProps): React.ReactNode {
  const selected = Array.isArray(field.currentValue) ? (field.currentValue as string[]) : [];
  return (
    <div className="space-y-2">
      <Label>{field.name}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {field.options?.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (isSelected) {
                  field.onChange(selected.filter((value) => value !== option.value));
                } else {
                  field.onChange([...selected, option.value]);
                }
              }}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                isSelected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function FileUploadField(field: FormFieldProps): React.ReactNode {
  const files = Array.isArray(field.currentValue) ? (field.currentValue as File[]) : [];
  return (
    <div className="space-y-2">
      <Label>{field.name}</Label>
      <Input
        type="file"
        multiple
        onChange={(event) => field.onChange(Array.from(event.target.files ?? []))}
      />
      {files.length > 0 ? (
        <p className="text-xs text-zinc-600">{files.length} file(s) selected</p>
      ) : null}
      {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
    </div>
  );
}

export function RenderFormField(field: FormFieldProps): React.ReactNode {
  if (field.renderer) {
    return field.renderer(field);
  }

  switch (field.field_type) {
    case "text":
      return <TextInputField {...field} />;
    case "textarea":
      return <TextAreaField {...field} />;
    case "number":
      return <NumberInputField {...field} />;
    case "date":
      return <DateField {...field} />;
    case "select":
      return <SelectField {...field} />;
    case "button-group":
      return <ButtonGroupField {...field} />;
    case "switch":
    case "toggle":
    case "boolean":
    case "checkbox":
      return <SwitchField {...field} />;
    case "radio":
      return <RadioField {...field} />;
    case "multiselect":
    case "selectionlist":
      return <MultiSelectField {...field} />;
    case "sensitive_input":
      return <SensitiveInputField {...field} />;
    case "file_upload":
      return <FileUploadField {...field} />;
    default:
      return null;
  }
}

function mapStepsToSidebarSteps(steps: FormStepProps[]): SidebarStep[] {
  return steps.map((step) => ({
    id: step.index,
    label: step.name,
    description: step.description,
    icon: step.icon,
  }));
}

function StepSidebar({
  current,
  completed,
  steps,
  mode,
}: {
  current: number;
  completed: Set<number>;
  steps: SidebarStep[];
  mode: string;
}) {
  const completedCount = steps.filter((step) => completed.has(step.id)).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="w-56 lg:w-60 flex-shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
      <div className="p-5 border-b border-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-900">{mode}</h2>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1.5">
            <span>
              {completedCount} of {steps.length} complete
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <nav className="p-3 space-y-0.5">
        {steps.map((step) => {
          const done = completed.has(step.id);
          const active = current === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active ? "bg-zinc-900 text-white" : done ? "text-zinc-700 hover:bg-zinc-50" : "text-zinc-400"
              )}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {done && !active ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : active ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className={cn("text-sm font-medium leading-none", active ? "text-white" : done ? "text-zinc-800" : "text-zinc-400")}>{step.label}</div>
                <div className={cn("text-xs mt-0.5", active ? "text-zinc-300" : "text-zinc-400")}>{step.description}</div>
              </div>
              {active ? <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-zinc-300" /> : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function RenderFormStep({
  step,
  values,
  onFieldChange,
}: {
  step: FormStepProps;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
}) {
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-6 mb-6">
      <div className={cn(step.isGrid ? "grid grid-cols-1 gap-6 md:grid-cols-2" : "space-y-6")}>
        {step.fields.map((field) => (
          <RenderFormField
            key={field.id}
            {...field}
            currentValue={values[field.id]}
            onChange={(value) => onFieldChange(field.id, value)}
          />
        ))}
      </div>
    </div>
  );
}

function RenderSpotlightContextHeader({ step }: { step: FormStepProps }) {
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white/90"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setSpotlight({ x, y });
      }}
    >
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl transition-transform duration-200"
        style={{ transform: `translate(${(spotlight.x - 50) * 0.18}px, ${(spotlight.y - 50) * 0.16}px)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-violet-200/35 blur-3xl transition-transform duration-200"
        style={{ transform: `translate(${(50 - spotlight.x) * 0.14}px, ${(50 - spotlight.y) * 0.12}px)` }}
      />
      <div className="relative grid gap-4 p-5 md:grid-cols-[2fr_1fr] md:items-center md:gap-6 md:p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{step.name}</h2>
          <p className="mt-1 text-sm text-zinc-600">{step.description}</p>
        </div>
        <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Current Context</p>
          <p className="mt-1 text-xs text-zinc-700">{step.fields[0]?.description ?? "Complete fields to continue."}</p>
        </div>
      </div>
    </div>
  );
}

export function RenderForm(formProps: FormProps): React.ReactNode {
  const sidebarSteps = useMemo(() => mapStepsToSidebarSteps(formProps.steps), [formProps.steps]);
  const initialValues = useMemo(() => {
    const normalized = normalizeInitialValues(formProps);
    const persisted = readStoredValues(formProps.storageKey);
    return persisted ? { ...normalized, ...persisted } : normalized;
  }, [formProps]);

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const currentStep = formProps.steps[Math.max(0, Math.min(currentStepIndex, formProps.steps.length - 1))];

  const canContinue = useMemo(() => {
    if (!currentStep.isRequired) return true;
    return currentStep.fields.every((field) => {
      if (!field.required) return true;
      return !isEmptyValue(values[field.id]);
    });
  }, [currentStep, values]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setValues((previous) => {
      const next = { ...previous, [fieldId]: value };
      formProps.onValuesChange?.(next);
      if (formProps.storageKey) {
        localStorage.setItem(formProps.storageKey, JSON.stringify(next));
      }
      return next;
    });
    if (submitState !== "idle") {
      setSubmitState("idle");
      setSubmitMessage("");
    }
  };

  const goNext = () => {
    setCompleted((previous) => new Set([...previous, currentStep.index]));
    const nextIndex = Math.min(currentStepIndex + 1, formProps.steps.length - 1);
    setCurrentStepIndex(nextIndex);
    formProps.onStepChange?.(nextIndex);
  };

  const goPrev = () => {
    const nextIndex = Math.max(0, currentStepIndex - 1);
    setCurrentStepIndex(nextIndex);
    formProps.onStepChange?.(nextIndex);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <StepSidebar current={currentStep.index} completed={completed} steps={sidebarSteps} mode={formProps.mode} />

      <div className="flex-1 overflow-y-auto bg-zinc-50">
        <div className="w-full h-full px-4 py-6 lg:px-8 xl:px-10">
          <div className="mb-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
              Step {currentStepIndex + 1} of {formProps.steps.length}
            </p>
            <h1 className="text-2xl font-bold text-zinc-900">{currentStep.name}</h1>
            <p className="text-sm text-zinc-600 mt-1">{currentStep.description}</p>
          </div>

          <RenderSpotlightContextHeader step={currentStep} />

          <RenderFormStep step={currentStep} values={values} onFieldChange={handleFieldChange} />

          {/* {formProps.showValuesPreview ? (
            <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Current Values</p>
              <pre className="text-xs text-zinc-700 overflow-auto">{JSON.stringify(values, null, 2)}</pre>
            </div>
          ) : null} */}

          {submitState === "error" ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitMessage || "Submission failed."}
            </div>
          ) : null}

          {submitState === "success" ? (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {submitMessage || "Saved successfully."}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={currentStepIndex <= 0}>
              Back
            </Button>

            <div className="flex items-center gap-3">
              {currentStepIndex < formProps.steps.length - 1 ? (
                <Button onClick={goNext} disabled={!canContinue}>
                  Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      setSubmitState("submitting");
                      setSubmitMessage("");
                      await formProps.onSubmit(values);
                      setSubmitState("success");
                      setSubmitMessage("Request completed and values saved.");
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "Submission failed.";
                      setSubmitState("error");
                      setSubmitMessage(message);
                    }
                  }}
                  disabled={submitState === "submitting"}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  {submitState === "submitting" ? "Submitting..." : formProps.submitLabel ?? "Complete Setup"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
