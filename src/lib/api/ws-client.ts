import { getDefaultApiConfig } from "./client";

export type RealtimeWsConfig = {
  baseUrl?: string;
  token: string;
  path?: string;
};

export type RealtimeWsHandlers = {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
};

export type ParsedRealtimeIncoming = {
  payload: unknown;
  message?: {
    id: string;
    participantId?: string;
    content: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function toAbsoluteHttpBase(rawBaseUrl?: string): string {
  const defaults = getDefaultApiConfig();
  const base = (rawBaseUrl ?? defaults.baseUrl).replace(/\/$/, "");
  if (/^https?:\/\//i.test(base)) return base;
  if (typeof window !== "undefined") {
    return new URL(base, window.location.origin).toString().replace(/\/$/, "");
  }
  return base;
}

function toWsBase(httpBase: string): string {
  return httpBase.replace(/^http/i, "ws").replace(/\/$/, "");
}

export function buildRealtimeWsUrl(config: RealtimeWsConfig): string {
  const wsBase = toWsBase(toAbsoluteHttpBase(config.baseUrl));
  const path = config.path ?? "/v1/realtime/ws";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsBase}${normalizedPath}?token=${encodeURIComponent(config.token)}`;
}

export function connectRealtimeWs(config: RealtimeWsConfig, handlers?: RealtimeWsHandlers): WebSocket {
  const url = buildRealtimeWsUrl(config);
  const socket = new WebSocket(url);
  if (handlers?.onOpen) socket.onopen = handlers.onOpen;
  if (handlers?.onMessage) socket.onmessage = handlers.onMessage;
  if (handlers?.onError) socket.onerror = handlers.onError;
  if (handlers?.onClose) socket.onclose = handlers.onClose;
  return socket;
}

export function parseRealtimeIncoming(data: unknown): ParsedRealtimeIncoming {
  if (typeof data !== "string") {
    return { payload: data };
  }

  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    const dataObj = asRecord(parsed.data);
    const payloadObj = asRecord(parsed.payload);
    const messageObj = asRecord(parsed.message);
    const bodyObj = asRecord(parsed.body);
    const nested = dataObj ?? payloadObj ?? messageObj ?? bodyObj;

    const messageId = firstString(
      parsed.message_id,
      nested?.message_id,
      nested?.id,
    ) || "incoming";

    const senderUserId = firstString(
      parsed.sender_user_id,
      nested?.sender_user_id,
      nested?.user_id,
    ) || undefined;

    const content = firstString(
      parsed.content,
      nested?.content,
      nested?.message,
      nested?.text,
      nested?.body,
      parsed.message,
      parsed.text,
    );

    if (content) {
      return {
        payload: parsed,
        message: {
          id: messageId,
          participantId: senderUserId,
          content,
        },
      };
    }

    return { payload: parsed };
  } catch {
    return { payload: data };
  }
}
