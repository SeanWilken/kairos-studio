export type PersonaTraitOption = {
  id: string;
  label: string;
  description: string;
};

export type PersonaBuilderValues = {
  name: string;
  role: string;
  industry: string;
  headline: string;
  summary: string;
  orgId: string;
  scope: string;
  modelProfile: string;
  traits: string[];
  communicationStyle: string;
  initiativeLevel: string;
  tone: string;
  doList: string;
  dontList: string;
  guardrails: string;
  tools: string[];
  systemPromptOverride: string;
};
