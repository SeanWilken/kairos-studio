import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileUp, Upload } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@myai-tech/myui";
import { createCoreApiClient, governanceApi, knowledgeApi, type KnowledgeDocument } from "../../../lib/api";
import { getAccessToken, subscribeAuthSession } from "../../../lib/auth-session";
import { readAuthorizedContext } from "../../../lib/auth-context";
import { getWorkspaceScope, subscribeWorkspaceScope, type WorkspaceScope } from "../../../lib/workspace-scope";
import { getRuntimeConfig } from "../../../config/runtime"

type UploadQueueItem = {
  id: string;
  filename: string;
  status: "queued" | "uploaded" | "failed";
  details?: string;
};

const visibilityScopes = ["private", "user", "group", "team", "org", "tenant", "restricted"] as const;

export function Knowledge() {
  const [tab, setTab] = useState("upload");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityScope, setVisibilityScope] = useState<(typeof visibilityScopes)[number]>("org");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [policyPrincipalId, setPolicyPrincipalId] = useState("");
  const [lastError, setLastError] = useState("");
  const runtimeConfig = getRuntimeConfig();
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const authorizedContext = readAuthorizedContext(accessToken);
  const tenantId = authorizedContext.tenantId ?? runtimeConfig.tenantId;
  const [workspaceScope, setWorkspaceScope] = useState<WorkspaceScope>(() => getWorkspaceScope(tenantId));
  const selectedOrgId = authorizedContext.orgId ?? "";

  useEffect(() => subscribeAuthSession(() => setAccessToken(getAccessToken())), []);
  useEffect(() => subscribeWorkspaceScope(setWorkspaceScope, tenantId), [tenantId]);

  const client = useMemo(
    () => createCoreApiClient({ baseUrl: runtimeBaseUrl, accessToken, scope: { tenantId, orgId: selectedOrgId || undefined } }),
    [runtimeBaseUrl, accessToken, tenantId, selectedOrgId],
  );

  const documentsQuery = useQuery({
    queryKey: ["knowledge", "documents", selectedOrgId, searchTerm],
    enabled: Boolean(accessToken && selectedOrgId),
    queryFn: async () => knowledgeApi.listDocuments(client, selectedOrgId, { search: searchTerm || undefined }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId) throw new Error("Select an organization first.");
      if (!files.length) throw new Error("Select at least one file.");

      const queueEntries = files.map((file) => ({ id: `${file.name}-${file.lastModified}`, filename: file.name, status: "queued" as const }));
      setUploadQueue(queueEntries);

      for (const file of files) {
        const rowId = `${file.name}-${file.lastModified}`;
        try {
          const result = await knowledgeApi.uploadFile(client, {
            org_id: selectedOrgId,
            file,
            title: title.trim() || file.name,
            summary: summary.trim() || undefined,
            tags_json: tags.trim() ? JSON.stringify(tags.split(",").map((item) => item.trim()).filter(Boolean)) : undefined,
            visibility_json: JSON.stringify({ scope: visibilityScope }),
            metadata_json: JSON.stringify({ source_type: "file" }),
          });

          setUploadQueue((previous) => previous.map((item) => (item.id === rowId ? {
            ...item,
            status: "uploaded",
            details: `${result.storage_backend ?? "storage"} • ${result.processing_status ?? "uploaded"}`,
          } : item)));
        } catch (error) {
          setUploadQueue((previous) => previous.map((item) => (item.id === rowId ? {
            ...item,
            status: "failed",
            details: error instanceof Error ? error.message : "Upload failed.",
          } : item)));
        }
      }
    },
    onSuccess: async () => {
      setFiles([]);
      await documentsQuery.refetch();
    },
    onError: (error) => setLastError(error instanceof Error ? error.message : "Upload failed."),
  });

  const policyDecisionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId || !policyPrincipalId.trim()) throw new Error("Org and principal are required.");
      return governanceApi.evaluatePolicyDecision(client, {
        org_id: selectedOrgId,
        principal_id: policyPrincipalId.trim(),
        principal_kind: "user",
        action: "knowledge.document.upload",
        resource: { visibility_scope: visibilityScope },
      });
    },
    onError: (error) => setLastError(error instanceof Error ? error.message : "Policy decision failed."),
  });

  const explainMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId || !policyPrincipalId.trim()) throw new Error("Org and principal are required.");
      return governanceApi.explainContextAccess(client, {
        org_id: selectedOrgId,
        principal_id: policyPrincipalId.trim(),
        principal_kind: "user",
        lens: "knowledge.resolve",
      });
    },
    onError: (error) => setLastError(error instanceof Error ? error.message : "Explain failed."),
  });

  const documents = documentsQuery.data?.items ?? [];
  const workspaceOrgMatchesToken = workspaceScope.type === "organization"
    ? workspaceScope.id === selectedOrgId
    : workspaceScope.type === "team"
      ? workspaceScope.orgId === selectedOrgId
      : !selectedOrgId;
  const selectedOrgLabel = workspaceOrgMatchesToken && workspaceScope.type !== "tenant"
    ? workspaceScope.name
    : selectedOrgId;

  const onFilesChosen = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles(Array.from(fileList));
  };

  const onDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFilesChosen(event.dataTransfer.files);
  };

  const statusBadge = (document: KnowledgeDocument) => {
    const status = document.processing_status ?? document.status ?? "unknown";
    if (status === "indexed") return <Badge className="bg-emerald-100 text-emerald-800">indexed</Badge>;
    if (status === "failed") return <Badge variant="destructive">failed</Badge>;
    if (status === "uploaded" || status === "extracting" || status === "extracted" || status === "indexing") {
      return <Badge className="bg-amber-100 text-amber-900">{status}</Badge>;
    }
    return <Badge variant="secondary">{String(status)}</Badge>;
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Knowledge Governance</h1>
        <p className="mt-1 text-zinc-600">Upload and inspect documents in the organization authorized by your current session.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pb-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Authorized organization</Label>
            <Input value={selectedOrgLabel || "No organization in current token"} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Visibility scope</Label>
            <Select value={visibilityScope} onValueChange={(value) => setVisibilityScope(value as (typeof visibilityScopes)[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityScopes.map((scope) => (
                  <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader><CardTitle className="text-base">Upload Files</CardTitle></CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div
                className="rounded-md border border-dashed border-zinc-300 p-6 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropFiles}
              >
                <FileUp className="mx-auto mb-2 h-6 w-6 text-zinc-500" />
                <p className="text-sm text-zinc-700">Drag and drop files here, or choose files</p>
                <Input type="file" multiple className="mt-3" onChange={(event) => onFilesChosen(event.target.files)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title override (optional)</Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Incident runbook" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tags CSV</Label>
                  <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="incident,ops" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Summary (optional)</Label>
                  <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => void uploadMutation.mutate()} disabled={!selectedOrgId || uploadMutation.isPending || files.length === 0}>
                  <Upload className="mr-2 h-4 w-4" />Upload files
                </Button>
              </div>
              {uploadQueue.length ? (
                <div className="space-y-2 rounded-md border border-zinc-200 p-3">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.filename}</span>
                      <span className={item.status === "failed" ? "text-red-700" : item.status === "uploaded" ? "text-emerald-700" : "text-zinc-600"}>
                        {item.status}{item.details ? ` • ${item.details}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3 pb-6">
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search documents" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name / Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.title ?? document.filename ?? document.id}</TableCell>
                      <TableCell>{document.source_type ?? "file"}</TableCell>
                      <TableCell>{document.content_type ?? "-"}</TableCell>
                      <TableCell>{typeof document.size_bytes === "number" ? `${document.size_bytes} B` : "-"}</TableCell>
                      <TableCell>{statusBadge(document)}</TableCell>
                      <TableCell>{document.updated_at ? new Date(document.updated_at).toLocaleString() : document.created_at ? new Date(document.created_at).toLocaleString() : "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!documents.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-zinc-500">
                        {documentsQuery.isLoading ? "Loading documents..." : "No documents found for the authorized organization."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Policy Preflight & Explain</CardTitle></CardHeader>
        <CardContent className="space-y-3 pb-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Principal user id</Label>
              <Input value={policyPrincipalId} onChange={(event) => setPolicyPrincipalId(event.target.value)} placeholder="user_..." />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void policyDecisionMutation.mutate()} disabled={!selectedOrgId || !policyPrincipalId.trim() || policyDecisionMutation.isPending}>Run policy decision</Button>
            <Button type="button" variant="outline" onClick={() => void explainMutation.mutate()} disabled={!selectedOrgId || !policyPrincipalId.trim() || explainMutation.isPending}>Run context explain</Button>
          </div>
          <pre className="max-h-[320px] overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs">{JSON.stringify({ policy_decision: policyDecisionMutation.data ?? null, context_explain: explainMutation.data ?? null }, null, 2)}</pre>
        </CardContent>
      </Card>

      {lastError || documentsQuery.isError || !selectedOrgId ? (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Knowledge request failed</AlertTitle>
          <AlertDescription>{lastError || (!selectedOrgId ? "Your current token has no organization context. Switch organization from the workspace menu before using Knowledge." : "Unable to load knowledge data.")}</AlertDescription>
        </Alert>
      ) : null}

      {uploadMutation.isSuccess ? (
        <Alert className="mt-4 border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Knowledge item saved. Processing status is shown in Documents.</AlertDescription>
        </Alert>
      ) : null}

    </div>
  );
}
