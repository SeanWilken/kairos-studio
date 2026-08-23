import type { CoreApiClient } from "./client";

export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tenant_id?: string | null;
  org_id?: string | null;
  is_global_admin?: boolean;
  role?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  tenant_id?: string | null;
  org_id?: string | null;
};

export type RefreshPayload = {
  refresh_token: string;
};

export type AuthTokenSet = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  [key: string]: unknown;
};

export type AuthContextSwitchPayload = {
  org_id: string;
};

export type AuthMeOrgOption = {
  org_id: string;
  name?: string;
  slug?: string;
  role?: string;
  [key: string]: unknown;
};

export type AuthMeResponse = Record<string, unknown> & {
  tenant_id?: string;
  org_id?: string;
  user?: Record<string, unknown> & {
    id?: string;
    user_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    org_id?: string | null;
    role?: string;
    is_global_admin?: boolean;
  };
  auth?: {
    tenant_id?: string;
    org_id?: string | null;
    roles?: string[];
    is_global_admin?: boolean;
  };
  memberships?: Array<Record<string, unknown>>;
  org_options?: AuthMeOrgOption[];
};

export const authApi = {
  register: (client: CoreApiClient, payload: RegisterPayload) =>
    client.post<AuthTokenSet | Record<string, unknown>>("/v1/auth/register", payload),

  login: (client: CoreApiClient, payload: LoginPayload) =>
    client.post<AuthTokenSet | Record<string, unknown>>("/v1/auth/login", payload),

  refresh: (client: CoreApiClient, payload: RefreshPayload) =>
    client.post<AuthTokenSet | Record<string, unknown>>("/v1/auth/refresh", payload),

  logout: (client: CoreApiClient, payload: RefreshPayload) =>
    client.post<Record<string, unknown>>("/v1/auth/logout", payload),

  me: (client: CoreApiClient) => client.get<AuthMeResponse>("/v1/auth/me"),

  switchContext: (client: CoreApiClient, payload: AuthContextSwitchPayload) =>
    client.post<AuthTokenSet | Record<string, unknown>>("/v1/auth/context/switch", payload),
};
