import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, PlugZap, Send, Unplug } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, ChatWorkspace, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, type ChatMessage, type ChatThreadItem, type ChatThreadParticipant } from "@kairosstack/ui";
import { getAccessToken } from "../../../lib/auth-session";


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

type SocketErrorMessage = {
  event: string
  message: string
}

type SocketMessage = {
  message_id: string
  tenant_id: string
  channel_id: string
  sender_user_id: string
  content: string
  metadata: {
    sender_kind: string,
    provider: string,
    model: string,
    usage: {
      prompt_tokens: number,
      completion_tokens: number,
      total_tokens: number,
      prompt_tokens_details: {
        cached_tokens: number,
        audio_tokens: number
      },
      completion_tokens_details: {
        reasoning_tokens: number,
        audio_tokens: number,
        accepted_prediction_tokens: number,
        rejected_prediction_tokens: number
      }
    },
    persona_id?: string,
    mode: string
  },
  created_at: Date
}


type SocketEvent = {
  id: string;
  timestamp: string;
  kind: "incoming" | "outgoing" | "system";
  payload: unknown;
};

function toWsBase(url: string): string {
  return url.replace(/^http/i, "ws").replace(/\/$/, "");
}

function appendEvent(previous: SocketEvent[], entry: Omit<SocketEvent, "id" | "timestamp">): SocketEvent[] {
  const next: SocketEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  return [next, ...previous].slice(0, 120);
}

export function RealtimeLabPage() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const runtimeBaseUrl = env.VITE_KAIROS_CORE_API_BASE_URL ?? "http://localhost:8000";

  const [token, setToken] = useState(() => getAccessToken());
  const [channelId, setChannelId] = useState("");
  const [room, setRoom] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [mode, setMode] = useState("single_best");
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const [lastError, setLastError] = useState("");
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(
    () => `${toWsBase(runtimeBaseUrl)}/v1/realtime/ws?token=${encodeURIComponent(token)}`,
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

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.open" } }));
      setMessages(messages.concat([{
          id: "open",
          role: "assistant",
          // participantId?: string;
          content: "Connected!",
          timestamp: new Date,
          // meta?: React$1.ReactNode;
      }]))
    };
    
    socket.onmessage = (event) => {
      let payload: unknown = event.data;
      try {
        const dataStr = event.data as string
        payload = JSON.parse(dataStr);
        const eventMessage = JSON.parse(event.data) as SocketMessage
        setMessages(messages.concat([{
          id: eventMessage.message_id,
          role: "assistant", // eventMessage.metadata.sender_kind,
          participantId: eventMessage.sender_user_id,
          content: eventMessage.content,
          timestamp: new Date,
          // meta: eventMessage.metadata
        }]))
      } catch {
        payload = event.data;
        const eventMessage = JSON.parse(event.data) as SocketErrorMessage
        setMessages(messages.concat([{
          id: "open",
          role: "assistant",
          // participantId?: string;
          content: eventMessage.message,
          timestamp: new Date,
          // meta?: React$1.ReactNode;
        }]))
      }
      setEvents((prev) => appendEvent(prev, { kind: "incoming", payload }));
    };

    socket.onerror = () => {
      setLastError("WebSocket error encountered.");
      setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.error" } }));
    };

    socket.onclose = (event) => {
      setConnected(false);
      setEvents((prev) => appendEvent(prev, { kind: "system", payload: { event: "socket.close", code: event.code, reason: event.reason } }));
      wsRef.current = null;
    };
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
    if (!channelId.trim() || !content.trim()) {
      setLastError("channel_id and content are required.");
      return;
    }

    sendPayload({
      action: "chat.send",
      channel_id: channelId.trim(),
      content: content.trim(),
      persona_id: personaId.trim() || undefined,
      mode,
    });
    setContent("");
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

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            <div className="space-y-1">
              <Label>Room subscription</Label>
              <Input
                placeholder="tenant:tenant-local:channel:<channel_id>"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
              />
              <Button type="button" variant="outline" onClick={subscribeRoom} disabled={!connected}>
                Subscribe Room
              </Button>
            </div>

            <div className="space-y-2 rounded-md border border-zinc-200 p-3">
              <Label>chat.send</Label>
              <Input placeholder="channel_id" value={channelId} onChange={(event) => setChannelId(event.target.value)} />
              <Input placeholder="persona_id (optional)" value={personaId} onChange={(event) => setPersonaId(event.target.value)} />
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_best">single_best</SelectItem>
                  <SelectItem value="council">council</SelectItem>
                  <SelectItem value="summarized">summarized</SelectItem>
                  <SelectItem value="threaded">threaded</SelectItem>
                  <SelectItem value="silent_head">silent_head</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Type chat message content" value={content} onChange={(event) => setContent(event.target.value)} />
              <Button type="button" onClick={sendChat} disabled={!connected}>
                <Send className="mr-2 h-4 w-4" />
                Send chat.send
              </Button>
            </div>
          </CardContent>
        </Card>

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

            <pre className="max-h-[640px] overflow-auto rounded bg-zinc-50 p-3 text-[11px] text-zinc-700">
              {events.length === 0 ? "No events yet." : JSON.stringify(events, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="h-full">
        {ChatWorkspace({
              className: "",
              compact: false,
              hideHeader: false,
              title: "Test Workspace",
              subtitle: "Testing the UI Library",
              participants: participants,
              messages: messages, // mockMessages
              // selectedMessageId: "",
              onMessageSelect: ((message: ChatMessage) => {}),
              placeholder: "placeholder",
              sendLabel: "Send",
              draft: "draft",
              defaultDraft: "default draft",
              onDraftChange: ((v) => {}),
              onSendMessage: sendChat,
              // mode?: string;
              // modeOptions?: string[];
              // onModeChange?: (mode: string) => void;
              // rightPanel?: React.ReactNode;
              // rightPanelWidth?: number;
              // rightPanelOpen?: boolean;
              // defaultRightPanelOpen?: boolean;
              // onRightPanelOpenChange?: (open: boolean) => void;
              // headerStartSlot?: React.ReactNode;
              // headerEndSlot?: React.ReactNode;
              // footerSlot?: React.ReactNode;
              // actionMenuItems?: LeftSidebarMenuItem[];
              // showActionMenuButton?: boolean;
              // actionMenuOpen?: boolean;
              // defaultActionMenuOpen?: boolean;
              // onActionMenuOpenChange?: (open: boolean) => void;
              // onActionMenuSelect?: (id: string) => void;
          })}
      </div>
    </div>
  );
}
