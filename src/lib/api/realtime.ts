import type { CoreApiClient } from "./client";
import { studioApi } from "./studio";

function normalizeItems<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) return (value as { items: T[] }).items;
  return Array.isArray(value) ? (value as T[]) : [];
}

export type RealtimePersonaOption = {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  role: string;
  enabled: boolean;
};

export type CreateChatRoomInput = {
  orgId: string;
  defaultPersonaId?: string;
  mode?: string;
  title?: string;
};

export type RealtimeRoomOption = {
  id: string;
  title: string;
  mode: string;
  orgId?: string;
  defaultPersonaId?: string;
};

export const realtimeApi = {
  listPersonas: async (
    client: CoreApiClient,
    options: { orgId: string; enabledOnly?: boolean; search?: string },
  ): Promise<RealtimePersonaOption[]> => {
    let merged: Record<string, unknown>[] = [];
    try {
      const studioResponse = await studioApi.listPersonas(client, {
        orgId: options.orgId,
        enabledOnly: options.enabledOnly,
      });
      merged = normalizeItems<Record<string, unknown>>(studioResponse);
    } catch {
      merged = [];
    }

    if (merged.length === 0) {
      try {
        const realtimeResponse = await client.get<{ items?: Array<Record<string, unknown>> }>("/v1/realtime/personas", {
          org_id: options.orgId,
          enabled_only: options.enabledOnly,
        });
        merged = normalizeItems<Record<string, unknown>>(realtimeResponse);
      } catch {
        merged = [];
      }
    }

    const query = options.search?.trim().toLowerCase();
    const byId = new Map<string, RealtimePersonaOption>();

    merged.forEach((persona) => {
      const id = String(persona.persona_id ?? persona.id ?? "").trim();
      if (!id) return;
      const name = String(persona.name ?? persona.slug ?? id);
      const slug = String(persona.slug ?? id);
      const orgId = String(persona.org_id ?? options.orgId);
      const role = String(persona.role ?? "assistant");
      byId.set(id, {
        id,
        orgId,
        name,
        slug,
        role,
        enabled: persona.enabled !== false,
      });
    });

    return Array.from(byId.values())
      .filter((persona) => {
        if (!query) return true;
        return (
          persona.id.toLowerCase().includes(query)
          || persona.slug.toLowerCase().includes(query)
          || persona.name.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  resolvePersonaId: async (
    client: CoreApiClient,
    options: { orgId: string; lookup: string },
  ): Promise<string | null> => {
    const lookup = options.lookup.trim();
    if (!lookup) return null;

    const personas = await realtimeApi.listPersonas(client, {
      orgId: options.orgId,
      enabledOnly: false,
    });

    const exactId = personas.find((persona) => persona.id === lookup);
    if (exactId) return exactId.id;

    const lowerLookup = lookup.toLowerCase();
    const exactSlug = personas.find((persona) => persona.slug.toLowerCase() === lowerLookup);
    if (exactSlug) return exactSlug.id;

    const exactName = personas.find((persona) => persona.name.toLowerCase() === lowerLookup);
    if (exactName) return exactName.id;

    return null;
  },

  createChatRoom: async (client: CoreApiClient, input: CreateChatRoomInput) =>
    studioApi.createChannel(client, {
      org_id: input.orgId,
      default_persona_id: input.defaultPersonaId,
      mode: input.mode ?? "single_best",
      title: input.title,
    }),

  listRooms: async (client: CoreApiClient, options: { orgId?: string }): Promise<RealtimeRoomOption[]> => {
    let merged: Record<string, unknown>[] = [];
    try {
      const channelResponse = await studioApi.listChannels(client, { orgId: options.orgId });
      merged = normalizeItems<Record<string, unknown>>(channelResponse);
    } catch {
      merged = [];
    }

    if (merged.length === 0) {
      try {
        const roomsResponse = await client.get<{ items?: Array<Record<string, unknown>> }>("/v1/realtime/rooms", {
          org_id: options.orgId,
        });
        merged = normalizeItems<Record<string, unknown>>(roomsResponse);
      } catch {
        merged = [];
      }
    }

    const byId = new Map<string, RealtimeRoomOption>();
    merged.forEach((room) => {
      const id = String(room.channel_id ?? room.room_id ?? room.id ?? "").trim();
      if (!id) return;
      const mode = String(room.mode ?? "single_best");
      byId.set(id, {
        id,
        title: typeof room.title === "string" && room.title.trim() ? room.title : id,
        mode,
        orgId: typeof room.org_id === "string" ? room.org_id : undefined,
        defaultPersonaId: typeof room.default_persona_id === "string" ? room.default_persona_id : undefined,
      });
    });

    return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title));
  },
};
