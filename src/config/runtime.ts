type RuntimeWindowConfig = {
  tenantId?: string;
  coreApiBaseUrl?: string;
  deApiBaseUrl?: string;
  appId?: string;
  coreFrontendUrl?: string;
  councilFrontendUrl?: string;
  coreWsUrl?: string;
  orgId?: string;
};

declare global {
  interface Window {
    __MYAI_CONFIG__?: RuntimeWindowConfig;
  }
}

export type RuntimeConfig = {
  tenantId: string;
  coreApiBaseUrl?: string;
  deApiBaseUrl?: string;
  appId?: string;
  coreFrontendUrl?: string;
  councilFrontendUrl?: string;
  coreWsUrl?: string;
  orgId?: string;
};

export function getRuntimeConfig(): RuntimeConfig {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const runtime = typeof window !== "undefined" ? (window.__MYAI_CONFIG__ ?? {}) : {};

  return {
    tenantId: runtime.tenantId ?? env.VITE_MYAI_TENANT_ID ?? "tenant-local",
    coreApiBaseUrl: runtime.coreApiBaseUrl ?? env.VITE_MYAI_CORE_API_BASE_URL,
    deApiBaseUrl: runtime.deApiBaseUrl ?? env.VITE_MYAI_DE_API_BASE_URL,
    appId: runtime.appId ?? env.VITE_MYAI_APP_ID,
    coreFrontendUrl: runtime.coreFrontendUrl ?? env.VITE_MYAI_CORE_FRONTEND_URL,
    councilFrontendUrl: runtime.councilFrontendUrl ?? env.VITE_MYAI_COUNCIL_FRONTEND_URL,
    coreWsUrl: runtime.coreWsUrl ?? env.VITE_MYAI_CORE_WS_URL,
    orgId: runtime.orgId ?? env.VITE_MYAI_ORG_ID,
  };
}
