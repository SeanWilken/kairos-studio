import { Activity, Building2, Link2, Shield, Sparkles, UserRound, Users } from "lucide-react";
import { RenderForm, type FieldType, type FormFieldProps, type FormProps, type FormStepProps } from "../../shared/formelements";
import { authApi, bootstrapApi, createCoreApiClient, studioApi, systemApi } from "../../../../../lib/api";
import {
  buildPersonaSystemPrompt,
  mapOrganizationRecordToCreateRequest,
  mapPersonaRecordToDraft,
  mapPersonaRecordToProviderPayload,
  mapUserRecordToAuthRegisterRequest,
  mapUserRecordToCreateRequest,
  mapUserRecordToMembershipRequest,
} from "./mappers";
import { readWorkspaceTeams, writeWorkspaceTeams } from "../../../../../lib/workspace-scope";
import { getRuntimeConfig } from "../../../../../config/runtime";

export type WizardVariant =
  | "organization_create"
  | "user_create"
  | "team_create"
  | "persona_create"
  | "status_checks";

type RecordSubmitOptions = {
  tenantId?: string;
  orgId?: string;
  runtimeBaseUrl?: string;
  accessToken?: string;
};

function field(base: Omit<FormFieldProps, "currentValue" | "onChange">): FormFieldProps {
  return {
    ...base,
    currentValue: base.default_value,
    onChange: () => undefined,
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export const organizationCreateSteps: FormStepProps[] = [
  {
    index: 0,
    id: "org_profile",
    name: "Organization Profile",
    description: "Create an organization record using /v1/studio/organizations.",
    icon: Building2,
    isGrid: true,
    isRequired: true,
    fields: [
      field({ index: 0, id: "org_name", name: "Organization name", field_type: "text" as FieldType, required: true, hint: "Kairos Labs", default_value: "" }),
      field({ index: 1, id: "org_slug", name: "Organization slug", field_type: "text" as FieldType, required: true, hint: "kairos-labs", default_value: "" }),
      field({
        index: 2,
        id: "org_mode",
        name: "Organization mode",
        field_type: "radio" as FieldType,
        required: true,
        default_value: "team",
        options: [
          { label: "Individual", value: "individual" },
          { label: "Team", value: "team" },
          { label: "Enterprise", value: "enterprise" },
        ],
      }),
      field({ index: 3, id: "owner_user_id", name: "Owner user id (optional)", field_type: "text" as FieldType, hint: "existing-user-id", default_value: "" }),
      field({ index: 4, id: "queue_error_policy", name: "Queue error policy", field_type: "select" as FieldType, default_value: "pause", options: [
        { label: "Pause queue on failure", value: "pause" },
        { label: "Continue queue on failure", value: "continue" },
      ] }),
    ],
  },
  {
    index: 1,
    id: "org_record",
    name: "Record Metadata",
    description: "Capture notes you want to store with this onboarding submission.",
    icon: Link2,
    isGrid: false,
    isRequired: false,
    fields: [
      field({ index: 0, id: "record_notes", name: "Record notes", field_type: "textarea" as FieldType, hint: "Optional setup notes", default_value: "" }),
      field({ index: 1, id: "record_effective_date", name: "Effective date", field_type: "date" as FieldType, default_value: "" }),
    ],
  },
];

export const userCreateSteps: FormStepProps[] = [
  {
    index: 0,
    id: "user_mode",
    name: "User Creation Mode",
    description: "Choose invite flow or direct admin enrollment.",
    icon: UserRound,
    isGrid: false,
    isRequired: true,
    fields: [
      field({
        index: 0,
        id: "user_action_mode",
        name: "Action",
        field_type: "radio" as FieldType,
        required: true,
        default_value: "invite_user",
        options: [
          { label: "Invite user (account created after accept)", value: "invite_user" },
          { label: "Enroll admin now", value: "admin_enroll" },
        ],
      }),
      field({ index: 1, id: "target_org_id", name: "Target organization id", field_type: "text" as FieldType, required: false, default_value: "", hint: "Optional for global admin enroll" }),
      field({ index: 2, id: "queue_error_policy", name: "Queue error policy", field_type: "select" as FieldType, default_value: "pause", options: [
        { label: "Pause queue on failure", value: "pause" },
        { label: "Continue queue on failure", value: "continue" },
      ] }),
    ],
  },
  {
    index: 1,
    id: "user_profile",
    name: "User Profile",
    description: "Payload maps to /v1/studio/users.",
    icon: Shield,
    isGrid: true,
    isRequired: true,
    fields: [
      field({ index: 0, id: "user_email", name: "Email", field_type: "text" as FieldType, required: true, hint: "user@kairos.local", default_value: "" }),
      field({ index: 1, id: "user_first_name", name: "First name", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 2, id: "user_last_name", name: "Last name", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 3, id: "user_phone", name: "Phone", field_type: "text" as FieldType, default_value: "" }),
      field({ index: 4, id: "user_password", name: "Password (for admin enroll)", field_type: "sensitive_input" as FieldType, hint: "min 8 chars", default_value: "" }),
      field({
        index: 5,
        id: "user_role",
        name: "Role",
        field_type: "select" as FieldType,
        required: true,
        default_value: "member",
        options: [
          { label: "Viewer", value: "viewer" },
          { label: "Member", value: "member" },
          { label: "Admin", value: "admin" },
          { label: "Owner", value: "owner" },
        ],
      }),
      field({ index: 6, id: "is_global_admin", name: "Global admin", field_type: "switch" as FieldType, default_value: false, description: "For stack-level owners only." }),
    ],
  },
  {
    index: 2,
    id: "membership",
    name: "Membership",
    description: "Optional membership call to /v1/studio/memberships.",
    icon: Link2,
    isGrid: true,
    isRequired: false,
    fields: [
      field({ index: 0, id: "create_membership", name: "Create membership after user", field_type: "switch" as FieldType, default_value: true }),
      field({ index: 1, id: "membership_role", name: "Membership role", field_type: "select" as FieldType, default_value: "member", options: [
        { label: "Viewer", value: "viewer" },
        { label: "Member", value: "member" },
        { label: "Admin", value: "admin" },
      ] }),
      field({ index: 2, id: "membership_status", name: "Membership status", field_type: "select" as FieldType, default_value: "active", options: [
        { label: "Active", value: "active" },
        { label: "Invited", value: "invited" },
        { label: "Suspended", value: "suspended" },
      ] }),
    ],
  },
];

export const personaCreateSteps: FormStepProps[] = [
  {
    index: 0,
    id: "persona_profile",
    name: "Agent Persona",
    description: "Capture persona definition records for upcoming persona API rollout.",
    icon: Sparkles,
    isGrid: true,
    isRequired: true,
    fields: [
      field({ index: 0, id: "persona_name", name: "Persona name", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 1, id: "persona_slug", name: "Persona slug", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 2, id: "persona_role", name: "Persona role", field_type: "text" as FieldType, required: true, hint: "support-assistant", default_value: "" }),
      field({ index: 3, id: "persona_scope", name: "Scope", field_type: "select" as FieldType, default_value: "organization", options: [
        { label: "Personal", value: "personal" },
        { label: "Organization", value: "organization" },
        { label: "Department", value: "department" },
      ] }),
      field({ index: 4, id: "persona_enabled", name: "Enable persona", field_type: "switch" as FieldType, default_value: true }),
      field({ index: 5, id: "persona_primary_goal", name: "Primary goal", field_type: "textarea" as FieldType, required: true, default_value: "", hint: "What success looks like for this persona." }),
      field({ index: 6, id: "persona_user_context", name: "Primary user context", field_type: "textarea" as FieldType, required: false, default_value: "", hint: "Who this persona serves, with context." }),
      field({ index: 7, id: "queue_error_policy", name: "Queue error policy", field_type: "select" as FieldType, default_value: "continue", options: [
        { label: "Pause queue on failure", value: "pause" },
        { label: "Continue queue on failure", value: "continue" },
      ] }),
    ],
  },
  {
    index: 1,
    id: "persona_policy",
    name: "Persona Guardrails",
    description: "Store prompt and policy settings as onboarding record values.",
    icon: Shield,
    isGrid: false,
    isRequired: false,
    fields: [
      field({ index: 0, id: "persona_instructions", name: "System instructions", field_type: "textarea" as FieldType, default_value: "", hint: "Core behavior and boundaries..." }),
      field({ index: 1, id: "persona_guardrails", name: "Guardrails", field_type: "textarea" as FieldType, default_value: "", hint: "One per line" }),
      field({ index: 2, id: "persona_model_profile", name: "Model profile", field_type: "select" as FieldType, default_value: "openai-default", options: [
        { label: "OpenAI Default", value: "openai-default" },
        { label: "Anthropic Default", value: "anthropic-default" },
        { label: "Reasoning Optimized", value: "reasoning-optimized" },
      ] }),
      field({ index: 3, id: "persona_traits", name: "Personality traits", field_type: "multiselect" as FieldType, default_value: ["relaxed", "hand_hold"], options: [
        { label: "Relaxed", value: "relaxed" },
        { label: "Hand-hold", value: "hand_hold" },
        { label: "Out-of-sight", value: "out_of_sight" },
        { label: "Direct", value: "direct" },
        { label: "Encouraging", value: "encouraging" },
        { label: "Formal", value: "formal" },
        { label: "Playful", value: "playful" },
      ] }),
      field({ index: 4, id: "persona_communication_style", name: "Communication style", field_type: "select" as FieldType, default_value: "balanced", options: [
        { label: "Concise", value: "concise" },
        { label: "Balanced", value: "balanced" },
        { label: "Detailed", value: "detailed" },
      ] }),
      field({ index: 5, id: "persona_response_depth", name: "Response depth", field_type: "select" as FieldType, default_value: "standard", options: [
        { label: "Lightweight", value: "lightweight" },
        { label: "Standard", value: "standard" },
        { label: "In-depth", value: "in_depth" },
      ] }),
      field({ index: 6, id: "persona_initiative_level", name: "Initiative level", field_type: "select" as FieldType, default_value: "medium", options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
      ] }),
      field({ index: 7, id: "persona_safety_mode", name: "Safety mode", field_type: "select" as FieldType, default_value: "balanced", options: [
        { label: "Strict", value: "strict" },
        { label: "Balanced", value: "balanced" },
        { label: "Flexible", value: "flexible" },
      ] }),
      field({ index: 8, id: "persona_tone_examples", name: "Tone examples", field_type: "textarea" as FieldType, default_value: "", hint: "One example per line" }),
      field({ index: 9, id: "persona_do_list", name: "Always do", field_type: "textarea" as FieldType, default_value: "", hint: "One behavior per line" }),
      field({ index: 10, id: "persona_dont_list", name: "Never do", field_type: "textarea" as FieldType, default_value: "", hint: "One anti-pattern per line" }),
      field({ index: 11, id: "persona_tool_policies", name: "Tool policies", field_type: "textarea" as FieldType, default_value: "", hint: "When to call tools, one policy per line" }),
      field({ index: 12, id: "persona_escalation_rules", name: "Escalation rules", field_type: "textarea" as FieldType, default_value: "", hint: "When to escalate, one rule per line" }),
      field({ index: 13, id: "persona_memory_hints", name: "Memory hints", field_type: "textarea" as FieldType, default_value: "", hint: "Facts to keep over the session" }),
      field({ index: 14, id: "persona_response_template", name: "Response template", field_type: "textarea" as FieldType, default_value: "", hint: "Optional output structure" }),
      field({ index: 15, id: "persona_success_criteria", name: "Success criteria", field_type: "textarea" as FieldType, default_value: "", hint: "How to measure response quality" }),
    ],
  },
];

export const teamCreateSteps: FormStepProps[] = [
  {
    index: 0,
    id: "team_profile",
    name: "Team Profile",
    description: "Create a team under an organization context.",
    icon: Users,
    isGrid: true,
    isRequired: true,
    fields: [
      field({ index: 0, id: "team_org_id", name: "Organization", field_type: "select" as FieldType, required: true, default_value: "", hint: "Select organization", options: [] }),
      field({ index: 1, id: "team_name", name: "Team name", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 2, id: "team_slug", name: "Team slug (optional)", field_type: "text" as FieldType, required: false, default_value: "" }),
      field({ index: 3, id: "queue_error_policy", name: "Queue error policy", field_type: "select" as FieldType, default_value: "pause", options: [
        { label: "Pause queue on failure", value: "pause" },
        { label: "Continue queue on failure", value: "continue" },
      ] }),
    ],
  },
  {
    index: 1,
    id: "team_notes",
    name: "Notes",
    description: "Capture setup notes for team onboarding.",
    icon: Link2,
    isGrid: false,
    isRequired: false,
    fields: [
      field({ index: 0, id: "record_notes", name: "Record notes", field_type: "textarea" as FieldType, default_value: "" }),
    ],
  },
];

export const statusSteps: FormStepProps[] = [
  {
    index: 0,
    id: "lookup",
    name: "Lookup IDs",
    description: "Provide ids for organization/user and optional membership/session checks.",
    icon: Activity,
    isGrid: true,
    isRequired: true,
    fields: [
      field({ index: 0, id: "target_org_id", name: "Organization ID", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 1, id: "target_user_id", name: "User ID", field_type: "text" as FieldType, required: true, default_value: "" }),
      field({ index: 2, id: "target_membership_id", name: "Membership ID", field_type: "text" as FieldType, default_value: "" }),
      field({ index: 3, id: "session_id", name: "Runtime Session ID", field_type: "text" as FieldType, default_value: "" }),
    ],
  },
  {
    index: 1,
    id: "checks",
    name: "Checks & Status",
    description: "Select checks and optional membership patch operation.",
    icon: Shield,
    isGrid: false,
    isRequired: false,
    fields: [
      field({ index: 0, id: "check_org", name: "Get organization", field_type: "switch" as FieldType, default_value: true }),
      field({ index: 1, id: "check_user", name: "Get user", field_type: "switch" as FieldType, default_value: true }),
      field({ index: 2, id: "check_runtime_status", name: "Get runtime status", field_type: "switch" as FieldType, default_value: false }),
      field({ index: 3, id: "patch_membership", name: "Patch membership status", field_type: "switch" as FieldType, default_value: false }),
      field({ index: 4, id: "patch_membership_status", name: "Patch status value", field_type: "select" as FieldType, default_value: "active", options: [
        { label: "Active", value: "active" },
        { label: "Invited", value: "invited" },
        { label: "Suspended", value: "suspended" },
      ] }),
    ],
  },
];

function buildClient(options?: RecordSubmitOptions) {
  return createCoreApiClient({
    baseUrl: options?.runtimeBaseUrl,
    accessToken: options?.accessToken,
    scope: {
      tenantId: options?.tenantId,
      orgId: options?.orgId,
    },
  });
}

export async function submitOrganizationCreation(values: Record<string, unknown>, options?: RecordSubmitOptions) {
  const client = buildClient(options);
  const created = await studioApi.createOrganization(client, mapOrganizationRecordToCreateRequest(values));

  const verified = await studioApi.getOrganization(client.withScope({ orgId: created.id }), created.id);
  return { created, verified };
}

export async function submitUserCreation(values: Record<string, unknown>, options?: RecordSubmitOptions) {
  const { actionMode, targetOrgId, payload } = mapUserRecordToCreateRequest(values, {
    fallbackOrgId: options?.orgId,
  });
  const client = buildClient({ ...options, orgId: targetOrgId || options?.orgId });

  if (actionMode === "invite_user" && !targetOrgId) {
    throw new Error("Target organization id is required for invite flow.");
  }

  if (actionMode === "admin_enroll") {
    if (!options?.tenantId) {
      throw new Error("Tenant id is required before admin enrollment.");
    }

    const bootstrapClient = createCoreApiClient({
      baseUrl: options.runtimeBaseUrl,
      scope: { tenantId: options.tenantId },
    });
    const tenantStatus = await bootstrapApi.getTenantStatus(bootstrapClient);
    const tenantWasBootstrapped = !tenantStatus.configured;

    if (tenantWasBootstrapped) {
      await bootstrapApi.bootstrapTenant(bootstrapClient, {
        tenant_id: options.tenantId,
        name: options.tenantId,
      });
    }

    const { payload: registerPayload } = mapUserRecordToAuthRegisterRequest(values, {
      tenantId: options?.tenantId,
    });
    registerPayload.org_id = null;

    if (registerPayload.password.length < 8) {
      throw new Error("Password must be at least 8 characters for admin enrollment.");
    }

    const registerResult = await authApi.register(client, registerPayload);
    const resultObject = registerResult as Record<string, unknown>;
    return {
      actionMode,
      createdUser: resultObject.user,
      createdMembership: null,
      verifiedUser: resultObject.user,
      auth: {
        access_token: typeof resultObject.access_token === "string" ? resultObject.access_token : "",
        refresh_token: typeof resultObject.refresh_token === "string" ? resultObject.refresh_token : "",
        expires_in: resultObject.expires_in,
        token_type: resultObject.token_type,
      },
      tenant: {
        id: options.tenantId,
        configured: true,
        bootstrapped: tenantWasBootstrapped,
      },
    };
  }

  const createdUser = await studioApi.createUser(client, payload);

  let createdMembership: unknown = null;
  const membershipPayload = mapUserRecordToMembershipRequest(values, {
    userId: createdUser.id,
    targetOrgId,
    actionMode,
  });
  if (membershipPayload) {
    createdMembership = await studioApi.createMembership(client, membershipPayload);
  }

  const verifiedUser = await studioApi.getUser(client, createdUser.id);
  return {
    actionMode,
    createdUser,
    createdMembership,
    verifiedUser,
    auth: null,
  };
}

export async function submitAgentPersonaRecord(values: Record<string, unknown>, options?: RecordSubmitOptions) {
  const client = buildClient(options);

  const runtimeProbe = await client.get<Record<string, unknown>>("/v1/health");
  const providerPayload = mapPersonaRecordToProviderPayload(values);
  return {
    runtimeProbe,
    personaRecord: mapPersonaRecordToDraft(values),
    systemPrompt: buildPersonaSystemPrompt(values),
    recommendedProviderPayload: providerPayload,
    note: "Persona endpoint not in v1 OpenAPI yet; payload generated for upcoming provider integration.",
  };
}

export async function submitTeamCreation(values: Record<string, unknown>, options?: RecordSubmitOptions) {
  const organizationId = asString(values.team_org_id);
  const teamName = asString(values.team_name).trim();
  if (!organizationId) {
    throw new Error("Organization ID is required for team creation.");
  }
  if (!teamName) {
    throw new Error("Team name is required.");
  }

  const client = buildClient({ ...options, orgId: organizationId });
  const organization = await studioApi.getOrganization(client, organizationId);

  const createdTeam = await studioApi.createTeam(client, {
    org_id: organizationId,
    name: teamName,
    slug: asString(values.team_slug) || undefined,
    description: asString(values.record_notes) || undefined,
  });

  const teams = readWorkspaceTeams();
  const created = {
    id: createdTeam.id,
    orgId: organizationId,
    name: createdTeam.name,
    slug: asString(values.team_slug),
    createdAt: new Date().toISOString(),
  };
  writeWorkspaceTeams([created, ...teams]);

  return {
    created,
    apiResponse: createdTeam,
    organization,
    note: "Team persisted via Studio API and mirrored in workspace scope store.",
  };
}

export async function submitStatusChecks(values: Record<string, unknown>, options?: RecordSubmitOptions) {
  const targetOrgId = asString(values.target_org_id, options?.orgId ?? "");
  const client = buildClient({ ...options, orgId: targetOrgId || options?.orgId });
  const result: Record<string, unknown> = {};

  if (asBoolean(values.check_org, true) && targetOrgId) {
    result.organization = await studioApi.getOrganization(client, targetOrgId);
  }

  if (asBoolean(values.check_user, true) && asString(values.target_user_id)) {
    result.user = await studioApi.getUser(client, asString(values.target_user_id));
  }

  if (asBoolean(values.patch_membership, false) && asString(values.target_membership_id)) {
    result.membership = await studioApi.patchMembership(client, asString(values.target_membership_id), {
      status: asString(values.patch_membership_status, "active"),
    });
  }

  if (asBoolean(values.check_runtime_status, false) && asString(values.session_id)) {
    result.runtimeStatus = await systemApi.getStatus(client, asString(values.session_id));
  }

  return result;
}

function createWizardFormProps(
  config: {
    title: string;
    description: string;
    steps: FormStepProps[];
    mode: string;
    submitLabel: string;
    storageKey: string;
    initialValues?: Record<string, unknown>;
  },
  options: {
    onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
    onValuesChange?: (values: Record<string, unknown>) => void;
  },
): FormProps {
  return {
    title: config.title,
    description: config.description,
    steps: config.steps,
    mode: config.mode,
    submitLabel: config.submitLabel,
    storageKey: config.storageKey,
    showValuesPreview: true,
    onSubmit: options.onSubmit,
    onValuesChange: options.onValuesChange,
    initialValues: config.initialValues,
  };
}

export function createOrganizationCreationWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
}): FormProps {
  return createWizardFormProps(
    {
      title: "Organization Creation Wizard",
      description: "Create and verify organization records using current Studio OpenAPI endpoints.",
      steps: organizationCreateSteps,
      mode: "organization",
      submitLabel: "Create organization",
      storageKey: "kairos.studio.wizard.organization-create.draft",
      initialValues: {
        org_mode: "team",
      },
    },
    options,
  );
}

export function createUserCreationWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}): FormProps {
  return createWizardFormProps(
    {
      title: "User Creation Wizard",
      description: "Enroll admin users now or issue invited user records for deferred account setup.",
      steps: userCreateSteps,
      mode: "user",
      submitLabel: "Create user record",
      storageKey: "kairos.studio.wizard.user-create.draft",
      initialValues: {
        user_action_mode: "invite_user",
        user_role: "member",
        membership_role: "member",
        membership_status: "active",
        create_membership: true,
        is_global_admin: false,
        ...(options.initialValues ?? {}),
      },
    },
    options,
  );
}

export function createAgentPersonaCreationWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
}): FormProps {
  return createWizardFormProps(
    {
      title: "Agent Persona Wizard",
      description: "Capture persona onboarding records until persona write endpoints are available.",
      steps: personaCreateSteps,
      mode: "persona",
      submitLabel: "Save persona record",
      storageKey: "kairos.studio.wizard.persona-create.draft",
      initialValues: {
        persona_scope: "organization",
        persona_enabled: true,
        persona_model_profile: "openai-default",
        persona_primary_goal: "Help users make confident decisions with clear and accurate guidance.",
        persona_traits: ["relaxed", "hand_hold", "out_of_sight"],
        persona_communication_style: "balanced",
        persona_response_depth: "standard",
        persona_initiative_level: "medium",
        persona_safety_mode: "balanced",
      },
    },
    options,
  );
}

export function createTeamCreationWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
  organizationOptions?: Array<{ label: string; value: string }>;
}): FormProps {
  const steps = teamCreateSteps.map((step) => {
    if (step.id !== "team_profile") return step;
    return {
      ...step,
      fields: step.fields.map((item) =>
        item.id === "team_org_id"
          ? {
              ...item,
              options: options.organizationOptions ?? [],
            }
          : item,
      ),
    };
  });

  return createWizardFormProps(
    {
      title: "Team Creation Wizard",
      description: "Create and validate team records under an organization.",
      steps,
      mode: "team",
      submitLabel: "Create team record",
      storageKey: "kairos.studio.wizard.team-create.draft",
      initialValues: {},
    },
    options,
  );
}

export function createStatusWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
}): FormProps {
  return createWizardFormProps(
    {
      title: "Status Wizard",
      description: "Validate org/user retrieval and membership/system status endpoints.",
      steps: statusSteps,
      mode: "status",
      submitLabel: "Run checks",
      storageKey: "kairos.studio.wizard.status.draft",
      initialValues: {
        check_org: true,
        check_user: true,
        check_runtime_status: false,
        patch_membership: false,
        patch_membership_status: "active",
      },
    },
    options,
  );
}

export function createProvisioningWizardFormProps(options: {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onValuesChange?: (values: Record<string, unknown>) => void;
}): FormProps {
  return createOrganizationCreationWizardFormProps(options);
}

export function FormWizard(formProps: FormProps) {
  const runtimeConfig = getRuntimeConfig();
  const tenantId = runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const defaultOrgId = runtimeConfig.orgId ?? "org-local";

  return (
    
    <div className="h-full">
        {RenderForm(formProps)}

        {/* Admin Only - Or Maintenance for debugging */}
        {/* <div className="space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Draft Values ({activeWizard})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
              {JSON.stringify(activeDraft, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saved Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 ? (
              <p className="text-xs text-zinc-500">No records saved yet.</p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="rounded-md border border-zinc-200 p-3">
                  <p className="mb-1 text-xs font-semibold text-zinc-700">{record.wizard}</p>
                  <p className="mb-2 text-xs text-zinc-500">{new Date(record.createdAt).toLocaleString()}</p>
                  {record.error ? (
                    <p className="mb-2 rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">{record.error}</p>
                  ) : null}
                  {record.result ? (
                    <pre className="mb-2 max-h-40 overflow-auto rounded bg-emerald-50 p-2 text-[11px] text-emerald-800">
                      {JSON.stringify(record.result, null, 2)}
                    </pre>
                  ) : null}
                  <pre className="max-h-56 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">
                    {JSON.stringify(record.values, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
