import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
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
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kairosstack/ui";
import { createCoreApiClient, studioApi, type StudioOrganization, type StudioUser } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth-session";
import { readWorkspaceTeams, type TeamRecord } from "../../../lib/workspace-scope";

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
  const [teams, setTeams] = useState<TeamRecord[]>(() => readWorkspaceTeams());

  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
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
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
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
              Audit events are still pending live wiring in this view.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {organizationsQuery.isError || usersQuery.isError ? (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertTitle>Data load failed</AlertTitle>
          <AlertDescription>Unable to load organizations or users from Studio API for this tenant.</AlertDescription>
        </Alert>
      ) : null}

    </div>
  );
}
