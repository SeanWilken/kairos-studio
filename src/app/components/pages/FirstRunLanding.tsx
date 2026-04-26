import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@kairosstack/ui";
import { bootstrapApi, createCoreApiClient, healthApi, studioApi } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth-session";
import { WorkspaceHome } from "./WorkspaceHome";

export function FirstRunLanding() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL;
  const accessToken = getAccessToken();

  const gateQuery = useQuery({
    queryKey: ["first-run", "gate", tenantId],
    queryFn: async () => {
      const publicClient = createCoreApiClient({ baseUrl: runtimeBaseUrl, scope: { tenantId } });
      const [health, tenantStatus] = await Promise.all([
        healthApi.getHealth(publicClient),
        bootstrapApi.getTenantStatus(publicClient),
      ]);
      return {
        health,
        tenantConfigured: Boolean(tenantStatus.configured),
      };
    },
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["first-run", "users-exist"],
    enabled: Boolean(accessToken && gateQuery.data?.tenantConfigured),
    queryFn: async () => {
      const client = createCoreApiClient({
        baseUrl: runtimeBaseUrl,
        accessToken,
        scope: { tenantId },
      });
      const response = await studioApi.listUsers(client);
      const users = Array.isArray((response as { items?: unknown }).items)
        ? ((response as { items: unknown[] }).items ?? [])
        : Array.isArray(response)
          ? response
          : [];
      return users.length;
    },
    retry: false,
  });

  if (gateQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Running startup checks</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">Verifying core health and tenant bootstrap status.</CardContent>
        </Card>
      </div>
    );
  }

  if (gateQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Startup checks failed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">Core health checks were unreachable. Confirm backend availability, then refresh.</CardContent>
        </Card>
      </div>
    );
  }

  if (!gateQuery.data?.tenantConfigured) {
    return <Navigate to="/create/user?bootstrap=1&tenant=missing" replace />;
  }

  if (!accessToken) {
    return <Navigate to="/create/user?bootstrap=1" replace />;
  }

  if (usersQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Checking workspace status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">Validating whether initial global admin setup is required.</CardContent>
        </Card>
      </div>
    );
  }

  if (usersQuery.isSuccess && usersQuery.data === 0) {
    return <Navigate to="/create/user?bootstrap=1" replace />;
  }

  if (usersQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  return <WorkspaceHome />;
}
