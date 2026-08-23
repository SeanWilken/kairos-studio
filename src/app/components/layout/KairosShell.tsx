import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Radio,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
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
} from "@myai-tech/myui";
import { authApi, bootstrapApi, createCoreApiClient, healthApi, studioApi } from "../../../lib/api";
import { clearAuthSession, getAccessToken, saveAuthSession, subscribeAuthSession } from "../../../lib/auth-session";
import { getCreateQueueState, setCreateQueuePaused, subscribeCreateQueue } from "../../../lib/create-request-queue";
import { queryClient } from "../../../lib/query-client";
import { constrainWorkspaceScope, readAuthorizedContext } from "../../../lib/auth-context";
import { getRuntimeConfig } from "../../../config/runtime";
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

const SIDEBAR_COLLAPSED_KEY = "kairos.studio.nav.collapsed";

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) {
    return ((value as { items: T[] }).items ?? []) as T[];
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function dedupeOrganizations(organizations: Array<{ id: string; name: string }>): Array<{ id: string; name: string }> {
  const unique = new Map<string, { id: string; name: string }>();
  organizations.forEach((organization) => {
    if (!organization.id || unique.has(organization.id)) return;
    unique.set(organization.id, organization);
  });
  return [...unique.values()];
}

function statusChip(level: WorkspaceHealthLevel): { label: string; className: string } {
  if (level === "critical") return { label: "Core Issues", className: "bg-red-50 border-red-200 text-red-900" };
  if (level === "warning") return { label: "Core Degraded", className: "bg-amber-50 border-amber-200 text-amber-900" };
  return { label: "Core Connected", className: "bg-green-50 border-green-200 text-green-900" };
}

export function KairosShell() {
  const navigate = useNavigate();
  const runtimeConfig = getRuntimeConfig();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const authorizedContext = readAuthorizedContext(accessToken);
  const tenantId = authorizedContext.tenantId ?? runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;

  const [queuePaused, setQueuePausedState] = useState(() => getCreateQueueState().paused);
  const [scope, setScope] = useState<WorkspaceScope>(() => constrainWorkspaceScope(accessToken, tenantId, getWorkspaceScope(tenantId)));
  const [teams, setTeams] = useState<TeamRecord[]>(() => readWorkspaceTeams());
  const [navCollapsed, setNavCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  const previousContextRef = useRef("");
  const hadAuthenticatedSessionRef = useRef(Boolean(accessToken));

  useEffect(() => subscribeCreateQueue((next) => setQueuePausedState(next.paused)), []);
  useEffect(() => subscribeWorkspaceScope(setScope, tenantId), [tenantId]);
  useEffect(() => subscribeWorkspaceTeams(setTeams), []);
  useEffect(() => subscribeAuthSession(() => setAccessToken(getAccessToken())), []);

  useEffect(() => {
    const constrained = constrainWorkspaceScope(accessToken, tenantId, scope);
    if (constrained.type === scope.type && constrained.id === scope.id && constrained.orgId === scope.orgId) return;
    setWorkspaceScope(constrained);
  }, [accessToken, scope, tenantId]);

  useEffect(() => {
    if (accessToken) {
      hadAuthenticatedSessionRef.current = true;
      return;
    }
    if (!hadAuthenticatedSessionRef.current) return;
    queryClient.clear();
    setWorkspaceScope({ type: "tenant", id: tenantId, name: tenantId });
    navigate("/login", { replace: true });
  }, [accessToken, navigate, tenantId]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, navCollapsed ? "true" : "false");
  }, [navCollapsed]);

  const scopeOrgId = scope.type === "organization" ? scope.id : scope.type === "team" ? scope.orgId : undefined;

  useEffect(() => {
    const contextKey = `${accessToken}:${scope.type}:${scopeOrgId ?? scope.id}`;
    if (!previousContextRef.current) {
      previousContextRef.current = contextKey;
      return;
    }
    if (previousContextRef.current === contextKey) return;
    previousContextRef.current = contextKey;
    void queryClient.invalidateQueries();
  }, [accessToken, scope.id, scope.type, scopeOrgId]);

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
      const [health, tenantStatus, organizationsResponse, usersResponse, currentUser] = await Promise.all([
        healthApi.getHealth(client),
        bootstrapApi.getTenantStatus(client),
        accessToken ? studioApi.listOrganizations(client) : Promise.resolve({ items: [] }),
        accessToken ? studioApi.listUsers(client, { orgId: scopeOrgId }) : Promise.resolve({ items: [] }),
        accessToken ? authApi.me(client).catch(() => null) : Promise.resolve(null),
      ]);

      const organizations = normalizeList<{ id: string; name: string }>(organizationsResponse);
      const users = normalizeList<{ id: string }>(usersResponse);
      const currentUserOrganizations = Array.isArray(currentUser?.org_options) ? currentUser.org_options : [];
      const organizationsCount = Math.max(organizations.length, currentUserOrganizations.length);
      const usersCount = Math.max(users.length, currentUser ? 1 : 0);
      const failedJobs = getCreateQueueState().jobs.filter((job) => job.status === "failed").length;

      const healthItems = [
        { key: "core-api", label: "Core API", level: health ? "healthy" as const : "critical" as const, message: health ? "Healthy" : "Unavailable" },
      ];

      const setupIncompleteCount = [
        !tenantStatus.configured,
        !currentUser,
        organizationsCount === 0,
      ].filter(Boolean).length;

      const notifications = buildWorkspaceNotifications({
        healthItems,
        queueFailedCount: failedJobs,
        setupIncompleteCount,
        organizationsCount,
        usersCount,
      });

      return { organizations, users, notifications, healthLevel: healthItems[0].level };
    },
    refetchInterval: 60_000,
  });

  const meQuery = useQuery({
    queryKey: ["shell", "me", tenantId, scopeOrgId, Boolean(accessToken)],
    enabled: Boolean(accessToken),
    queryFn: async () => authApi.me(client),
    retry: false,
  });

  const switchOrgMutation = useMutation({
    mutationFn: async (organization: { id: string; name: string }) => {
      const response = await authApi.switchContext(client, { org_id: organization.id });
      const tokenSet = response as { access_token?: string; refresh_token?: string; expires_in?: number };
      if (!tokenSet.access_token || !tokenSet.refresh_token) {
        throw new Error("Context switch succeeded but token payload was missing.");
      }
      const switchedContext = readAuthorizedContext(tokenSet.access_token);
      if (switchedContext.orgId !== organization.id) {
        throw new Error("Context switch returned a token for a different organization.");
      }
      saveAuthSession({
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        accessTokenExpiresAt: typeof tokenSet.expires_in === "number" ? Date.now() + tokenSet.expires_in * 1000 : undefined,
      });
      setWorkspaceScope({ type: "organization", id: switchedContext.orgId, name: organization.name });
    },
  });

  const status = statusChip(workspaceQuery.data?.healthLevel ?? "unknown");
  const notifications = workspaceQuery.data?.notifications ?? [];
  const organizationsFromWorkspace = workspaceQuery.data?.organizations ?? [];
  const organizationsFromMe = Array.isArray(meQuery.data?.org_options)
    ? meQuery.data.org_options
        .filter((option): option is { org_id: string; name?: string } => typeof option?.org_id === "string")
        .map((option) => ({ id: option.org_id, name: option.name ?? option.org_id }))
    : [];
  const organizations = dedupeOrganizations(organizationsFromMe.length > 0 ? organizationsFromMe : organizationsFromWorkspace);

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
          <div className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <img src="/myAI.svg" alt="myAI" className="h-7 w-7 shrink-0" />
            <span>Studio</span>
          </div>

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
              {!authorizedContext.orgId ? (
                <DropdownMenuItem disabled>
                  <Building2 className="mr-2 h-4 w-4" />
                  Tenant: {tenantId}
                </DropdownMenuItem>
              ) : null}
              {organizations.map((organization) => (
                <DropdownMenuItem
                  key={`org-${organization.id}`}
                  onSelect={(event) => {
                    event.preventDefault();
                    void switchOrgMutation.mutateAsync(organization);
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Org: {organization.name}
                </DropdownMenuItem>
              ))}
              {teams.length > 0 ? <DropdownMenuSeparator /> : null}
              {teams.filter((team) => team.orgId === authorizedContext.orgId).map((team) => {
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
                  {typeof meQuery.data?.user?.first_name === "string"
                    ? `${meQuery.data.user.first_name} ${meQuery.data.user.last_name ?? ""}`.trim()
                    : "User"}
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
                  queryClient.clear();
                  setWorkspaceScope({ type: "tenant", id: tenantId, name: tenantId });
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
        <aside className={`${navCollapsed ? "w-16" : "w-64"} flex-shrink-0 overflow-y-auto border-r border-zinc-200 bg-white transition-all`}>
          <nav className="space-y-1 p-4">
            <div className={`mb-2 flex ${navCollapsed ? "justify-center" : "justify-end"}`}>
              <Button
                variant="outline"
                size="icon"
                aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={() => setNavCollapsed((current) => !current)}
              >
                {navCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center ${navCollapsed ? "justify-center" : "gap-3"} rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
                title={item.name}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {navCollapsed ? null : <span>{item.name}</span>}
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
