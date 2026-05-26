import { getRuntimeConfig } from "../../config/runtime";
import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession } from "../auth-session";

export type ApiScope = {
  tenantId?: string;
  orgId?: string;
};

type QueryValue = string | number | boolean | null | undefined;

type Envelope<T> = {
  data?: T | null;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  } | null;
  meta?: {
    correlation_id?: string;
  };
};

type AuthTokenSet = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

let refreshInFlight: Promise<string | null> | null = null;

export class CoreApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "CoreApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getDefaultApiConfig() {
  const runtime = getRuntimeConfig();
  const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env ?? {};
  const isDev = env.DEV === true || env.MODE === "development";
  const directBaseUrl = runtime.coreApiBaseUrl;
  const baseUrl = isDev ? "/api" : (directBaseUrl ?? "http://localhost:8000");
  return {
    baseUrl,
    tenantId: runtime.tenantId,
    orgId: runtime.orgId ?? "",
  };
}

export function createCoreApiClient(config?: {
  baseUrl?: string;
  scope?: ApiScope;
  accessToken?: string;
}) {
  const defaults = getDefaultApiConfig();
  const rawBaseUrl = (config?.baseUrl ?? defaults.baseUrl).replace(/\/$/, "");
  const baseUrl = /^https?:\/\//i.test(rawBaseUrl)
    ? rawBaseUrl
    : typeof window !== "undefined"
      ? new URL(rawBaseUrl, window.location.origin).toString().replace(/\/$/, "")
      : rawBaseUrl;
  const scope = config?.scope ?? {};
  const accessToken = config?.accessToken ?? "";

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      const url = new URL("v1/auth/refresh", `${baseUrl}/`);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(scope.tenantId ? { "X-Tenant-ID": scope.tenantId } : {}),
          ...(scope.orgId ? { "X-Org-ID": scope.orgId } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const envelope = payload && typeof payload === "object" ? (payload as Envelope<AuthTokenSet>) : null;
      const tokenSet = (envelope && "data" in envelope ? envelope.data : payload) as AuthTokenSet | null;

      if (!response.ok || !tokenSet?.access_token) {
        clearAuthSession();
        return null;
      }

      const expiresAt = typeof tokenSet.expires_in === "number" ? Date.now() + tokenSet.expires_in * 1000 : undefined;
      saveAuthSession({
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token ?? refreshToken,
        accessTokenExpiresAt: expiresAt,
      });

      return tokenSet.access_token;
    })().finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  };

  const request = async <T>(
    path: string,
    options?: {
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      body?: unknown;
      query?: Record<string, QueryValue>;
      skipAuthRetry?: boolean;
    },
  ): Promise<T> => {
    const normalizedPath = path.replace(/^\/+/, "");
    const url = new URL(normalizedPath, `${baseUrl}/`);
    Object.entries(options?.query ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (scope.tenantId) headers["X-Tenant-ID"] = scope.tenantId;
    if (scope.orgId) headers["X-Org-ID"] = scope.orgId;

    const hasBody = options?.body !== undefined;
    if (hasBody) headers["Content-Type"] = "application/json";

    const activeAccessToken = getAccessToken() || accessToken;
    if (activeAccessToken) {
      headers.Authorization = `Bearer ${activeAccessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: options?.method ?? "GET",
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const envelope = payload && typeof payload === "object" ? (payload as Envelope<T>) : null;

    if (
      response.status === 401
      && !options?.skipAuthRetry
      && !normalizedPath.startsWith("v1/auth/")
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return request<T>(path, { ...options, skipAuthRetry: true });
      }
    }

    if (!response.ok) {
      const message = envelope?.error?.message ?? "Request failed.";
      throw new CoreApiError(message, response.status, envelope?.error?.code, envelope?.error?.details);
    }

    if (envelope && "data" in envelope) {
      return envelope.data as T;
    }

    return payload as T;
  };

  return {
    request,
    baseUrl,
    scope,
    accessToken,
    get: <T>(path: string, query?: Record<string, QueryValue>) =>
      request<T>(path, { method: "GET", query }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  };
}
