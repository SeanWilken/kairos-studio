export type TeamRecord = {
  id: string;
  orgId: string;
  name: string;
  createdAt: string;
};

export type WorkspaceScope = {
  type: "tenant" | "organization" | "team";
  id: string;
  name: string;
  orgId?: string;
};

const TEAMS_STORAGE_KEY = "kairos.studio.organization.teams";
const SCOPE_STORAGE_KEY = "kairos.studio.workspace.scope";
const SCOPE_EVENT = "kairos.workspace.scope.changed";
const TEAMS_EVENT = "kairos.workspace.teams.changed";

export function readWorkspaceTeams(): TeamRecord[] {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TeamRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeWorkspaceTeams(teams: TeamRecord[]): void {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  window.dispatchEvent(new Event(TEAMS_EVENT));
}

export function getWorkspaceScope(defaultTenantId: string): WorkspaceScope {
  try {
    const raw = localStorage.getItem(SCOPE_STORAGE_KEY);
    if (!raw) {
      return { type: "tenant", id: defaultTenantId, name: defaultTenantId };
    }
    const parsed = JSON.parse(raw) as WorkspaceScope;
    if (!parsed || typeof parsed !== "object") {
      return { type: "tenant", id: defaultTenantId, name: defaultTenantId };
    }
    if (parsed.type !== "tenant" && parsed.type !== "organization" && parsed.type !== "team") {
      return { type: "tenant", id: defaultTenantId, name: defaultTenantId };
    }
    return parsed;
  } catch {
    return { type: "tenant", id: defaultTenantId, name: defaultTenantId };
  }
}

export function setWorkspaceScope(scope: WorkspaceScope): void {
  localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(scope));
  window.dispatchEvent(new Event(SCOPE_EVENT));
}

export function subscribeWorkspaceScope(listener: (scope: WorkspaceScope) => void, defaultTenantId: string): () => void {
  const notify = () => listener(getWorkspaceScope(defaultTenantId));
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCOPE_STORAGE_KEY) notify();
  };

  notify();
  window.addEventListener(SCOPE_EVENT, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SCOPE_EVENT, notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function subscribeWorkspaceTeams(listener: (teams: TeamRecord[]) => void): () => void {
  const notify = () => listener(readWorkspaceTeams());
  const onStorage = (event: StorageEvent) => {
    if (event.key === TEAMS_STORAGE_KEY) notify();
  };

  notify();
  window.addEventListener(TEAMS_EVENT, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(TEAMS_EVENT, notify);
    window.removeEventListener("storage", onStorage);
  };
}
