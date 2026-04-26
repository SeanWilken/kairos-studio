import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Shield,
  Mail,
  Globe,
  Database,
  FileText,
  Calendar,
  Code,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Switch,
} from "@kairosstack/ui";

type ToolCategory = "email" | "api" | "database" | "filesystem" | "calendar" | "custom";
type ToolStatus = "active" | "pending_approval";
type RiskLevel = "low" | "medium" | "high";

type ToolItem = {
  id: number;
  name: string;
  category: ToolCategory;
  status: ToolStatus;
  secretsConfigured: boolean;
  scope: string;
  approvalRequired: boolean;
  riskLevel: RiskLevel;
  usageCount: number;
  lastUsed: string | null;
};

type ApprovalRequest = {
  id: number;
  tool: string;
  requester: string;
  requestDate: string;
  reason: string;
  riskLevel: "medium" | "high";
};

const toolCategories: Record<
  ToolCategory,
  { icon: typeof Mail; iconContainerClassName: string }
> = {
  email: { icon: Mail, iconContainerClassName: "bg-blue-50 text-blue-600" },
  api: { icon: Globe, iconContainerClassName: "bg-green-50 text-green-600" },
  database: { icon: Database, iconContainerClassName: "bg-purple-50 text-purple-600" },
  filesystem: { icon: FileText, iconContainerClassName: "bg-orange-50 text-orange-600" },
  calendar: { icon: Calendar, iconContainerClassName: "bg-teal-50 text-teal-600" },
  custom: { icon: Code, iconContainerClassName: "bg-zinc-100 text-zinc-600" },
};

const toolsSeed: ToolItem[] = [
  {
    id: 1,
    name: "Email Service",
    category: "email",
    status: "active",
    secretsConfigured: true,
    scope: "All Divisions",
    approvalRequired: false,
    riskLevel: "low",
    usageCount: 342,
    lastUsed: "2026-04-07 14:22",
  },
  {
    id: 2,
    name: "Customer CRM API",
    category: "api",
    status: "active",
    secretsConfigured: true,
    scope: "Sales Division",
    approvalRequired: true,
    riskLevel: "medium",
    usageCount: 158,
    lastUsed: "2026-04-07 13:45",
  },
  {
    id: 3,
    name: "Analytics Database",
    category: "database",
    status: "active",
    secretsConfigured: true,
    scope: "Engineering",
    approvalRequired: false,
    riskLevel: "medium",
    usageCount: 89,
    lastUsed: "2026-04-07 11:30",
  },
  {
    id: 4,
    name: "Document Storage",
    category: "filesystem",
    status: "active",
    secretsConfigured: true,
    scope: "All Divisions",
    approvalRequired: false,
    riskLevel: "low",
    usageCount: 234,
    lastUsed: "2026-04-07 10:15",
  },
  {
    id: 5,
    name: "Payment Gateway",
    category: "api",
    status: "pending_approval",
    secretsConfigured: false,
    scope: "Sales Division",
    approvalRequired: true,
    riskLevel: "high",
    usageCount: 0,
    lastUsed: null,
  },
  {
    id: 6,
    name: "Calendar Integration",
    category: "calendar",
    status: "active",
    secretsConfigured: true,
    scope: "All Divisions",
    approvalRequired: false,
    riskLevel: "low",
    usageCount: 127,
    lastUsed: "2026-04-06 16:20",
  },
];

const approvalsSeed: ApprovalRequest[] = [
  {
    id: 1,
    tool: "Payment Gateway",
    requester: "Sarah Chen",
    requestDate: "2026-04-07 09:00",
    reason: "Enable automated payment processing for sales workflow",
    riskLevel: "high",
  },
  {
    id: 2,
    tool: "External Analytics API",
    requester: "James Kim",
    requestDate: "2026-04-06 14:30",
    reason: "Pull marketing analytics for monthly reports",
    riskLevel: "medium",
  },
];

async function fetchTools(): Promise<ToolItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return toolsSeed;
}

async function fetchApprovalQueue(): Promise<ApprovalRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return approvalsSeed;
}

export function Tools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [secretsDialogOpen, setSecretsDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  const toolsQuery = useQuery({
    queryKey: ["tools", "registry"],
    queryFn: fetchTools,
  });

  const approvalQueueQuery = useQuery({
    queryKey: ["tools", "approvalQueue"],
    queryFn: fetchApprovalQueue,
  });

  const tools = toolsQuery.data ?? [];
  const approvalQueue = approvalQueueQuery.data ?? [];

  const filteredTools = useMemo(
    () =>
      tools.filter((tool) =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [tools, searchTerm],
  );

  const openSecretsDialog = useCallback((tool: ToolItem) => {
    setSelectedTool(tool);
    setSecretsDialogOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<ToolItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tool",
        cell: ({ row }) => {
          const tool = row.original;
          const category = toolCategories[tool.category];
          const CategoryIcon = category.icon;

          return (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.iconContainerClassName}`}
              >
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-zinc-900">{tool.name}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge
                    variant={tool.status === "active" ? "default" : "secondary"}
                    className={
                      tool.status === "active"
                        ? "bg-green-100 text-xs text-green-800"
                        : "bg-amber-100 text-xs text-amber-800"
                    }
                  >
                    {tool.status}
                  </Badge>
                  {tool.approvalRequired && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Approval Req.
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm capitalize text-zinc-700">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "scope",
        header: "Scope",
        cell: ({ row }) => <span className="text-sm text-zinc-700">{row.original.scope}</span>,
      },
      {
        accessorKey: "riskLevel",
        header: "Risk Level",
        cell: ({ row }) => {
          const riskLevel = row.original.riskLevel;
          return (
            <Badge
              variant="outline"
              className={
                riskLevel === "high"
                  ? "border-red-300 text-red-700"
                  : riskLevel === "medium"
                    ? "border-amber-300 text-amber-700"
                    : "border-green-300 text-green-700"
              }
            >
              {riskLevel}
            </Badge>
          );
        },
      },
      {
        id: "secrets",
        header: "Secrets",
        cell: ({ row }) => {
          const tool = row.original;

          return (
            <button
              onClick={() => openSecretsDialog(tool)}
              className="flex items-center gap-1.5 text-sm hover:underline"
            >
              {tool.secretsConfigured ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">Pending</span>
                </>
              )}
            </button>
          );
        },
      },
      {
        accessorKey: "usageCount",
        header: "Usage",
        cell: ({ row }) => (
          <span className="text-sm text-zinc-700">{row.original.usageCount} calls</span>
        ),
      },
      {
        accessorKey: "lastUsed",
        header: "Last Used",
        cell: ({ row }) =>
          row.original.lastUsed ? (
            <div className="flex items-center gap-1.5 text-sm text-zinc-600">
              <Clock className="h-3.5 w-3.5" />
              {row.original.lastUsed}
            </div>
          ) : (
            <span className="text-sm text-zinc-400">Never</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const tool = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSecretsDialog(tool)}>
                  <Key className="mr-2 h-4 w-4" />
                  Manage Secrets
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Tool
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [openSecretsDialog],
  );

  const table = useReactTable({
    data: filteredTools,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Tools & Integrations</h1>
        <p className="mt-1 text-zinc-600">Manage tool registry, integrations, and access controls</p>
      </div>

      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registry">Tool Registry</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {approvalQueue.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                {approvalQueue.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search tools..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tool
            </Button>
          </div>

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.id === "actions" ? "w-12" : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {toolsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-500">
                      Loading tools...
                    </TableCell>
                  </TableRow>
                ) : toolsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-red-600">
                      Unable to load tools.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-500">
                      No tools match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="rounded-lg border bg-white">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold text-zinc-900">Pending Approvals</h3>
              <p className="mt-1 text-sm text-zinc-600">Review and approve tool access requests</p>
            </div>
            <div className="divide-y">
              {approvalQueueQuery.isLoading ? (
                <div className="p-6 text-sm text-zinc-500">Loading approvals...</div>
              ) : approvalQueueQuery.isError ? (
                <div className="p-6 text-sm text-red-600">Unable to load approvals.</div>
              ) : (
                approvalQueue.map((request) => (
                  <div key={request.id} className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <h4 className="text-base font-semibold text-zinc-900">{request.tool}</h4>
                          <Badge
                            variant="outline"
                            className={
                              request.riskLevel === "high"
                                ? "border-red-300 text-red-700"
                                : "border-amber-300 text-amber-700"
                            }
                          >
                            {request.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-zinc-600">{request.reason}</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                          <span>Requested by {request.requester}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {request.requestDate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
            <DialogDescription>
              Register a new tool integration for your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input id="tool-name" placeholder="e.g., Slack API" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-category">Category</Label>
              <Select>
                <SelectTrigger id="tool-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="filesystem">File System</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-scope">Scope</Label>
              <Select>
                <SelectTrigger id="tool-scope">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="sales">Sales Division</SelectItem>
                  <SelectItem value="support">Support Division</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="approval-required">Require Approval</Label>
                <p className="text-sm text-zinc-500">Requests must be approved before use</p>
              </div>
              <Switch id="approval-required" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>Add Tool</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={secretsDialogOpen} onOpenChange={setSecretsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Secrets: {selectedTool?.name}</DialogTitle>
            <DialogDescription>
              Configure API keys and credentials. Values are encrypted and never displayed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Security Notice</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Secrets are encrypted at rest. Once saved, values cannot be retrieved, only
                    replaced.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="Enter API key..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input id="api-secret" type="password" placeholder="Enter API secret..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input id="endpoint" placeholder="https://api.example.com" />
            </div>
            {selectedTool?.secretsConfigured && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Current secrets configured on {new Date().toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecretsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSecretsDialogOpen(false)}>Save Secrets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
