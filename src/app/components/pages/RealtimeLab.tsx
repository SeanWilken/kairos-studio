import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, PlugZap, Send, Unplug } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, ChatWorkspace, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, type ChatMessage, type ChatThreadItem, type ChatThreadParticipant } from "@myai-tech/myui";
import { getAccessToken } from "../../../lib/auth-session";
import { authApi, buildRealtimeWsUrl, connectRealtimeWs, createCoreApiClient, parseRealtimeIncoming, realtimeApi, studioApi } from "../../../lib/api";
import { getRuntimeConfig } from "../../../config/runtime"

const participants: ChatThreadParticipant[] = [
  { id: "pm-1", name: "Alex Chen", avatarColor: "#0e7490" },
  { id: "dev-1", name: "Jordan Kim", avatarColor: "#4338ca" },
  { id: "qa-1", name: "Riley Brooks", avatarColor: "#b45309" },
  { id: "design-1", name: "Morgan Diaz", avatarColor: "#be185d" },
];

const threads: ChatThreadItem[] = [
  {
    id: "room-1",
    name: "Sprint Planning Council",
    type: "room",
    participantIds: ["pm-1", "dev-1", "qa-1", "design-1"],
    lastMessage: "Ship bulk edits as MVP this sprint behind rollout controls",
    lastMessageTime: new Date("2026-04-26T09:12:00"),
    unreadCount: 2,
    isPinned: true,
  },
  {
    id: "assistant-1",
    name: "Your Assistant",
    type: "assistant",
    participantIds: ["pm-1"],
    lastMessage: "I can draft the rollout checklist from this thread.",
    lastMessageTime: new Date("2026-04-26T08:41:00"),
  },
  {
    id: "direct-1",
    name: "Alex Chen",
    type: "direct",
    participantIds: ["pm-1"],
    lastMessage: "Can you review the release checklist?",
    lastMessageTime: new Date("2026-04-25T15:20:00"),
  },
];

type SocketEvent = {
  id: string;
  timestamp: string;
  kind: "incoming" | "outgoing" | "system";
  payload: unknown;
};

function appendEvent(previous: SocketEvent[], entry: Omit<SocketEvent, "id" | "timestamp">): SocketEvent[] {
  const next: SocketEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  return [next, ...previous].slice(0, 120);
}

export function RealtimeLabPage() {
  const runtimeConfig = getRuntimeConfig();
  const tenantId = runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const defaultOrgId = runtimeConfig.orgId ?? "org-local";

  const [token, setToken] = useState(() => getAccessToken());
  const [orgId, setOrgId] = useState(defaultOrgId);
  const [channelId, setChannelId] = useState("");
  const [room, setRoom] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [mode, setMode] = useState("single_best");
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const [lastError, setLastError] = useState("");
  const [setupOpen, setSetupOpen] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [draftMessage, setDraftMessage] = useState("");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const client = useMemo(
    () => createCoreApiClient({ accessToken: token, scope: { tenantId, orgId } }),
    [token, tenantId, orgId],
  );

  const organizationsQuery = useQuery({
    queryKey: ["realtime-lab", "organizations", tenantId, token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await studioApi.listOrganizations(client);
      return response.items ?? [];
    },
  });

  const meQuery = useQuery({
    queryKey: ["realtime-lab", "me", token],
    enabled: Boolean(token),
    queryFn: async () => authApi.me(client),
  });

  const organizationOptions = useMemo(() => {
    const fromMe = Array.isArray(meQuery.data?.org_options)
      ? meQuery.data.org_options
          .filter((option): option is { org_id: string; name?: string } => typeof option?.org_id === "string")
          .map((option) => ({ id: option.org_id, name: option.name ?? option.org_id }))
      : [];
    if (fromMe.length > 0) return fromMe;
    return organizationsQuery.data ?? [];
  }, [meQuery.data, organizationsQuery.data]);

  const selectedOrgValue = organizationOptions.some((org) => org.id === orgId) ? orgId : "__none_org";

  const personasQuery = useQuery({
    queryKey: ["realtime-lab", "personas", orgId, token],
    enabled: Boolean(token && orgId),
    queryFn: async () => realtimeApi.listPersonas(client, { orgId, enabledOnly: false }),
  });

  const roomsQuery = useQuery({
    queryKey: ["realtime-lab", "rooms", orgId, token],
    enabled: Boolean(token && orgId),
    queryFn: async () => realtimeApi.listRooms(client, { orgId }),
  });

  useEffect(() => {
    const orgs = organizationOptions;
    if (!orgs.length) return;
    if (!orgs.some((org) => org.id === orgId)) {
      setOrgId(orgs[0].id);
    }
  }, [organizationOptions, orgId]);

  useEffect(() => {
    const personas = personasQuery.data ?? [];
    if (!personas.length) {
      setPersonaId("");
      return;
    }
    if (!personaId || !personas.some((persona) => persona.id === personaId)) {
      setPersonaId(personas[0].id);
    }
  }, [personasQuery.data, personaId]);

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const resolvedPersonaId = personaId.trim() || undefined;

      const channel = await realtimeApi.createChatRoom(client, {
        orgId,
        defaultPersonaId: resolvedPersonaId ?? undefined,
        mode,
        title: `Realtime room ${new Date().toISOString()}`,
      });

      return { channelId: channel.channel_id, resolvedPersonaId };
    },
    onSuccess: ({ channelId: newChannelId, resolvedPersonaId }) => {
      setChannelId(newChannelId);
      if (resolvedPersonaId) setPersonaId(resolvedPersonaId);
      setRoom(`tenant:${tenantId}:channel:${newChannelId}`);
      setLastError("");
      void roomsQuery.refetch();
    },
    onError: (error) => {
      setLastError(error instanceof Error ? error.message : "Failed to create chat room.");
    },
  });

  const wsUrl = useMemo(
    () => buildRealtimeWsUrl({ baseUrl: runtimeBaseUrl, token }),
    [runtimeBaseUrl, token],
  );

  const connect = () => {
    setLastError("");
    if (!token) {
      setLastError("Access token is required.");
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const socket = connectRealtimeWs(
      { baseUrl: runtimeBaseUrl, token },
      {
        onOpen: () => {
          setConnected(true);
          setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.open" } }));
          setMessages((previous) => previous.concat([{
              id: "open",
              role: "assistant",
              content: "Connected!",
              timestamp: new Date,
           }]));
        },
        onMessage: (event) => {
          const parsed = parseRealtimeIncoming(event.data);
          if (parsed.message) {
            setMessages((previous) => previous.concat([{
              id: parsed.message.id,
              role: "assistant",
              participantId: parsed.message.participantId,
              content: parsed.message.content,
              timestamp: new Date,
            }]));
          }
          setEvents((prev) => appendEvent(prev, { kind: "incoming", payload: parsed.payload }));
        },
        onError: () => {
          setLastError("WebSocket error encountered.");
          setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.error" } }));
        },
        onClose: (event) => {
          setConnected(false);
          setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.close", code: event.code, reason: event.reason } }));
          wsRef.current = null;
        },
      },
    );
    wsRef.current = socket;
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  };

  const sendPayload = (payload: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setLastError("WebSocket is not connected.");
      return;
    }
    wsRef.current.send(JSON.stringify(payload));
    setEvents((prev) => appendEvent(prev, { kind: "outgoing", payload }));
  };

  const subscribeRoom = () => {
    if (!room.trim()) {
      setLastError("Room is required for subscribe.");
      return;
    }
    sendPayload({ action: "subscribe", room: room.trim() });
  };

  const sendChat = () => {
    const message = content.trim() || draftMessage.trim();
    if (!channelId.trim() || !message) {
      setLastError("channel_id and content are required.");
      return;
    }

    sendPayload({
      action: "chat.send",
      channel_id: channelId.trim(),
      content: message,
      persona_id: personaId.trim() || undefined,
      mode,
    });
    setContent("");
    setDraftMessage("");
  };

  const selectRoom = (nextChannelId: string) => {
    setChannelId(nextChannelId);
    setRoom(`tenant:${tenantId}:channel:${nextChannelId}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Realtime Chat Lab</h1>
          <p className="mt-1 text-zinc-600">Connect to websocket, subscribe rooms, and test channel chat events.</p>
        </div>
        <Badge variant="outline">{connected ? "connected" : "disconnected"}</Badge>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Realtime Setup</CardTitle>
            <Button type="button" variant="ghost" size="icon" onClick={() => setSetupOpen((current) => !current)}>
              {setupOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {setupOpen ? (
          <CardContent className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>Organization</Label>
                <Select value={selectedOrgValue} onValueChange={(value) => setOrgId(value === "__none_org" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none_org">Select organization</SelectItem>
                    {organizationOptions.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Persona</Label>
                <Select value={personaId || "__none"} onValueChange={(value) => setPersonaId(value === "__none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No default persona</SelectItem>
                    {(personasQuery.data ?? []).map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>{persona.name} ({persona.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Room</Label>
                <Select value={channelId || "__none_room"} onValueChange={(value) => selectRoom(value === "__none_room" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none_room">No room selected</SelectItem>
                    {(roomsQuery.data ?? []).map((roomItem) => (
                      <SelectItem key={roomItem.id} value={roomItem.id}>{roomItem.title} ({roomItem.mode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_best">single_best</SelectItem>
                    <SelectItem value="council">council</SelectItem>
                    <SelectItem value="summarized">summarized</SelectItem>
                    <SelectItem value="threaded">threaded</SelectItem>
                    <SelectItem value="silent_head">silent_head</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => void createRoomMutation.mutate()} disabled={!orgId || createRoomMutation.isPending}>
                Create room via API
              </Button>
              <Button type="button" onClick={connect} disabled={connected}>
                <PlugZap className="mr-2 h-4 w-4" />Connect
              </Button>
              <Button type="button" variant="outline" onClick={disconnect} disabled={!connected}>
                <Unplug className="mr-2 h-4 w-4" />Disconnect
              </Button>
              <Button type="button" variant="outline" onClick={subscribeRoom} disabled={!connected || !room.trim()}>
                Subscribe room
              </Button>
              <Button type="button" variant="outline" onClick={() => setEventsOpen((current) => !current)}>
                {eventsOpen ? <PanelRightClose className="mr-2 h-4 w-4" /> : <PanelRightOpen className="mr-2 h-4 w-4" />}
                {eventsOpen ? "Hide events" : "Show events"}
              </Button>
            </div>

            <div className="space-y-1">
              <Label>WS URL</Label>
              <Input value={wsUrl} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Access token</Label>
              <Textarea value={token} onChange={(event) => setToken(event.target.value)} className="min-h-[88px]" />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={connect} disabled={connected}>
                <PlugZap className="mr-2 h-4 w-4" />
                Connect
              </Button>
              <Button type="button" variant="outline" onClick={disconnect} disabled={!connected}>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>

            <div className="space-y-2 rounded-md border border-zinc-200 p-3">
              <Label>chat.send</Label>
              <Input placeholder="channel_id" value={channelId} onChange={(event) => setChannelId(event.target.value)} />
              <Input placeholder="persona_id (optional)" value={personaId} onChange={(event) => setPersonaId(event.target.value)} />
              <Textarea placeholder="Type chat message content" value={content} onChange={(event) => setContent(event.target.value)} />
              <Button type="button" onClick={sendChat} disabled={!connected}>
                <Send className="mr-2 h-4 w-4" />
                Send chat.send
              </Button>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className={`grid gap-4 ${eventsOpen ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        <div className="h-full">
          {ChatWorkspace({
                className: "h-[calc(100vh-24rem)]",
                compact: false,
                hideHeader: false,
                title: "Test Workspace",
                subtitle: "Testing the UI Library",
                participants: participants,
                messages: messages,
                onMessageSelect: ((message: ChatMessage) => {}),
                placeholder: "Type message",
                sendLabel: "Send",
                draft: draftMessage,
                defaultDraft: "",
                onDraftChange: ((v) => setDraftMessage(v)),
                onSendMessage: sendChat,
            })}
        </div>

        {eventsOpen ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Stream</CardTitle>
            </CardHeader>
            <CardContent>
              {lastError ? (
                <Alert className="mb-3 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Realtime error</AlertTitle>
                  <AlertDescription>{lastError}</AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-3 border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    Use a channel where your user is a participant. Subscribe first, then send `chat.send`.
                  </AlertDescription>
                </Alert>
              )}

              <pre className="max-h-[620px] overflow-auto rounded bg-zinc-50 p-3 text-[11px] text-zinc-700">
                {events.length === 0 ? "No events yet." : JSON.stringify(events, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
