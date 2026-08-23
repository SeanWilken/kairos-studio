import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@myai-tech/myui";
import { createCoreApiClient, toolsApi } from "../../../lib/api";
import { getAccessToken, subscribeAuthSession } from "../../../lib/auth-session";
import { readAuthorizedContext } from "../../../lib/auth-context";
import { getRuntimeConfig } from "../../../config/runtime";

function normalizeItems<T>(value: unknown, key: "tools" | "items"): T[] {
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>)[key])) {
    return (value as Record<string, T[]>)[key];
  }
  return [];
}

export function Tools() {
  const runtime = getRuntimeConfig();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const context = readAuthorizedContext(accessToken);
  const tenantId = context.tenantId ?? runtime.tenantId;
  const orgId = context.orgId ?? "";

  useEffect(() => subscribeAuthSession(() => setAccessToken(getAccessToken())), []);

  const client = useMemo(() => createCoreApiClient({
    baseUrl: runtime.coreApiBaseUrl,
    accessToken,
    scope: { tenantId, orgId: orgId || undefined },
  }), [accessToken, orgId, runtime.coreApiBaseUrl, tenantId]);

  const catalogQuery = useQuery({
    queryKey: ["tools", "catalog", tenantId, orgId],
    queryFn: () => toolsApi.getCatalog(client),
  });
  const runtimeQuery = useQuery({
    queryKey: ["tools", "runtime", tenantId, orgId],
    queryFn: () => toolsApi.getRuntimeRegistry(client),
  });
  const executionsQuery = useQuery({
    queryKey: ["tools", "executions", tenantId, orgId],
    enabled: Boolean(orgId),
    queryFn: () => toolsApi.listExecutions(client, orgId),
  });

  const tools = normalizeItems<Awaited<ReturnType<typeof toolsApi.getCatalog>>["tools"][number]>(catalogQuery.data, "tools");
  const runtimeEntries = normalizeItems<Awaited<ReturnType<typeof toolsApi.getRuntimeRegistry>>["items"][number]>(runtimeQuery.data, "items");
  const executions = normalizeItems<Record<string, unknown>>(executionsQuery.data, "items");
  const hasError = catalogQuery.isError || runtimeQuery.isError || executionsQuery.isError;

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Tools & Integrations</h1>
        <p className="mt-1 text-zinc-600">Read-only live state from the Core tool catalog and runtime registry.</p>
      </div>

      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Wrench className="h-4 w-4" />
        <AlertTitle>Management actions are not available in this release</AlertTitle>
        <AlertDescription>Registration, secret management, approval, and removal controls are capability-gated until Core exposes supported management contracts.</AlertDescription>
      </Alert>

      {hasError ? (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load live tool state</AlertTitle>
          <AlertDescription>No fallback or sample data is shown.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Core Catalog</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Category</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.tool_id}>
                    <TableCell><div className="font-medium">{tool.label || tool.tool_id}</div><div className="text-xs text-zinc-500">{tool.tool_id}</div></TableCell>
                    <TableCell>{tool.category || "-"}</TableCell>
                    <TableCell>{tool.risk_level || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{tool.status || "unknown"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!tools.length ? <TableRow><TableCell colSpan={4} className="text-center text-zinc-500">{catalogQuery.isLoading ? "Loading catalog..." : "No catalog tools reported by Core."}</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Runtime Registry</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Implementation</TableHead><TableHead>Installed</TableHead><TableHead>Validated</TableHead></TableRow></TableHeader>
              <TableBody>
                {runtimeEntries.map((entry) => (
                  <TableRow key={`${entry.tool_id}:${entry.implementation_id}`}>
                    <TableCell>{entry.tool_id}</TableCell><TableCell>{entry.implementation_id}</TableCell>
                    <TableCell>{entry.installed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : "No"}</TableCell>
                    <TableCell>{entry.validated === undefined ? "-" : entry.validated ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
                {!runtimeEntries.length ? <TableRow><TableCell colSpan={4} className="text-center text-zinc-500">{runtimeQuery.isLoading ? "Loading runtime registry..." : "No runtime entries reported by Core."}</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent Executions</CardTitle></CardHeader>
        <CardContent>
          {!orgId ? <p className="text-sm text-zinc-500">Select an organization context to load executions.</p> : (
            <pre className="max-h-80 overflow-auto rounded border bg-zinc-50 p-3 text-xs">{executionsQuery.isLoading ? "Loading executions..." : JSON.stringify(executions, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
