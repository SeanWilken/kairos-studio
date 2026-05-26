export type WorkspaceHealthLevel = "healthy" | "warning" | "critical" | "unknown";

export type WorkspaceNotification = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export function buildWorkspaceNotifications(input: {
  healthItems: Array<{ key: string; label: string; level: WorkspaceHealthLevel; message: string }>;
  queueFailedCount: number;
  setupIncompleteCount: number;
  organizationsCount: number;
  usersCount: number;
}): WorkspaceNotification[] {
  const notifications: WorkspaceNotification[] = [];

  input.healthItems
    .filter((item) => item.level === "critical" || item.level === "warning")
    .forEach((item) => {
      notifications.push({
        id: `health-${item.key}`,
        level: item.level === "critical" ? "critical" : "warning",
        title: `${item.label} requires attention`,
        detail: item.message,
        href: "/",
        actionLabel: "Open Overview",
      });
    });

  if (input.organizationsCount === 0) {
    notifications.push({
      id: "setup-missing-org",
      level: "warning",
      title: "No organizations configured",
      detail: "Create your first organization to finish workspace setup.",
      href: "/create/organization",
      actionLabel: "Create Organization",
    });
  }

  if (input.usersCount === 0) {
    notifications.push({
      id: "setup-missing-user",
      level: "warning",
      title: "No users found",
      detail: "Invite users so teams can access this workspace.",
      href: "/create/user",
      actionLabel: "Invite User",
    });
  }

  if (input.queueFailedCount > 0) {
    notifications.push({
      id: "queue-failed",
      level: "critical",
      title: "Queued requests failed",
      detail: `${input.queueFailedCount} queued request(s) need retry or skip.`,
      href: "/audit?tab=queue",
      actionLabel: "Review Queue",
    });
  }

  if (input.setupIncompleteCount > 0) {
    notifications.push({
      id: "setup-progress",
      level: "info",
      title: "Setup is not complete",
      detail: `${input.setupIncompleteCount} setup step(s) still pending.`,
      href: "/?focus=setup",
      actionLabel: "View Progress",
    });
  }

  return notifications.slice(0, 8);
}
