import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, FileUp, RefreshCw, Upload } from "lucide-react";
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
import { createCoreApiClient, governanceApi, knowledgeApi, studioApi, type KnowledgeDocument, type StudioOrganization } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth-session";
import { getRuntimeConfig } from "../../../config/runtime"


function normalizeItems<T>(value: unknown): T[] {
  if (Array.isArray((value as { items?: unknown })?.items)) return (value as { items: T[] }).items;
  return Array.isArray(value) ? (value as T[]) : [];
}

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
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [visibilityScope, setVisibilityScope] = useState<(typeof visibilityScopes)[number]>("org");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [policyPrincipalId, setPolicyPrincipalId] = useState("");
  const [lastError, setLastError] = useState("");
  const runtimeConfig = getRuntimeConfig();
  const tenantId = runtimeConfig.tenantId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;
  const accessToken = getAccessToken();

  const client = useMemo(
    () => createCoreApiClient({ baseUrl: runtimeBaseUrl, accessToken, scope: { tenantId, orgId: selectedOrgId || undefined } }),
    [runtimeBaseUrl, accessToken, tenantId, selectedOrgId],
  );

  const organizationsQuery = useQuery({
    queryKey: ["knowledge", "organizations", tenantId],
    enabled: Boolean(accessToken),
    queryFn: async () => normalizeItems<StudioOrganization>(await studioApi.listOrganizations(client)),
  });

  useEffect(() => {
    const organizations = organizationsQuery.data ?? [];
    if (!organizations.length) return;
    if (!selectedOrgId || !organizations.some((organization) => organization.id === selectedOrgId)) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizationsQuery.data, selectedOrgId]);

  const documentsQuery = useQuery({
    queryKey: ["knowledge", "documents", selectedOrgId, searchTerm],
    enabled: Boolean(accessToken && selectedOrgId),
    queryFn: async () => knowledgeApi.listDocuments(client, selectedOrgId, { search: searchTerm || undefined }),
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrgId) throw new Error("Select an organization first.");
      if (!noteTitle.trim() || !noteContent.trim()) throw new Error("Note title and content are required.");
      return knowledgeApi.createNote(client, {
        org_id: selectedOrgId,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        summary: summary.trim() || undefined,
        tags_json: tags.trim() ? JSON.stringify(tags.split(",").map((item) => item.trim()).filter(Boolean)) : undefined,
        visibility_json: JSON.stringify({ scope: visibilityScope }),
      });
    },
    onSuccess: async () => {
      setLastError("");
      setNoteTitle("");
      setNoteContent("");
      setTab("documents");
      await documentsQuery.refetch();
    },
    onError: (error) => setLastError(error instanceof Error ? error.message : "Create note failed."),
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

  const reprocessMutation = useMutation({
    mutationFn: async (documentId: string) => knowledgeApi.reprocessDocument(client, documentId),
    onSuccess: async () => {
      await documentsQuery.refetch();
    },
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
  const organizationOptions = organizationsQuery.data ?? [];
  const selectedOrgValue = organizationOptions.some((organization) => organization.id === selectedOrgId)
    ? selectedOrgId
    : undefined;
  const selectedOrgLabel = organizationOptions.find((organization) => organization.id === selectedOrgValue)?.name;

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
        <p className="mt-1 text-zinc-600">Distinct file uploads and notes with a clear processing lifecycle.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pb-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Organization</Label>
            <Select value={selectedOrgValue} onValueChange={setSelectedOrgId}>
              <SelectTrigger>
                <span className="truncate text-left text-sm">{selectedOrgLabel ?? "Select organization"}</span>
              </SelectTrigger>
              <SelectContent>
                {organizationOptions.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <TabsTrigger value="note">Create Knowledge Note</TabsTrigger>
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

        <TabsContent value="note">
          <Card>
            <CardHeader><CardTitle className="text-base">Create Knowledge Note</CardTitle></CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Release checklist notes" />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea value={noteContent} onChange={(event) => setNoteContent(event.target.value)} rows={8} placeholder="Write markdown or plain text note content..." />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => void createNoteMutation.mutate()} disabled={!selectedOrgId || createNoteMutation.isPending}>
                  Create note
                </Button>
              </div>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={reprocessMutation.isPending}
                          onClick={() => void reprocessMutation.mutate(document.id)}
                        >
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />Reprocess
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!documents.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-sm text-zinc-500">
                        {documentsQuery.isLoading ? "Loading documents..." : "No documents found for this organization."}
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

      {lastError || organizationsQuery.isError || documentsQuery.isError ? (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Knowledge request failed</AlertTitle>
          <AlertDescription>{lastError || "Unable to load knowledge data."}</AlertDescription>
        </Alert>
      ) : null}

      {uploadMutation.isSuccess || createNoteMutation.isSuccess ? (
        <Alert className="mt-4 border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Knowledge item saved. Processing status is shown in Documents.</AlertDescription>
        </Alert>
      ) : null}

      {reprocessMutation.isPending ? (
        <Alert className="mt-4 border-amber-200 bg-amber-50">
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Reprocess in progress</AlertTitle>
          <AlertDescription>Refreshing document processing status...</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
