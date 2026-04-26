export type QueueErrorPolicy = "pause" | "continue";

export type CreateQueueJob = {
  id: string;
  variant: string;
  values: Record<string, unknown>;
  options: Record<string, unknown>;
  errorPolicy: QueueErrorPolicy;
  status: "queued" | "processing" | "done" | "failed" | "skipped";
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  result?: unknown;
};

export type QueueAuditEntry = {
  id: string;
  jobId: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
};

type QueueState = {
  paused: boolean;
  jobs: CreateQueueJob[];
  audit: QueueAuditEntry[];
};

const STORAGE_KEY = "kairos.studio.create.request.queue";
const MAX_AUDIT_ITEMS = 200;
const listeners = new Set<(state: QueueState) => void>();

let isProcessing = false;
let state: QueueState = loadState();

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadState(): QueueState {
  if (typeof window === "undefined") {
    return { paused: false, jobs: [], audit: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { paused: false, jobs: [], audit: [] };
    const parsed = JSON.parse(raw) as QueueState;
    return {
      paused: Boolean(parsed.paused),
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return { paused: false, jobs: [], audit: [] };
  }
}

function persistState(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit(): void {
  persistState();
  listeners.forEach((listener) => listener(state));
}

function addAudit(jobId: string, level: QueueAuditEntry["level"], message: string): void {
  state = {
    ...state,
    audit: [
      {
        id: newId(),
        jobId,
        timestamp: nowIso(),
        level,
        message,
      },
      ...state.audit,
    ].slice(0, MAX_AUDIT_ITEMS),
  };
}

function updateJob(jobId: string, patch: Partial<CreateQueueJob>): void {
  state = {
    ...state,
    jobs: state.jobs.map((job) =>
      job.id === jobId
        ? {
            ...job,
            ...patch,
            updatedAt: nowIso(),
          }
        : job,
    ),
  };
}

export function getCreateQueueState(): QueueState {
  return state;
}

export function subscribeCreateQueue(listener: (state: QueueState) => void): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function enqueueCreateJob(input: {
  variant: string;
  values: Record<string, unknown>;
  options: Record<string, unknown>;
  errorPolicy?: QueueErrorPolicy;
}): CreateQueueJob {
  const job: CreateQueueJob = {
    id: newId(),
    variant: input.variant,
    values: input.values,
    options: input.options,
    errorPolicy: input.errorPolicy ?? "pause",
    status: "queued",
    attempts: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state = {
    ...state,
    jobs: [...state.jobs, job],
  };

  addAudit(job.id, "info", `Queued ${job.variant} request`);
  emit();
  return job;
}

export function setCreateQueuePaused(paused: boolean): void {
  state = {
    ...state,
    paused,
  };
  emit();
}

export function retryCreateQueueJob(jobId: string): void {
  updateJob(jobId, {
    status: "queued",
    lastError: undefined,
  });
  addAudit(jobId, "info", "Job queued for retry");
  emit();
}

export function skipCreateQueueJob(jobId: string): void {
  updateJob(jobId, {
    status: "skipped",
  });
  addAudit(jobId, "warn", "Job skipped by user");
  emit();
}

export function clearCreateQueueHistory(): void {
  state = {
    ...state,
    jobs: state.jobs.filter((job) => job.status === "queued" || job.status === "processing"),
    audit: [],
  };
  emit();
}

export async function processCreateQueue(
  executor: (job: CreateQueueJob) => Promise<unknown>,
): Promise<void> {
  if (isProcessing) return;
  if (state.paused) return;

  isProcessing = true;
  try {
    while (!state.paused) {
      const nextJob = state.jobs.find((job) => job.status === "queued");
      if (!nextJob) break;

      updateJob(nextJob.id, {
        status: "processing",
        attempts: nextJob.attempts + 1,
      });
      addAudit(nextJob.id, "info", "Processing job");
      emit();

      try {
        const result = await executor(nextJob);
        updateJob(nextJob.id, {
          status: "done",
          result,
          lastError: undefined,
        });
        addAudit(nextJob.id, "info", "Job completed");
        emit();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown queue error";
        updateJob(nextJob.id, {
          status: "failed",
          lastError: message,
        });
        addAudit(nextJob.id, "error", message);

        if (nextJob.errorPolicy === "continue") {
          updateJob(nextJob.id, { status: "skipped" });
          addAudit(nextJob.id, "warn", "Failure ignored due to continue policy");
          emit();
          continue;
        }

        state = {
          ...state,
          paused: true,
        };
        emit();
        break;
      }
    }
  } finally {
    isProcessing = false;
  }
}
