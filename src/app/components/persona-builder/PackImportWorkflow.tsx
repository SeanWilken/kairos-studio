import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileJson, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@kairosstack/ui";
import { createCoreApiClient, personaConfigApi, reviewsApi } from "../../../lib/api";

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function PackImportWorkflow(props: {
  client: ReturnType<typeof createCoreApiClient>;
}) {
  const { client } = props;
  const [payloadText, setPayloadText] = useState("{");
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [reviewStatus, setReviewStatus] = useState("pending_review");
  const [testCaseKey, setTestCaseKey] = useState("persona_resume_coherence");
  const [testPassed, setTestPassed] = useState(true);
  const [testNotes, setTestNotes] = useState("");
  const [error, setError] = useState("");

  const parsedPayload = useMemo(() => safeJsonParse(payloadText), [payloadText]);

  const reviewQueueQuery = useQuery({
    queryKey: ["persona-packs", "queue", reviewStatus],
    queryFn: async () => reviewsApi.listPacks(client, reviewStatus),
  });

  const selectedQueueQuery = useQuery({
    queryKey: ["persona-packs", "queue-item", selectedQueueId],
    enabled: Boolean(selectedQueueId),
    queryFn: async () => reviewsApi.getPack(client, selectedQueueId),
  });

  const dryRunMutation = useMutation({
    mutationFn: async () => {
      if (!parsedPayload) throw new Error("Payload is not valid JSON.");
      return personaConfigApi.importCatalog(client, parsedPayload, { dryRun: true });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Dry-run failed.");
    },
    onSuccess: () => setError(""),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedPayload) throw new Error("Payload is not valid JSON.");
      return personaConfigApi.importCatalog(client, parsedPayload, { dryRun: false });
    },
    onSuccess: async (result) => {
      setError("");
      const queueId = (result as { data?: { queue_id?: string } }).data?.queue_id;
      if (queueId) setSelectedQueueId(queueId);
      await reviewQueueQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Import failed.");
    },
  });

  const conversationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQueueId) throw new Error("Select a queue item first.");
      return reviewsApi.submitConversation(client, selectedQueueId, {
        test_case_key: testCaseKey,
        passed: testPassed,
        notes: testNotes,
      });
    },
    onSuccess: async () => {
      setError("");
      await selectedQueueQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Conversation test submit failed.");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQueueId) throw new Error("Select a queue item first.");
      return reviewsApi.approvePack(client, selectedQueueId, "Approved from Studio import workflow.");
    },
    onSuccess: async () => {
      setError("");
      await Promise.all([selectedQueueQuery.refetch(), reviewQueueQuery.refetch()]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Approve failed.");
    },
  });

  const installMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQueueId) throw new Error("Select a queue item first.");
      return reviewsApi.installPack(client, selectedQueueId);
    },
    onSuccess: async () => {
      setError("");
      await Promise.all([selectedQueueQuery.refetch(), reviewQueueQuery.refetch()]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Install failed.");
    },
  });

  const queueItems = ((reviewQueueQuery.data as { items?: Array<{ queue_id?: string; status?: string }> })?.items ?? []).filter(
    (item) => typeof item.queue_id === "string",
  );
  const selectedPack = (selectedQueueQuery.data as { status?: string; data?: Record<string, unknown> } | undefined) ?? undefined;
  const selectedStatus = typeof selectedPack?.status === "string" ? selectedPack.status : "";
  const canApprove = selectedStatus === "pending_review" || selectedStatus === "changes_requested";
  const canInstall = selectedStatus === "approved";
  const installedPersonaId =
    (installMutation.data as { data?: { installed_persona_id?: string } } | undefined)?.data?.installed_persona_id ??
    (selectedPack?.data as { installed_persona_id?: string } | undefined)?.installed_persona_id ??
    "";

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pack Import Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Config payload (JSON)</Label>
            <Textarea
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              className="min-h-[260px] font-mono text-xs"
              placeholder="Paste pack JSON payload"
            />
            <p className="text-xs text-zinc-500">Run dry-run first, then final import to enqueue review.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void dryRunMutation.mutate()}>
              <FileJson className="mr-2 h-4 w-4" />
              Dry-run import
            </Button>
            <Button type="button" onClick={() => void importMutation.mutate()}>
              <Upload className="mr-2 h-4 w-4" />
              Final import
            </Button>
          </div>

          {error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle>Import error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {dryRunMutation.data ? (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Dry-run completed</AlertTitle>
              <AlertDescription>
                {(dryRunMutation.data as { data?: { detected_schema?: string; warnings?: unknown[] } }).data?.detected_schema ?? "unknown schema"}
                {" "}
                with {((dryRunMutation.data as { data?: { warnings?: unknown[] } }).data?.warnings ?? []).length} warning(s).
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded border p-3">
            <p className="mb-2 text-sm font-medium">Review queue actions</p>
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">pending_review</SelectItem>
                  <SelectItem value="approved">approved</SelectItem>
                  <SelectItem value="installed">installed</SelectItem>
                  <SelectItem value="rejected">rejected</SelectItem>
                  <SelectItem value="changes_requested">changes_requested</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => void reviewQueueQuery.refetch()}>Refresh</Button>
            </div>

            <div className="mt-2 space-y-2">
              {queueItems.length === 0 ? (
                <p className="text-xs text-zinc-500">No queue items for this status.</p>
              ) : (
                queueItems.map((item) => (
                  <button
                    key={item.queue_id}
                    type="button"
                    onClick={() => setSelectedQueueId(item.queue_id ?? "")}
                    className={`w-full rounded border px-3 py-2 text-left text-xs ${selectedQueueId === item.queue_id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
                  >
                    {item.queue_id}
                    <span className="ml-2 opacity-80">({item.status})</span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 space-y-2">
              <Label>Conversation test case key</Label>
              <Input value={testCaseKey} onChange={(event) => setTestCaseKey(event.target.value)} />
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <input id="test-passed" type="checkbox" checked={testPassed} onChange={(event) => setTestPassed(event.target.checked)} />
                <Label htmlFor="test-passed">Mark test as passed</Label>
              </div>
              <Textarea placeholder="Notes" value={testNotes} onChange={(event) => setTestNotes(event.target.value)} />
              {selectedStatus ? (
                <p className="text-xs text-zinc-500">
                  Current status: <span className="font-medium">{selectedStatus}</span>
                </p>
              ) : null}
              {installedPersonaId ? (
                <p className="text-xs text-emerald-700">
                  Installed persona id: <span className="font-medium">{installedPersonaId}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void conversationMutation.mutate()} disabled={!selectedQueueId}>Submit conversation</Button>
                <Button type="button" variant="outline" onClick={() => void approveMutation.mutate()} disabled={!selectedQueueId || !canApprove}>Approve</Button>
                <Button type="button" onClick={() => void installMutation.mutate()} disabled={!selectedQueueId || !canInstall}>Install</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Queue Item</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedQueueId ? (
            <p className="text-sm text-zinc-500">Select a queue item to inspect extracted config and status.</p>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{selectedQueueId}</Badge>
              </div>
              <pre className="max-h-[560px] overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">
                {JSON.stringify(selectedQueueQuery.data ?? {}, null, 2)}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
