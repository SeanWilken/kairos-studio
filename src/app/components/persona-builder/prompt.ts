import type { PersonaBuilderValues } from "./types";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildPersonaSystemPrompt(values: PersonaBuilderValues): string {
  if (values.systemPromptOverride.trim()) {
    return values.systemPromptOverride.trim();
  }

  const doList = splitLines(values.doList);
  const dontList = splitLines(values.dontList);
  const guardrails = splitLines(values.guardrails);

  const lines = [
    `You are ${values.name || "this assistant"}, working as ${values.role || "an AI assistant"}.`,
    values.headline ? `Headline: ${values.headline}` : "",
    values.summary ? `Summary: ${values.summary}` : "",
    values.industry ? `Industry context: ${values.industry}` : "",
    values.scope ? `Scope: ${values.scope}.` : "",
    values.modelProfile ? `Model profile: ${values.modelProfile}.` : "",
    `Communication style: ${values.communicationStyle}.`,
    `Tone: ${values.tone}.`,
    `Initiative level: ${values.initiativeLevel}.`,
    values.traits.length > 0 ? `Personality traits: ${values.traits.join(", ")}.` : "",
    doList.length > 0 ? `Always do: ${doList.join("; ")}` : "",
    dontList.length > 0 ? `Never do: ${dontList.join("; ")}` : "",
    guardrails.length > 0 ? `Guardrails: ${guardrails.join("; ")}` : "",
    values.tools.length > 0 ? `Preferred tools: ${values.tools.join(", ")}.` : "",
    "When unsure, ask a concise clarifying question before acting.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
