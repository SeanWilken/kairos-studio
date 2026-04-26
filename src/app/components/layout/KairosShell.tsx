import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Radio,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  User,
  Users,
  Wifi,
  WifiOff,
  Workflow,
  Wrench,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kairosstack/ui";
import { authApi, bootstrapApi, createCoreApiClient, healthApi, studioApi } from "../../../lib/api";
import { clearAuthSession, getAccessToken } from "../../../lib/auth-session";
import { getCreateQueueState, setCreateQueuePaused, subscribeCreateQueue } from "../../../lib/create-request-queue";
import { buildWorkspaceNotifications, type WorkspaceHealthLevel } from "../../../lib/workspace-notifications";
import {
  getWorkspaceScope,
  readWorkspaceTeams,
  setWorkspaceScope,
  subscribeWorkspaceScope,
  subscribeWorkspaceTeams,
  type TeamRecord,
  type WorkspaceScope,
} from "../../../lib/workspace-scope";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Organization", href: "/organization", icon: Building2 },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Knowledge", href: "/knowledge", icon: Database },
  { name: "Audit", href: "/audit", icon: FileText },
  { name: "Realtime", href: "/realtime", icon: Radio },
];

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) {
    return ((value as { items: T[] }).items ?? []) as T[];
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function statusChip(level: WorkspaceHealthLevel): { label: string; className: string } {
  if (level === "critical") return { label: "Core Issues", className: "bg-red-50 border-red-200 text-red-900" };
  if (level === "warning") return { label: "Core Degraded", className: "bg-amber-50 border-amber-200 text-amber-900" };
  return { label: "Core Connected", className: "bg-green-50 border-green-200 text-green-900" };
}

export function KairosShell() {
  const navigate = useNavigate();
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
  const accessToken = getAccessToken();

  const [queuePaused, setQueuePausedState] = useState(() => getCreateQueueState().paused);
  const [scope, setScope] = useState<WorkspaceScope>(() => getWorkspaceScope(tenantId));
  const [teams, setTeams] = useState<TeamRecord[]>(() => readWorkspaceTeams());

  useEffect(() => subscribeCreateQueue((next) => setQueuePausedState(next.paused)), []);
  useEffect(() => subscribeWorkspaceScope(setScope, tenantId), [tenantId]);
  useEffect(() => subscribeWorkspaceTeams(setTeams), []);

  const scopeOrgId = scope.type === "organization" ? scope.id : scope.type === "team" ? scope.orgId : undefined;

  const client = useMemo(
    () =>
      createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId, orgId: scopeOrgId },
      }),
    [runtimeBaseUrl, accessToken, tenantId, scopeOrgId],
  );

  const workspaceQuery = useQuery({
    queryKey: ["shell", "workspace", tenantId, scope.type, scope.id, Boolean(accessToken)],
    queryFn: async () => {
      const [health, tenantStatus, organizationsResponse, usersResponse] = await Promise.all([
        healthApi.getHealth(client),
        bootstrapApi.getTenantStatus(client),
        accessToken ? studioApi.listOrganizations(client) : Promise.resolve({ items: [] }),
        accessToken ? studioApi.listUsers(client, { orgId: scopeOrgId }) : Promise.resolve({ items: [] }),
      ]);

      const organizations = normalizeList<{ id: string; name: string }>(organizationsResponse);
      const users = normalizeList<{ id: string }>(usersResponse);
      const failedJobs = getCreateQueueState().jobs.filter((job) => job.status === "failed").length;

      const healthItems = [
        { key: "core-api", label: "Core API", level: health ? "healthy" as const : "critical" as const, message: health ? "Healthy" : "Unavailable" },
      ];

      const setupIncompleteCount = [
        !tenantStatus.configured,
        !accessToken,
        users.length === 0,
        organizations.length === 0,
      ].filter(Boolean).length;

      const notifications = buildWorkspaceNotifications({
        healthItems,
        queueFailedCount: failedJobs,
        setupIncompleteCount,
        organizationsCount: organizations.length,
        usersCount: users.length,
      });

      return { organizations, users, notifications, healthLevel: healthItems[0].level };
    },
    refetchInterval: 60_000,
  });

  const meQuery = useQuery({
    queryKey: ["shell", "me", tenantId, Boolean(accessToken)],
    enabled: Boolean(accessToken),
    queryFn: async () => authApi.me(client),
    retry: false,
  });

  const status = statusChip(workspaceQuery.data?.healthLevel ?? "unknown");
  const notifications = workspaceQuery.data?.notifications ?? [];
  const organizations = workspaceQuery.data?.organizations ?? [];

  const workspaceLabel =
    scope.type === "tenant"
      ? `Tenant: ${scope.name}`
      : scope.type === "organization"
        ? `Org: ${scope.name}`
        : `Team: ${scope.name}`;

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-zinc-900">Kairos Studio</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-xs transition-colors hover:bg-zinc-50"
              >
                <Building2 className="h-4 w-4" />
                {workspaceLabel}
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem onSelect={() => setWorkspaceScope({ type: "tenant", id: tenantId, name: tenantId })}>
                <Building2 className="mr-2 h-4 w-4" />
                Tenant: {tenantId}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {organizations.map((organization) => (
                <DropdownMenuItem
                  key={`org-${organization.id}`}
                  onSelect={() => setWorkspaceScope({ type: "organization", id: organization.id, name: organization.name })}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Org: {organization.name}
                </DropdownMenuItem>
              ))}
              {teams.length > 0 ? <DropdownMenuSeparator /> : null}
              {teams.map((team) => {
                const orgName = organizations.find((org) => org.id === team.orgId)?.name ?? team.orgId;
                return (
                  <DropdownMenuItem
                    key={`team-${team.id}`}
                    onSelect={() => setWorkspaceScope({ type: "team", id: team.id, name: team.name, orgId: team.orgId })}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Team: {team.name} ({orgName})
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${status.className}`}>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">{status.label}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled>No active notifications</DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} onSelect={() => navigate(notification.href)}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{notification.title}</span>
                      <span className="text-xs text-zinc-600">{notification.detail}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200">
                  <User className="h-4 w-4 text-zinc-600" />
                </div>
                <span className="text-sm font-medium">
                  {typeof meQuery.data?.first_name === "string" ? `${meQuery.data.first_name} ${meQuery.data.last_name ?? ""}`.trim() : "User"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setCreateQueuePaused(!queuePaused);
                }}
              >
                {queuePaused ? <Wifi className="mr-2 h-4 w-4" /> : <WifiOff className="mr-2 h-4 w-4" />}
                {queuePaused ? "Disable Offline Mode" : "Enable Offline Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(event) => {
                  event.preventDefault();
                  clearAuthSession();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-zinc-200 bg-white">
          <nav className="space-y-1 p-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
