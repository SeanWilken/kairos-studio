import type {
  RegisterPayload,
  StudioMembershipCreatePayload,
  StudioOrganizationCreatePayload,
  StudioUserCreatePayload,
} from "../../../../../lib/api";

type UserActionMode = "admin_enroll" | "invite_user";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function splitLines(value: unknown): string[] {
  return asString(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function mapOrganizationRecordToCreateRequest(values: Record<string, unknown>): StudioOrganizationCreatePayload {
  return {
    name: asString(values.org_name),
    slug: asString(values.org_slug),
    mode: asString(values.org_mode, "team"),
    owner_user_id: asString(values.owner_user_id) || undefined,
  };
}

export function mapUserRecordToCreateRequest(
  values: Record<string, unknown>,
  options?: { fallbackOrgId?: string },
): { payload: StudioUserCreatePayload; actionMode: UserActionMode; targetOrgId: string } {
  const actionMode = asString(values.user_action_mode, "invite_user") as UserActionMode;
  const targetOrgId = asString(values.target_org_id, options?.fallbackOrgId ?? "");

  return {
    actionMode,
    targetOrgId,
    payload: {
      email: asString(values.user_email),
      first_name: asString(values.user_first_name),
      last_name: asString(values.user_last_name),
      phone: asString(values.user_phone),
      status: actionMode === "invite_user" ? "invited" : "active",
      is_global_admin: asBoolean(values.is_global_admin),
      role: asString(values.user_role, "member"),
      org_id: targetOrgId || undefined,
    },
  };
}

export function mapUserRecordToAuthRegisterRequest(
  values: Record<string, unknown>,
  options?: { tenantId?: string },
): { payload: RegisterPayload; actionMode: UserActionMode; targetOrgId: string } {
  const actionMode = asString(values.user_action_mode, "invite_user") as UserActionMode;
  const targetOrgId = asString(values.target_org_id, "");
  const isGlobalAdmin = asBoolean(values.is_global_admin);

  return {
    actionMode,
    targetOrgId,
    payload: {
      email: asString(values.user_email),
      password: asString(values.user_password),
      first_name: asString(values.user_first_name),
      last_name: asString(values.user_last_name),
      phone: asString(values.user_phone),
      tenant_id: options?.tenantId ?? null,
      org_id: isGlobalAdmin ? null : targetOrgId || null,
      is_global_admin: isGlobalAdmin,
      role: asString(values.user_role, "member"),
    },
  };
}

export function mapUserRecordToMembershipRequest(
  values: Record<string, unknown>,
  options: { userId: string; targetOrgId: string; actionMode: UserActionMode },
): StudioMembershipCreatePayload | null {
  const createMembership = asBoolean(values.create_membership, true);
  if (!createMembership || !options.targetOrgId) return null;

  return {
    org_id: options.targetOrgId,
    user_id: options.userId,
    role: asString(values.membership_role, "member"),
    status: asString(values.membership_status, options.actionMode === "invite_user" ? "invited" : "active"),
  };
}

export function mapPersonaRecordToDraft(values: Record<string, unknown>) {
  const traits = asArray(values.persona_traits);
  const communicationStyle = asString(values.persona_communication_style, "balanced");
  const responseDepth = asString(values.persona_response_depth, "standard");
  const initiativeLevel = asString(values.persona_initiative_level, "medium");
  const safetyMode = asString(values.persona_safety_mode, "balanced");
  const toneExamples = splitLines(values.persona_tone_examples);
  const doList = splitLines(values.persona_do_list);
  const dontList = splitLines(values.persona_dont_list);
  const toolPolicies = splitLines(values.persona_tool_policies);
  const escalationRules = splitLines(values.persona_escalation_rules);
  const memoryHints = splitLines(values.persona_memory_hints);
  const responseTemplate = asString(values.persona_response_template, "");
  const userContext = asString(values.persona_user_context, "");
  const successCriteria = splitLines(values.persona_success_criteria);

  return {
    name: asString(values.persona_name),
    slug: asString(values.persona_slug),
    role: asString(values.persona_role),
    scope: asString(values.persona_scope, "organization"),
    enabled: asBoolean(values.persona_enabled, true),
    instructions: asString(values.persona_instructions),
    guardrails: asString(values.persona_guardrails)
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
    model_profile: asString(values.persona_model_profile, "openai-default"),
    personality: {
      traits,
      communication_style: communicationStyle,
      response_depth: responseDepth,
      initiative_level: initiativeLevel,
      safety_mode: safetyMode,
      tone_examples: toneExamples,
      do_list: doList,
      dont_list: dontList,
    },
    operational_policies: {
      tool_policies: toolPolicies,
      escalation_rules: escalationRules,
      memory_hints: memoryHints,
      response_template: responseTemplate,
      user_context: userContext,
      success_criteria: successCriteria,
    },
  };
}

export function buildPersonaSystemPrompt(values: Record<string, unknown>): string {
  const draft = mapPersonaRecordToDraft(values);
  const lines = [
    `You are ${draft.name}, acting as ${draft.role}.`,
    `Scope: ${draft.scope}.`,
    `Core mission: ${asString(values.persona_primary_goal, "Deliver accurate, context-aware support.")}`,
    draft.operational_policies.user_context ? `Primary user context: ${draft.operational_policies.user_context}` : "",
    draft.instructions ? `Base instructions: ${draft.instructions}` : "",
    draft.guardrails.length > 0 ? `Guardrails: ${draft.guardrails.join("; ")}` : "",
    draft.personality.traits.length > 0 ? `Personality traits: ${draft.personality.traits.join(", ")}.` : "",
    `Communication style: ${draft.personality.communication_style}.`,
    `Response depth: ${draft.personality.response_depth}.`,
    `Initiative level: ${draft.personality.initiative_level}.`,
    `Safety mode: ${draft.personality.safety_mode}.`,
    draft.personality.do_list.length > 0 ? `Always do: ${draft.personality.do_list.join("; ")}` : "",
    draft.personality.dont_list.length > 0 ? `Never do: ${draft.personality.dont_list.join("; ")}` : "",
    draft.operational_policies.tool_policies.length > 0 ? `Tool policy: ${draft.operational_policies.tool_policies.join("; ")}` : "",
    draft.operational_policies.escalation_rules.length > 0 ? `Escalation rules: ${draft.operational_policies.escalation_rules.join("; ")}` : "",
    draft.operational_policies.memory_hints.length > 0 ? `Memory hints: ${draft.operational_policies.memory_hints.join("; ")}` : "",
    draft.operational_policies.response_template ? `Preferred response template: ${draft.operational_policies.response_template}` : "",
    draft.operational_policies.success_criteria.length > 0 ? `Success criteria: ${draft.operational_policies.success_criteria.join("; ")}` : "",
    draft.personality.tone_examples.length > 0 ? `Tone examples: ${draft.personality.tone_examples.join(" | ")}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

export function mapPersonaRecordToProviderPayload(values: Record<string, unknown>) {
  const draft = mapPersonaRecordToDraft(values);
  const systemPrompt = buildPersonaSystemPrompt(values);

  return {
    persona: {
      name: draft.name,
      slug: draft.slug,
      role: draft.role,
      scope: draft.scope,
      enabled: draft.enabled,
      model_profile: draft.model_profile,
      system_prompt: systemPrompt,
      prompt_blocks: {
        mission: asString(values.persona_primary_goal),
        instructions: draft.instructions,
        guardrails: draft.guardrails,
      },
      personality: draft.personality,
      operational_policies: draft.operational_policies,
      metadata: {
        author_notes: asString(values.record_notes),
        created_via: "studio_wizard",
      },
    },
  };
}
