import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, ChevronRight, Clock, Search, UserPlus, Users } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@myai-tech/myui";
import { createCoreApiClient, governanceApi, studioApi, type AppAccessGrantApps, type OrgKnowledgePolicy, type StudioOrganization, type StudioUser } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth-session";
import { readWorkspaceTeams, type TeamRecord } from "../../../lib/workspace-scope";
import { getRuntimeConfig } from "../../../config/runtime"

type HierarchyNode = {
  id: string;
  name: string;
  type: "tenant" | "organization" | "team";
  userCount: number;
  children?: HierarchyNode[];
};

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) {
    return ((value as { items: T[] }).items ?? []) as T[];
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildHierarchy(
  tenantName: string,
  organizations: StudioOrganization[],
  users: StudioUser[],
  teams: TeamRecord[],
): HierarchyNode {
  const usersByOrg = users.reduce<Record<string, number>>((acc, user) => {
    if (!user.org_id) return acc;
    acc[user.org_id] = (acc[user.org_id] ?? 0) + 1;
    return acc;
  }, {});

  return {
    id: "tenant-root",
    name: tenantName,
    type: "tenant",
    userCount: users.length,
    children: organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      type: "organization",
      userCount: usersByOrg[organization.id] ?? 0,
      children: teams
        .filter((team) => team.orgId === organization.id)
        .map((team) => ({
          id: team.id,
          name: team.name,
          type: "team",
          userCount: 0,
        })),
    })),
  };
}

function hierarchyIcon(type: HierarchyNode["type"]) {
  if (type === "tenant") return <Building2 className="h-4 w-4 text-indigo-600" />;
  if (type === "organization") return <Building2 className="h-4 w-4 text-blue-600" />;
  return <Users className="h-4 w-4 text-emerald-600" />;
}

const defaultPolicy: OrgKnowledgePolicy = {
  default_visibility_scope: "org",
  acl_policy_id: "org-default-v1",
  allow_private_creators: ["owner", "admin", "member"],
  allow_restricted_creators: ["owner", "admin"],
  allow_uploaders: ["owner", "admin", "member"],
  allow_team_sharing: true,
  allow_group_sharing: true,
  require_membership_for_team_group: true,
  sensitivity_tags: ["internal"],
};

const defaultGrants: AppAccessGrantApps = {
  knowledger: false,
  council: false,
  myaide: false,
};

function OrgTreeNode({ node, level = 0 }: { node: HierarchyNode; level?: number }) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-100"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => setExpanded((current) => !current)}
      >
        {hasChildren ? (
          <button type="button" className="p-0.5">
            {expanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        {hierarchyIcon(node.type)}
        <span className="flex-1 text-sm font-medium text-zinc-900">{node.name}</span>
        <Badge variant="outline" className="text-[11px]">
          {node.userCount} users
        </Badge>
      </div>
      {expanded && hasChildren ? (
        <div>
          {node.children?.map((child) => (
            <OrgTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Organization() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [teams] = useState<TeamRecord[]>(() => readWorkspaceTeams());
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [policyDraft, setPolicyDraft] = useState<OrgKnowledgePolicy>(defaultPolicy);
  const [grantsDraft, setGrantsDraft] = useState<AppAccessGrantApps>(defaultGrants);
  const [policyError, setPolicyError] = useState("");
  const [explainPrincipalId, setExplainPrincipalId] = useState("");
  const [explainPrincipalKind, setExplainPrincipalKind] = useState<"user" | "agent">("user");
  const [explainLens, setExplainLens] = useState("knowledge.resolve");
  const [explainIncludeIds, setExplainIncludeIds] = useState("");
  const [explainExcludeIds, setExplainExcludeIds] = useState("");

  const runtimeConfig = getRuntimeConfig();
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const tenantId = runtimeConfig.tenantId;
  const accessToken = getAccessToken();

  const client = useMemo(
    () =>
      createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId },
      }),
    [runtimeBaseUrl, accessToken, tenantId],
  );

  const organizationsQuery = useQuery({
    queryKey: ["organization-page", "organizations", tenantId],
    enabled: Boolean(accessToken),
    queryFn: async () => normalizeList<StudioOrganization>(await studioApi.listOrganizations(client)),
  });

  const usersQuery = useQuery({
    queryKey: ["organization-page", "users", tenantId],
    enabled: Boolean(accessToken),
    queryFn: async () => normalizeList<StudioUser>(await studioApi.listUsers(client)),
  });

  const organizations = organizationsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const selectedOrgValue = organizations.some((organization) => organization.id === selectedOrgId)
    ? selectedOrgId
    : undefined;
  const selectedOrgLabel = organizations.find((organization) => organization.id === selectedOrgValue)?.name;

  useEffect(() => {
    if (!organizations.length) return;
    if (!selectedOrgId || !organizations.some((organization) => organization.id === selectedOrgId)) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const policyQuery = useQuery({
    queryKey: ["organization-page", "settings", selectedOrgId],
    enabled: Boolean(accessToken && selectedOrgId),
    queryFn: async () => governanceApi.getSettings(client, selectedOrgId),
    retry: false,
  });

  const grantsQuery = useQuery({
    queryKey: ["organization-page", "app-grants", selectedOrgId],
    enabled: Boolean(accessToken && selectedOrgId),
    queryFn: async () => governanceApi.listAppAccessGrants(client, selectedOrgId),
    retry: false,
  });

  const baselineQuery = useQuery({
    queryKey: ["organization-page", "governance-baseline"],
    enabled: Boolean(accessToken),
    queryFn: async () => governanceApi.getBaseline(client),
    retry: false,
  });

  useEffect(() => {
    if (!selectedOrgId) return;
    if (policyQuery.data?.knowledge_policy) {
      const data = policyQuery.data.knowledge_policy;
      setPolicyDraft({
        default_visibility_scope: data.default_visibility_scope ?? defaultPolicy.default_visibility_scope,
        acl_policy_id: data.acl_policy_id ?? defaultPolicy.acl_policy_id,
        allow_private_creators: data.allow_private_creators ?? defaultPolicy.allow_private_creators,
        allow_restricted_creators: data.allow_restricted_creators ?? defaultPolicy.allow_restricted_creators,
        allow_uploaders: data.allow_uploaders ?? defaultPolicy.allow_uploaders,
        allow_team_sharing: data.allow_team_sharing ?? defaultPolicy.allow_team_sharing,
        allow_group_sharing: data.allow_group_sharing ?? defaultPolicy.allow_group_sharing,
        require_membership_for_team_group: data.require_membership_for_team_group ?? defaultPolicy.require_membership_for_team_group,
        sensitivity_tags: data.sensitivity_tags ?? defaultPolicy.sensitivity_tags,
      });
    } else if (policyQuery.isError) {
      setPolicyDraft(defaultPolicy);
    }
  }, [policyQuery.data, policyQuery.isError, selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) return;
    if (grantsQuery.data?.items) {
      const roleTemplateGrant = grantsQuery.data.items.find((item) => item.principal_kind === "role_template" && item.principal_id === "member") ?? grantsQuery.data.items[0];
      setGrantsDraft({
        knowledger: Boolean(roleTemplateGrant?.apps.knowledger),
        council: Boolean(roleTemplateGrant?.apps.council),
        myaide: Boolean(roleTemplateGrant?.apps.myaide),
      });
    } else if (grantsQuery.isError) {
      setGrantsDraft(defaultGrants);
    }
  }, [grantsQuery.data, grantsQuery.isError, selectedOrgId]);

  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId) throw new Error("Select an organization first.");
      return governanceApi.patchSettings(client, selectedOrgId, policyDraft);
    },
    onSuccess: async () => {
      setPolicyError("");
      await policyQuery.refetch();
    },
    onError: (error) => setPolicyError(error instanceof Error ? error.message : "Failed to save policy."),
  });

  const saveGrantsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId) throw new Error("Select an organization first.");
      return governanceApi.upsertAppAccessGrant(client, {
        org_id: selectedOrgId,
        principal_kind: "role_template",
        principal_id: "member",
        apps: grantsDraft,
      });
    },
    onSuccess: async () => {
      setPolicyError("");
      await grantsQuery.refetch();
    },
    onError: (error) => setPolicyError(error instanceof Error ? error.message : "Failed to save app grants."),
  });

  const explainMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId) throw new Error("Select an organization first.");
      return governanceApi.explainContextAccess(client, {
        org_id: selectedOrgId,
        principal_id: explainPrincipalId,
        principal_kind: explainPrincipalKind,
        lens: explainLens || undefined,
        include_ids: explainIncludeIds.split(",").map((item) => item.trim()).filter(Boolean),
        exclude_ids: explainExcludeIds.split(",").map((item) => item.trim()).filter(Boolean),
      });
    },
    onError: (error) => setPolicyError(error instanceof Error ? error.message : "Explain access failed."),
  });
  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((organization) => map.set(organization.id, organization.name));
    return map;
  }, [organizations]);

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim().toLowerCase();
    return fullName.includes(term) || user.email.toLowerCase().includes(term);
  });

  const hierarchy = useMemo(
    () => buildHierarchy(tenantId, organizations, users, teams),
    [tenantId, organizations, users, teams],
  );


  if (!accessToken) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>Sign in first to manage organizations and hierarchy.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Organization & Access</h1>
        <p className="mt-1 text-zinc-600">Live data from Studio API for organizations and users.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="governance">Policy Templates (Live)</TabsTrigger>
          <TabsTrigger value="debug">Explain Access (Live)</TabsTrigger>
          <TabsTrigger value="audit">Audit Log (Scaffold)</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/create/user")}> 
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Directory ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown";
                    const scope = user.is_global_admin ? "Tenant" : orgNameById.get(user.org_id ?? "") ?? "Unassigned";
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-zinc-900">{fullName}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role ?? "member"}</Badge>
                        </TableCell>
                        <TableCell>{scope}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status ?? "unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                            <Clock className="h-3.5 w-3.5" />
                            {user.created_at ? new Date(user.created_at).toLocaleString() : "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {usersQuery.isLoading ? <p className="pt-3 text-xs text-zinc-500">Loading users...</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Structure</CardTitle>
              <p className="text-sm text-zinc-600">Tenant -&gt; Organizations -&gt; Teams hierarchy.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-zinc-200 p-3">
                <p className="mb-3 text-sm font-medium text-zinc-900">Create Routes</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/create/organization")}>Add Organization</Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/create/team")}>Add Team</Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/create/user")}>Invite User</Button>
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 p-2">
                <OrgTreeNode node={hierarchy} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              Audit events are not wired to a backend endpoint in this view yet. This tab is intentionally scaffold-only until Core audit APIs are finalized.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Org Policy & App Grants</CardTitle>
              <p className="text-sm text-zinc-600">Deny-by-default app access. Set visibility/upload defaults and grant apps explicitly.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm">
                <Label>Organization</Label>
                <Select value={selectedOrgValue} onValueChange={setSelectedOrgId}>
                  <SelectTrigger><span className="truncate text-left text-sm">{selectedOrgLabel ?? "Select organization"}</span></SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Default visibility scope</Label>
                  <Select value={policyDraft.default_visibility_scope} onValueChange={(value) => setPolicyDraft((current) => ({ ...current, default_visibility_scope: value as OrgKnowledgePolicy["default_visibility_scope"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["private", "user", "group", "team", "org", "tenant", "restricted"] as const).map((scope) => (
                        <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>ACL policy id</Label>
                  <Input value={policyDraft.acl_policy_id} onChange={(event) => setPolicyDraft((current) => ({ ...current, acl_policy_id: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed private creators (CSV roles)</Label>
                  <Input value={policyDraft.allow_private_creators.join(", ")} onChange={(event) => setPolicyDraft((current) => ({ ...current, allow_private_creators: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed restricted creators (CSV roles)</Label>
                  <Input value={policyDraft.allow_restricted_creators.join(", ")} onChange={(event) => setPolicyDraft((current) => ({ ...current, allow_restricted_creators: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed uploaders (CSV roles)</Label>
                  <Input value={policyDraft.allow_uploaders.join(", ")} onChange={(event) => setPolicyDraft((current) => ({ ...current, allow_uploaders: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sensitivity tags (CSV)</Label>
                  <Input value={policyDraft.sensitivity_tags.join(", ")} onChange={(event) => setPolicyDraft((current) => ({ ...current, sensitivity_tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
                </div>
              </div>

              <div className="rounded border border-zinc-200 p-3">
                <p className="mb-2 text-sm font-medium text-zinc-900">App Access Grants</p>
                <div className="grid gap-2 md:grid-cols-3 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(grantsDraft.knowledger)} onChange={(event) => setGrantsDraft((current) => ({ ...current, knowledger: event.target.checked }))} />Knowledger (authoring)</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(grantsDraft.council)} onChange={(event) => setGrantsDraft((current) => ({ ...current, council: event.target.checked }))} />Council (consumption)</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(grantsDraft.myaide)} onChange={(event) => setGrantsDraft((current) => ({ ...current, myaide: event.target.checked }))} />MyAIDE (publish/consume)</label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void savePolicyMutation.mutate()} disabled={!selectedOrgId || savePolicyMutation.isPending}>Save policy template</Button>
                <Button type="button" variant="outline" onClick={() => void saveGrantsMutation.mutate()} disabled={!selectedOrgId || saveGrantsMutation.isPending}>Save app grants</Button>
              </div>

              <div className="rounded border border-zinc-200 p-3">
                <p className="mb-2 text-sm font-medium text-zinc-900">Role to action baseline</p>
                <Table>
                  <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Owner/Admin</TableHead><TableHead>Lead</TableHead><TableHead>Member</TableHead><TableHead>Viewer</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(baselineQuery.data?.items ?? []).map((row) => (
                      <TableRow key={row.action}>
                        <TableCell>{row.action}</TableCell>
                        <TableCell>{row.owner_admin}</TableCell>
                        <TableCell>{row.lead}</TableCell>
                        <TableCell>{row.member}</TableCell>
                        <TableCell>{row.viewer}</TableCell>
                      </TableRow>
                    ))}
                    {!baselineQuery.data?.items?.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-zinc-500">No baseline rows available.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explain Access (Admin Debug)</CardTitle>
              <p className="text-sm text-zinc-600">Inspect resolver outcomes with principal identity, lens, and inclusion/exclusion filters.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><Label>Organization</Label><Select value={selectedOrgValue} onValueChange={setSelectedOrgId}><SelectTrigger><span className="truncate text-left text-sm">{selectedOrgLabel ?? "Select organization"}</span></SelectTrigger><SelectContent>{organizations.map((organization) => (<SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Principal ID</Label><Input value={explainPrincipalId} onChange={(event) => setExplainPrincipalId(event.target.value)} placeholder="user or agent id" /></div>
                <div className="space-y-1.5"><Label>Principal kind</Label><Select value={explainPrincipalKind} onValueChange={(value) => setExplainPrincipalKind(value as "user" | "agent")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">user</SelectItem><SelectItem value="agent">agent</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Lens</Label><Input value={explainLens} onChange={(event) => setExplainLens(event.target.value)} placeholder="knowledge.resolve" /></div>
                <div className="space-y-1.5"><Label>Include IDs (CSV)</Label><Input value={explainIncludeIds} onChange={(event) => setExplainIncludeIds(event.target.value)} /></div>
                <div className="space-y-1.5"><Label>Exclude IDs (CSV)</Label><Input value={explainExcludeIds} onChange={(event) => setExplainExcludeIds(event.target.value)} /></div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => void explainMutation.mutate()} disabled={!selectedOrgId || !explainPrincipalId || explainMutation.isPending}>Run explain access</Button>
              </div>
              <pre className="max-h-[420px] overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs">{JSON.stringify(explainMutation.data ?? { info: "No explain run yet." }, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {organizationsQuery.isError || usersQuery.isError || Boolean(policyError) ? (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertTitle>Data load failed</AlertTitle>
          <AlertDescription>{policyError || "Unable to load organizations or users from Studio API for this tenant."}</AlertDescription>
        </Alert>
      ) : null}

    </div>
  );
}
