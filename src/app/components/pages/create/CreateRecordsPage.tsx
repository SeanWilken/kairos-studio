import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle } from "@kairosstack/ui";
import {
  FormWizard,
  createAgentPersonaCreationWizardFormProps,
  createOrganizationCreationWizardFormProps,
  createTeamCreationWizardFormProps,
  createUserCreationWizardFormProps,
  submitAgentPersonaRecord,
  submitOrganizationCreation,
  submitTeamCreation,
  submitUserCreation,
  type WizardVariant,
} from "../../wizard/registration/steps/TestForm";
import { bootstrapApi, createCoreApiClient, studioApi } from "../../../../lib/api";
import { clearAuthSession, getAccessToken } from "../../../../lib/auth-session";
import {
  enqueueCreateJob,
  getCreateQueueState,
  processCreateQueue,
  setCreateQueuePaused,
  subscribeCreateQueue,
  type CreateQueueJob,
} from "../../../../lib/create-request-queue";

type OnboardingRecord = {
  id: string;
  createdAt: string;
  wizard: WizardVariant;
  values: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
};

type HierarchyNode = {
  id: string;
  name: string;
  type: "tenant" | "organization";
  userCount: number;
  children?: HierarchyNode[];
};

type QueueViewState = ReturnType<typeof getCreateQueueState>;

function storageKeyForVariant(variant: WizardVariant): string {
  if (variant === "organization_create") return "kairos.studio.wizard.organization-create.records";
  if (variant === "user_create") return "kairos.studio.wizard.user-create.records";
  if (variant === "team_create") return "kairos.studio.wizard.team-create.records";
  if (variant === "persona_create") return "kairos.studio.wizard.persona-create.records";
  return "kairos.studio.wizard.records";
}

function readRecords(key: string): OnboardingRecord[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OnboardingRecord[]) : [];
  } catch {
    return [];
  }
}

function buildHierarchy(orgs: Array<{ id: string; name: string }>, users: Array<{ org_id?: string }>): HierarchyNode[] {
  const counts = users.reduce<Record<string, number>>((acc, user) => {
    if (!user.org_id) return acc;
    acc[user.org_id] = (acc[user.org_id] ?? 0) + 1;
    return acc;
  }, {});

  return [
    {
      id: "tenant-root",
      name: "Tenant",
      type: "tenant",
      userCount: users.length,
      children: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        type: "organization",
        userCount: counts[org.id] ?? 0,
      })),
    },
  ];
}

export function CreateRecordsPage({ variant }: { variant: WizardVariant }) {
  const navigate = useNavigate();
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const defaultOrgId = env.VITE_KAIROS_ORG_ID ?? "8a56c7f2-5506-46a3-ae3a-f8dfa36548e2";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [tenantBootstrapError, setTenantBootstrapError] = useState<string | null>(null);
  const [isBootstrappingTenant, setIsBootstrappingTenant] = useState(false);

  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});
  const [records, setRecords] = useState<OnboardingRecord[]>(() => readRecords(storageKeyForVariant(variant)));
  const [queueState, setQueueState] = useState<QueueViewState>(() => getCreateQueueState());
  const [detailsOpen, setDetailsOpen] = useState(false);

  const coreClient = useMemo(
    () =>
      createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId, orgId: defaultOrgId },
      }),
    [runtimeBaseUrl, tenantId, defaultOrgId, accessToken],
  );

  const snapshotQuery = useQuery({
    queryKey: ["create-records", "snapshot", tenantId, defaultOrgId],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const orgResponse = await studioApi.listOrganizations(coreClient);
      const organizations = Array.isArray((orgResponse as { items?: unknown }).items)
        ? ((orgResponse as { items: Array<{ id: string; name: string }> }).items ?? [])
        : Array.isArray(orgResponse)
          ? (orgResponse as Array<{ id: string; name: string }>)
          : [];

      const usersResponse = await studioApi.listUsers(coreClient);
      const users = Array.isArray((usersResponse as { items?: unknown }).items)
        ? ((usersResponse as { items: Array<{ org_id?: string }> }).items ?? [])
        : Array.isArray(usersResponse)
          ? (usersResponse as Array<{ org_id?: string }>)
          : [];

      return {
        organizations,
        users,
        hierarchy: buildHierarchy(organizations, users),
      };
    },
  });

  const tenantStatusQuery = useQuery({
    queryKey: ["create-records", "tenant-status", tenantId],
    enabled: variant === "user_create",
    queryFn: async () => {
      const bootstrapClient = createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        scope: { tenantId },
      });
      return bootstrapApi.getTenantStatus(bootstrapClient);
    },
    retry: false,
  });

  useEffect(() => subscribeCreateQueue(setQueueState), []);

  const appendRecord = (entry: Omit<OnboardingRecord, "id" | "createdAt">) => {
    setRecords((previous) => {
      const next: OnboardingRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      };
      const key = storageKeyForVariant(variant);
      const nextRecords = [next, ...previous].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(nextRecords));
      return nextRecords;
    });
  };

  const executeQueuedJob = async (job: CreateQueueJob) => {
    const options = {
      ...(job.options as Record<string, unknown>),
      tenantId,
      orgId: defaultOrgId,
      runtimeBaseUrl,
      accessToken: getAccessToken(),
    };

    const result =
      job.variant === "organization_create"
        ? await submitOrganizationCreation(job.values, options)
        : job.variant === "user_create"
          ? await submitUserCreation(job.values, options)
          : job.variant === "team_create"
            ? await submitTeamCreation(job.values, options)
          : await submitAgentPersonaRecord(job.values, options);

    if (
      job.variant === "user_create" &&
      result &&
      typeof result === "object" &&
      "auth" in result
    ) {
      const auth = (result as { auth?: { access_token?: string; refresh_token?: string } }).auth;
      if (auth?.access_token && auth?.refresh_token) {
        clearAuthSession();
        setAccessToken("");
        navigate("/login?bootstrap=complete", { replace: true });
      }
    }

    appendRecord({ wizard: job.variant as WizardVariant, values: job.values, result: result as Record<string, unknown> });
    await snapshotQuery.refetch();
    return result;
  };

  const drainQueue = async () => {
    await processCreateQueue(async (job) => {
      try {
        return await executeQueuedJob(job);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Submission failed.";
        appendRecord({ wizard: job.variant as WizardVariant, values: job.values, error: message });
        throw error;
      }
    });
  };

  useEffect(() => {
    const onOnline = () => {
      setCreateQueuePaused(false);
      void drainQueue();
    };

    window.addEventListener("online", onOnline);
    if (navigator.onLine) {
      void drainQueue();
    }

    return () => window.removeEventListener("online", onOnline);
  }, [variant, tenantId, defaultOrgId, runtimeBaseUrl]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (
      variant === "user_create" &&
      values.user_action_mode === "admin_enroll" &&
      tenantStatusQuery.data &&
      !tenantStatusQuery.data.configured
    ) {
      throw new Error("Tenant is not initialized yet. Initialize tenant first, then enroll global admin.");
    }

    const errorPolicy =
      typeof values.queue_error_policy === "string" && values.queue_error_policy === "continue"
        ? "continue"
        : "pause";

    const shouldQueueOnly = !navigator.onLine || queueState.paused;

    if (shouldQueueOnly) {
      enqueueCreateJob({
        variant,
        values,
        options: { tenantId, orgId: defaultOrgId, runtimeBaseUrl, accessToken },
        errorPolicy,
      });
      return;
    }

    try {
      const tempJob = {
        id: crypto.randomUUID(),
        variant,
        values,
        options: { tenantId, orgId: defaultOrgId, runtimeBaseUrl, accessToken },
        errorPolicy,
        status: "processing",
        attempts: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CreateQueueJob;

      await executeQueuedJob(tempJob);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed.";
      const isNetworkError =
        !navigator.onLine ||
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("network");

      if (isNetworkError) {
        enqueueCreateJob({
          variant,
          values,
          options: { tenantId, orgId: defaultOrgId, runtimeBaseUrl, accessToken },
          errorPolicy,
        });
        return;
      }

      throw error;
    }
  };

  const usersCount = snapshotQuery.isSuccess ? snapshotQuery.data.users.length : null;
  const needsGlobalAdmin = variant === "user_create"
    ? !accessToken || usersCount === 0
    : usersCount === 0;

  if (variant !== "user_create" && !accessToken) {
    return <Navigate to="/login" replace />;
  }

  const bootstrapTenant = async () => {
    setTenantBootstrapError(null);
    setIsBootstrappingTenant(true);
    try {
      const bootstrapClient = createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        scope: { tenantId },
      });
      await bootstrapApi.bootstrapTenant(bootstrapClient, {
        tenant_id: tenantId,
        name: tenantId,
      });
      await tenantStatusQuery.refetch();
    } catch (error) {
      setTenantBootstrapError(error instanceof Error ? error.message : "Tenant bootstrap failed.");
    } finally {
      setIsBootstrappingTenant(false);
    }
  };

  const formProps = useMemo(() => {
    if (variant === "organization_create") {
      return createOrganizationCreationWizardFormProps({
        onValuesChange: setDraftValues,
        onSubmit: handleSubmit,
      });
    }

    if (variant === "user_create") {
      return createUserCreationWizardFormProps({
        onValuesChange: setDraftValues,
        onSubmit: handleSubmit,
        initialValues: needsGlobalAdmin
          ? {
              user_action_mode: "admin_enroll",
              is_global_admin: true,
              user_role: "owner",
              create_membership: false,
            }
          : undefined,
      });
    }

    if (variant === "team_create") {
      const organizationOptions = (snapshotQuery.data?.organizations ?? []).map((organization) => ({
        label: organization.name,
        value: organization.id,
      }));

      return createTeamCreationWizardFormProps({
        onValuesChange: setDraftValues,
        onSubmit: handleSubmit,
        organizationOptions,
      });
    }

    return createAgentPersonaCreationWizardFormProps({
      onValuesChange: setDraftValues,
      onSubmit: handleSubmit,
    });
  }, [variant, needsGlobalAdmin]);

  return (
    <div className="h-full">
      {/* <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>
          More info
        </Button>
      </div> */}

      <div className="h-full overflow-hidden bg-white">
        {needsGlobalAdmin && variant !== "user_create" ? (
          <Alert className="m-4 border-amber-200 bg-amber-50">
            <AlertTitle>Global admin required first</AlertTitle>
            <AlertDescription>
              No users exist yet. Start with `/create/user` and complete admin enrollment before creating other entities.
            </AlertDescription>
          </Alert>
        ) : null}
        {needsGlobalAdmin && variant === "user_create" ? (
          <Alert className="m-4 border-sky-200 bg-sky-50">
            <AlertTitle>Step 1: Tenant + global admin bootstrap</AlertTitle>
            <AlertDescription>
              {tenantStatusQuery.isLoading
                ? "Checking tenant bootstrap status..."
                : tenantStatusQuery.data?.configured
                  ? "Tenant is initialized. Complete admin enrollment with Global admin enabled; org will be null for register."
                  : "Tenant is not initialized yet. Initialize tenant before admin enrollment."}
            </AlertDescription>
            {!tenantStatusQuery.isLoading && !tenantStatusQuery.data?.configured ? (
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded border border-sky-300 bg-white px-3 py-1 text-xs text-sky-700"
                  onClick={() => void bootstrapTenant()}
                  disabled={isBootstrappingTenant}
                >
                  {isBootstrappingTenant ? "Initializing tenant..." : "Initialize tenant"}
                </button>
                {tenantBootstrapError ? <p className="mt-2 text-xs text-red-700">{tenantBootstrapError}</p> : null}
              </div>
            ) : null}
          </Alert>
        ) : null}
        {variant === "team_create" && snapshotQuery.isSuccess && snapshotQuery.data.organizations.length === 0 ? (
          <Alert className="m-4 border-amber-200 bg-amber-50">
            <AlertTitle>Organization required first</AlertTitle>
            <AlertDescription>
              Create at least one organization before creating a team. Use `/create/organization` first.
            </AlertDescription>
          </Alert>
        ) : null}
        {FormWizard(formProps)}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Wizard Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-700">
            <div className="flex items-center justify-between">
              <span>Organizations</span>
              <Badge variant="outline">{snapshotQuery.data?.organizations.length ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Users</span>
              <Badge variant="outline">{snapshotQuery.data?.users.length ?? 0}</Badge>
            </div>
            <pre className="max-h-40 overflow-auto rounded bg-zinc-50 p-2 text-[11px]">
              {JSON.stringify(snapshotQuery.data?.hierarchy ?? [], null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Draft Values</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-60 overflow-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
              {JSON.stringify(draftValues, null, 2)}
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

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CreateOrganizationPage() {
  return <CreateRecordsPage variant="organization_create" />;
}

export function CreateUserPage() {
  return <CreateRecordsPage variant="user_create" />;
}

export function CreatePersonaPage() {
  return <CreateRecordsPage variant="persona_create" />;
}

export function CreateTeamPage() {
  return <CreateRecordsPage variant="team_create" />;
}
