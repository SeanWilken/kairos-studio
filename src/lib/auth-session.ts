const ACCESS_TOKEN_KEY = "kairos.studio.access_token";
const REFRESH_TOKEN_KEY = "kairos.studio.refresh_token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "kairos.studio.access_token_expires_at";
const AUTH_SESSION_EVENT = "kairos.auth.session.changed";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: number;
};

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (typeof session.accessTokenExpiresAt === "number" && Number.isFinite(session.accessTokenExpiresAt)) {
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(session.accessTokenExpiresAt));
  } else {
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  }
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

export function getAccessTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function isAccessTokenExpired(skewMs = 10_000): boolean {
  const expiresAt = getAccessTokenExpiresAt();
  if (!expiresAt) return false;
  return Date.now() + skewMs >= expiresAt;
}

export function hasAuthSession(): boolean {
  return Boolean(getAccessToken());
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export async function saveSessionDuringInitialization<T>(session: AuthSession, initialize: () => Promise<T>): Promise<T> {
  saveAuthSession(session);
  try {
    return await initialize();
  } catch (error) {
    clearAuthSession();
    throw error;
  }
}

export function subscribeAuthSession(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY) listener();
  };
  window.addEventListener(AUTH_SESSION_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
