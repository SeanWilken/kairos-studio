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

function configured(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function getRuntimeConfig(): RuntimeConfig {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const runtime = typeof window !== "undefined" ? (window.__MYAI_CONFIG__ ?? {}) : {};

  return {
    tenantId: configured(runtime.tenantId) ?? configured(env.VITE_MYAI_TENANT_ID) ?? "tenant-local",
    coreApiBaseUrl: configured(runtime.coreApiBaseUrl) ?? configured(env.VITE_MYAI_CORE_API_BASE_URL),
    deApiBaseUrl: configured(runtime.deApiBaseUrl) ?? configured(env.VITE_MYAI_DE_API_BASE_URL),
    appId: configured(runtime.appId) ?? configured(env.VITE_MYAI_APP_ID),
    coreFrontendUrl: configured(runtime.coreFrontendUrl) ?? configured(env.VITE_MYAI_CORE_FRONTEND_URL),
    councilFrontendUrl: configured(runtime.councilFrontendUrl) ?? configured(env.VITE_MYAI_COUNCIL_FRONTEND_URL),
    coreWsUrl: configured(runtime.coreWsUrl) ?? configured(env.VITE_MYAI_CORE_WS_URL),
    orgId: configured(runtime.orgId) ?? configured(env.VITE_MYAI_ORG_ID),
  };
}
