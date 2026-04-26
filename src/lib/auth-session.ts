const ACCESS_TOKEN_KEY = "kairos.studio.access_token";
const REFRESH_TOKEN_KEY = "kairos.studio.refresh_token";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

export function hasAuthSession(): boolean {
  return Boolean(getAccessToken());
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
