import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock,
  Upload,
  UserPlus,
  Users,
  Workflow,
  Wrench,
  Radio,
} from "lucide-react";
import { Button, Progress } from "@myai-tech/myui";
import { bootstrapApi, createCoreApiClient, healthApi, studioApi, systemApi } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth-session";
import { getCreateQueueState, subscribeCreateQueue } from "../../../lib/create-request-queue";
import { buildWorkspaceNotifications, type WorkspaceHealthLevel } from "../../../lib/workspace-notifications";
import { getWorkspaceScope, subscribeWorkspaceScope, type WorkspaceScope } from "../../../lib/workspace-scope";
import { getRuntimeConfig } from "../../../config/runtime"
type HealthItem = {
  key: string;
  label: string;
  level: WorkspaceHealthLevel;
  message: string;
};

type SetupStep = {
  id: string;
  label: string;
  completed: boolean;
  timestamp?: string;
};

const CORE_FRONTEND_URL = (import.meta.env.VITE_MYAI_CORE_FRONTEND_URL as string | undefined) ?? "";
const COUNCIL_FRONTEND_URL = (import.meta.env.VITE_MYAI_COUNCIL_FRONTEND_URL as string | undefined) ?? "";

const runtimeConfig = getRuntimeConfig();
const tenantId = runtimeConfig.tenantId;
const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
const EXPLICIT_WS_URL = runtimeConfig.coreWsUrl ?? "";

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) {
    return ((value as { items: T[] }).items ?? []) as T[];
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function healthClassName(level: WorkspaceHealthLevel): string {
  if (level === "healthy") return "text-green-600";
  if (level === "warning") return "text-amber-600";
  if (level === "critical") return "text-red-600";
  return "text-zinc-500";
}

function dotClassName(level: WorkspaceHealthLevel): string {
  if (level === "healthy") return "bg-green-500";
  if (level === "warning") return "bg-amber-500";
  if (level === "critical") return "bg-red-500";
  return "bg-zinc-400";
}

function checkLevel(checks: Array<{ check_id?: string; status?: string }>, checkId: string): WorkspaceHealthLevel {
  const check = checks.find((item) => item.check_id === checkId);
  if (!check) return "unknown";
  if (check.status === "pass") return "healthy";
  if (check.status === "warn" || check.status === "pending") return "warning";
  if (check.status === "fail") return "critical";
  return "unknown";
}

function normalizeProbeUrl(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `http://${value}`;
}

async function probeFrontend(url: string): Promise<WorkspaceHealthLevel> {
  const normalizedUrl = normalizeProbeUrl(url);
  if (!normalizedUrl) return "unknown";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(normalizedUrl, { mode: "no-cors", signal: controller.signal });
    return "healthy";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timeout);
  }
}

async function probeWebSocket(baseUrl: string, accessToken: string): Promise<WorkspaceHealthLevel> {
  if (!accessToken) return "unknown";
  const wsBase = EXPLICIT_WS_URL || `${baseUrl.replace(/^http/i, "ws").replace(/\/$/, "")}/v1/realtime/ws`;
  const wsUrl = `${wsBase}?token=${encodeURIComponent(accessToken)}`;
  return new Promise((resolve) => {
    let settled = false;
    const socket = new WebSocket(wsUrl);
    const done = (level: WorkspaceHealthLevel) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // no-op
      }
      resolve(level);
    };

    const timer = setTimeout(() => done("warning"), 3000);
    socket.onopen = () => done("healthy");
    socket.onerror = () => done("critical");
  });
}

const quickActions = [
  { icon: UserPlus, label: "Invite User", description: "Add team members to your organization", href: "/create/user", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { icon: Users, label: "Create Persona", description: "Define a new agent persona with capabilities", href: "/create/persona", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  { icon: Wrench, label: "Add Tool", description: "Register a new tool integration", href: "/tools", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { icon: Workflow, label: "New Workflow", description: "Build a multi-agent workflow", href: "/workflows", iconBg: "bg-green-50", iconColor: "text-green-600" },
  { icon: Upload, label: "Upload Docs", description: "Add documents to knowledge base", href: "/knowledge", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { icon: Radio, label: "Realtime Test", description: "Open websocket chat test lab", href: "/realtime", iconBg: "bg-rose-50", iconColor: "text-rose-600" },
];

export function WorkspaceHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setupRef = useRef<HTMLDivElement | null>(null);
  const accessToken = getAccessToken();

  const [queueState, setQueueState] = useState(() => getCreateQueueState());
  const [scope, setScope] = useState<WorkspaceScope>(() => getWorkspaceScope(tenantId));

  useEffect(() => subscribeCreateQueue(setQueueState), []);
  useEffect(() => subscribeWorkspaceScope(setScope, tenantId), [tenantId]);

  const scopeOrgId = scope.type === "organization" ? scope.id : scope.type === "team" ? scope.orgId : undefined;

  const workspaceQuery = useQuery({
    queryKey: ["workspace", "overview", tenantId, scope.type, scope.id, scopeOrgId, Boolean(accessToken)],
    queryFn: async () => {
      const publicClient = createCoreApiClient({ baseUrl: runtimeBaseUrl, scope: { tenantId } });
      const scopedClient = createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId, orgId: scopeOrgId },
      });

      const [health, tenantStatus, latestSession, organizationsResponse, usersResponse, coreFrontendStatus, councilFrontendStatus, webSocketStatus] = await Promise.all([
        healthApi.getHealth(publicClient),
        bootstrapApi.getTenantStatus(publicClient),
        bootstrapApi.listSessions(publicClient, { latest: true }),
        accessToken ? studioApi.listOrganizations(scopedClient) : Promise.resolve({ items: [] }),
        accessToken ? studioApi.listUsers(scopedClient, { orgId: scopeOrgId }) : Promise.resolve({ items: [] }),
        probeFrontend(CORE_FRONTEND_URL),
        probeFrontend(COUNCIL_FRONTEND_URL),
        probeWebSocket(publicClient.baseUrl, accessToken),
      ]);

      const organizations = normalizeList<{ id: string; name: string; created_at?: string }>(organizationsResponse);
      const users = normalizeList<{ id: string; created_at?: string }>(usersResponse);

      let sessionId = "";
      if (Array.isArray(latestSession) && latestSession.length > 0) {
        sessionId = typeof latestSession[0]?.session_id === "string" ? latestSession[0].session_id : "";
      } else if (latestSession && typeof latestSession === "object") {
        sessionId = typeof (latestSession as { session_id?: string }).session_id === "string"
          ? (latestSession as { session_id?: string }).session_id ?? ""
          : "";
      }

      let checks: Array<{ check_id?: string; status?: string }> = [];
      if (sessionId) {
        const runtimeStatus = await systemApi.getStatus(publicClient, sessionId);
        checks = Array.isArray(runtimeStatus.checks) ? runtimeStatus.checks : [];
      }

      const postgresLevel = checkLevel(checks, "postgres_reachable");
      const inferredPostgresLevel: WorkspaceHealthLevel =
        postgresLevel === "unknown" && users.length >= 0 && organizations.length >= 0 && Boolean(accessToken)
          ? "healthy"
          : postgresLevel;

      const healthItems: HealthItem[] = [
        {
          key: "core-api",
          label: "Core API Health",
          level: health ? "healthy" : "critical",
          message: health ? "Healthy" : "Unavailable",
        },
        {
          key: "postgres",
          label: "PostgreSQL",
          level: inferredPostgresLevel,
          message:
            inferredPostgresLevel === "healthy"
              ? "Connected"
              : inferredPostgresLevel === "warning"
                ? "Check pending"
                : inferredPostgresLevel === "critical"
                  ? "Connection issue"
                  : "No runtime check data",
        },
        {
          key: "providers",
          label: "Provider Connectivity",
          level: checkLevel(checks, "provider_connectivity"),
          message:
            checkLevel(checks, "provider_connectivity") === "healthy"
              ? "Reachable"
              : checkLevel(checks, "provider_connectivity") === "unknown"
                ? "No runtime check data"
                : "Not ready",
        },
        {
          key: "frontend-core",
          label: "Core Frontend",
          level: coreFrontendStatus,
          message:
            coreFrontendStatus === "healthy"
              ? "Reachable"
              : coreFrontendStatus === "unknown"
                ? "Unable to verify from browser"
                : "Unavailable",
        },
        {
          key: "frontend-council",
          label: "Council Frontend",
          level: councilFrontendStatus,
          message:
            councilFrontendStatus === "healthy"
              ? "Reachable"
              : councilFrontendStatus === "unknown"
                ? "Unable to verify from browser"
                : "Unavailable",
        },
        {
          key: "websocket",
          label: "Realtime WebSocket",
          level: webSocketStatus,
          message:
            webSocketStatus === "healthy"
              ? "Connected"
              : webSocketStatus === "warning"
                ? "Handshake timeout"
                : webSocketStatus === "critical"
                  ? "Connection failed"
                  : "Requires login token",
        },
      ];

      const setupSteps: SetupStep[] = [
        {
          id: "tenant",
          label: "Tenant initialized",
          completed: Boolean(tenantStatus.configured),
        },
        {
          id: "auth",
          label: "Authenticated session active",
          completed: Boolean(accessToken),
        },
        {
          id: "user",
          label: "At least one user exists",
          completed: users.length > 0,
          timestamp: users[0]?.created_at,
        },
        {
          id: "organization",
          label: "At least one organization exists",
          completed: organizations.length > 0,
          timestamp: organizations[0]?.created_at,
        },
        {
          id: "realtime",
          label: "Realtime connectivity available",
          completed: webSocketStatus === "healthy",
        },
      ];

      const setupIncompleteCount = setupSteps.filter((step) => !step.completed).length;
      const notifications = buildWorkspaceNotifications({
        healthItems,
        queueFailedCount: queueState.jobs.filter((job) => job.status === "failed").length,
        setupIncompleteCount,
        organizationsCount: organizations.length,
        usersCount: users.length,
      });

      return {
        checkedAt: new Date().toISOString(),
        healthItems,
        setupSteps,
        notifications,
        organizationsCount: organizations.length,
        usersCount: users.length,
        queueFailedCount: queueState.jobs.filter((job) => job.status === "failed").length,
      };
    },
    refetchInterval: 60_000,
  });

  const workspace = workspaceQuery.data;
  const topLevelHealth: WorkspaceHealthLevel = workspace?.healthItems.some((item) => item.level === "critical")
    ? "critical"
    : workspace?.healthItems.some((item) => item.level === "warning")
      ? "warning"
      : "healthy";

  const completedSteps = workspace?.setupSteps.filter((step) => step.completed).length ?? 0;
  const totalSteps = workspace?.setupSteps.length ?? 0;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const setupComplete = Boolean(totalSteps > 0 && completedSteps === totalSteps);

  useEffect(() => {
    if (searchParams.get("focus") !== "setup") return;
    setupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Workspace Overview</h1>
        <p className="mt-1 text-zinc-600">Live status, setup progress, and actionable alerts.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div ref={setupRef} className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Core Status</h2>
              <p className="text-sm text-zinc-600">System health and connectivity</p>
            </div>
            <div className={`h-3 w-3 rounded-full ${dotClassName(topLevelHealth)}`} />
          </div>

          <div className="space-y-3">
            {workspace?.healthItems.map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-2 ${index < workspace.healthItems.length - 1 ? "border-b" : ""}`}
              >
                <span className="text-sm text-zinc-700">{item.label}</span>
                <span className={`text-sm font-medium ${healthClassName(item.level)}`}>{item.message}</span>
              </div>
            ))}

            {!workspace && !workspaceQuery.isError ? <div className="py-3 text-sm text-zinc-500">Loading health checks...</div> : null}
            {workspaceQuery.isError ? <div className="py-3 text-sm text-red-600">Unable to load workspace health.</div> : null}
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Last health check</span>
              <span className="font-medium text-zinc-900">{workspace?.checkedAt ? new Date(workspace.checkedAt).toLocaleTimeString() : "-"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          {setupComplete ? (
            <>
              <h2 className="mb-1 text-lg font-semibold text-zinc-900">Workspace Signals</h2>
              <p className="mb-4 text-sm text-zinc-600">Setup completed. Monitoring live operational metrics.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-zinc-500">Organizations</p>
                  <p className="text-xl font-semibold text-zinc-900">{workspace?.organizationsCount ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-zinc-500">Users</p>
                  <p className="text-xl font-semibold text-zinc-900">{workspace?.usersCount ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-zinc-500">Failed Queue Jobs</p>
                  <p className="text-xl font-semibold text-zinc-900">{workspace?.queueFailedCount ?? 0}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-zinc-500">Status</p>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <BarChart3 className="h-4 w-4" />
                    Stable
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => navigate("/audit?tab=queue")}>
                  Open Offline Queue
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-semibold text-zinc-900">Setup Progress</h2>
              <p className="mb-4 text-sm text-zinc-600">Track real onboarding completion from API state.</p>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">{completedSteps} of {totalSteps} completed</span>
                  <span className="text-sm font-medium text-zinc-900">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="space-y-3">
                {workspace?.setupSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${step.completed ? "text-zinc-900" : "text-zinc-500"}`}>{step.label}</p>
                      {step.timestamp ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Needs Attention</h2>
        <div className="space-y-3">
          {(workspace?.notifications ?? []).length === 0 ? (
            <div className="rounded-lg border bg-white p-4 text-sm text-zinc-600">No active alerts.</div>
          ) : (
            workspace?.notifications.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-4 rounded-lg border bg-white p-4 ${
                  alert.level === "critical"
                    ? "border-l-4 border-l-red-500"
                    : alert.level === "warning"
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-blue-500"
                }`}
              >
                {alert.level === "critical" || alert.level === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900">{alert.title}</h3>
                  <p className="mt-0.5 text-sm text-zinc-600">{alert.detail}</p>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => navigate(alert.href)}>
                  {alert.actionLabel}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.href)}
              className="group rounded-lg border bg-white p-5 text-left transition-all hover:border-zinc-400 hover:shadow-sm"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${action.iconBg}`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">{action.label}</h3>
              <p className="text-xs leading-relaxed text-zinc-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
