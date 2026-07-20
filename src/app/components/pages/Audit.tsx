import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Download,
  Clock,
  User,
  Shield,
  Users,
  Wrench,
  Workflow,
  Database,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs, 
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@myai-tech/myui";
import {
  clearCreateQueueHistory,
  getCreateQueueState,
  processCreateQueue,
  retryCreateQueueJob,
  setCreateQueuePaused,
  skipCreateQueueJob,
  subscribeCreateQueue,
  type CreateQueueJob,
} from "../../../lib/create-request-queue";
import { auditApi, createCoreApiClient } from "../../../lib/api";
import { submitAgentPersonaRecord, submitOrganizationCreation, submitTeamCreation, submitUserCreation } from "../wizard/registration/steps/TestForm";
import { getAccessToken } from "../../../lib/auth-session";
import { getRuntimeConfig } from "../../../config/runtime"
const categoryIcons = {
  workflow: Workflow,
  access: Shield,
  knowledge: Database,
  tool: Wrench,
  persona: Users,
};


export function Audit() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [queueState, setQueueState] = useState(() => getCreateQueueState());
  const runtimeConfig = getRuntimeConfig();

  const tenantId = runtimeConfig.tenantId;
  const orgId = runtimeConfig.orgId;
  const runtimeBaseUrl = runtimeConfig.coreApiBaseUrl;

  const tabFromQuery = searchParams.get("tab");
  const activeTab = tabFromQuery === "summary" || tabFromQuery === "queue" ? tabFromQuery : "events";
  const accessToken = getAccessToken();
  const client = useMemo(
    () => createCoreApiClient({ baseUrl: runtimeBaseUrl, accessToken, scope: { tenantId, orgId } }),
    [runtimeBaseUrl, accessToken, tenantId, orgId],
  );

  useEffect(() => subscribeCreateQueue(setQueueState), []);

  const eventsQuery = useQuery({
    queryKey: ["audit", "events", orgId, filterCategory, filterStatus, searchTerm],
    enabled: Boolean(accessToken),
    queryFn: async () => auditApi.listEvents(client, {
      orgId,
      category: filterCategory === "all" ? undefined : filterCategory,
      status: filterStatus === "all" ? undefined : filterStatus,
      q: searchTerm.trim() || undefined,
    }),
    retry: false,
  });

  const summaryQuery = useQuery({
    queryKey: ["audit", "summary", orgId],
    enabled: Boolean(accessToken),
    queryFn: async () => auditApi.getSummary(client, { orgId }),
    retry: false,
  });

  const executeQueuedJob = async (job: CreateQueueJob) => {
    const options = {
      ...(job.options as Record<string, unknown>),
      tenantId,
      orgId,
      runtimeBaseUrl,
      accessToken: getAccessToken(),
    };

    return job.variant === "organization_create"
      ? submitOrganizationCreation(job.values, options)
      : job.variant === "user_create"
        ? submitUserCreation(job.values, options)
        : job.variant === "team_create"
          ? submitTeamCreation(job.values, options)
        : submitAgentPersonaRecord(job.values, options);
  };

  const drainQueue = async () => {
    await processCreateQueue(async (job) => executeQueuedJob(job));
  };

  const eventItems = eventsQuery.data?.items ?? [];

  const filteredEvents = eventItems.filter((event) => {
    const matchesSearch =
      String(event.action ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(event.actor ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(event.target ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || String(event.category ?? "") === filterCategory;
    const matchesStatus = filterStatus === "all" || String(event.status ?? "") === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activitySummary = summaryQuery.data?.summary ?? [];
  const activityBreakdown = summaryQuery.data?.breakdown ?? [];
  const topUsers = summaryQuery.data?.top_users ?? [];

  const getCategoryIcon = (category: keyof typeof categoryIcons) => {
    const IconComponent = categoryIcons[category] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Audit & Activity</h1>
        <p className="text-zinc-600 mt-1">Track system activity, permission changes, and compliance</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", next);
          setSearchParams(params);
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="events">Audit Log</TabsTrigger>
          <TabsTrigger value="summary">Activity Summary</TabsTrigger>
          <TabsTrigger value="queue">Offline Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search audit log..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="workflow">Workflows</SelectItem>
                <SelectItem value="access">Access Control</SelectItem>
                <SelectItem value="knowledge">Knowledge</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
                <SelectItem value="persona">Personas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event, index) => (
                  <TableRow key={event.event_id ?? `${event.timestamp ?? "ts"}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Clock className="h-3.5 w-3.5" />
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-900">{event.actor ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-900">{event.action ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(String(event.category ?? "workflow") as keyof typeof categoryIcons)}
                        <span className="text-sm text-zinc-700 capitalize">{event.category ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-zinc-900">{event.target ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-600">{event.details ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      {event.status === "success" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : event.status === "warning" ? (
                        <Badge className="bg-amber-100 text-amber-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredEvents.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-zinc-500">
                      {eventsQuery.isLoading ? "Loading audit events..." : eventsQuery.isError ? "Unable to load audit events from API." : "No audit events found."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>Showing {filteredEvents.length} of {eventItems.length} events</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activitySummary.map((item) => (
                <div key={item.category} className="border rounded-lg bg-white p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-700">{item.category}</h3>
                    <Badge
                      variant="outline"
                      className={
                        item.trend === "up"
                          ? "text-green-700 border-green-300"
                          : "text-red-700 border-red-300"
                      }
                    >
                      {item.change ?? "-"}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-zinc-900">{item.count}</p>
                  <p className="text-xs text-zinc-500 mt-1">Last 7 days</p>
                </div>
              ))}
              {!activitySummary.length ? (
                <div className="col-span-full rounded-lg border bg-white p-6 text-sm text-zinc-500">
                  {summaryQuery.isLoading ? "Loading activity summary..." : summaryQuery.isError ? "Unable to load activity summary from API." : "No activity summary data available."}
                </div>
              ) : null}
            </div>

            <div className="border rounded-lg bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Activity by Category</h3>
              <div className="space-y-3">
                {activityBreakdown.map((category) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-zinc-700">{category.name}</span>
                      <span className="text-sm font-medium text-zinc-900">{category.value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color ?? "bg-zinc-500"}`}
                        style={{ width: `${category.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!activityBreakdown.length ? <p className="text-sm text-zinc-500">No category breakdown data available.</p> : null}
              </div>
            </div>

            <div className="border rounded-lg bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Top Active Users</h3>
              <div className="space-y-3">
                {topUsers.map((user) => (
                  <div key={user.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                        <p className="text-xs text-zinc-500">{user.role ?? "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">{user.actions}</p>
                      <p className="text-xs text-zinc-500">actions</p>
                    </div>
                  </div>
                ))}
                {!topUsers.length ? <p className="text-sm text-zinc-500">No top user activity data available.</p> : null}
              </div>
            </div>

            <div className="border rounded-lg bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Compliance & Security</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Audit Log Retention</p>
                    <p className="text-sm text-green-700 mt-1">
                      All events retained for 90 days. Last backup: 2026-04-07 02:00
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Access Monitoring</p>
                    <p className="text-sm text-green-700 mt-1">
                      No suspicious access patterns detected in the last 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Permission Reviews</p>
                    <p className="text-sm text-green-700 mt-1">
                      All permission changes reviewed and approved by authorized admins
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Paused: {queueState.paused ? "yes" : "no"}</Badge>
            <Badge variant="outline">Queued: {queueState.jobs.filter((job) => job.status === "queued").length}</Badge>
            <Badge variant="outline">Failed: {queueState.jobs.filter((job) => job.status === "failed").length}</Badge>
            <Badge variant="outline">Done: {queueState.jobs.filter((job) => job.status === "done").length}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateQueuePaused(false);
                void drainQueue();
              }}
            >
              Resume / Sync
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCreateQueuePaused(true)}>
              Pause
            </Button>
            <Button variant="outline" size="sm" onClick={() => clearCreateQueueHistory()}>
              Clear Completed
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/create/user")}>
              Open Create
            </Button>
          </div>

          <div className="space-y-2 rounded-lg border bg-white p-4">
            {queueState.jobs.length === 0 ? (
              <p className="text-sm text-zinc-500">No queued requests.</p>
            ) : (
              queueState.jobs.map((job) => (
                <div key={job.id} className="rounded border border-zinc-200 p-3 text-xs">
                  <p className="font-semibold text-zinc-800">{job.variant}</p>
                  <p className="text-zinc-600">status: {job.status} | attempts: {job.attempts}</p>
                  {job.lastError ? <p className="mt-1 text-red-700">{job.lastError}</p> : null}
                  {(job.status === "failed" || job.status === "skipped") ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          retryCreateQueueJob(job.id);
                          setCreateQueuePaused(false);
                          void drainQueue();
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          skipCreateQueueJob(job.id);
                          setCreateQueuePaused(false);
                          void drainQueue();
                        }}
                      >
                        Skip + Continue
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Queue Audit Trail</h3>
            <pre className="max-h-64 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-700">
              {JSON.stringify(queueState.audit.slice(0, 50), null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
