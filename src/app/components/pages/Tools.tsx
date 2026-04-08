import { useState } from "react";
import {
  Wrench,
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

const toolCategories = {
  email: { icon: Mail, color: "blue" },
  api: { icon: Globe, color: "green" },
  database: { icon: Database, color: "purple" },
  filesystem: { icon: FileText, color: "orange" },
  calendar: { icon: Calendar, color: "teal" },
  custom: { icon: Code, color: "zinc" },
};

const tools = [
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

const approvalQueue = [
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

export function Tools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [secretsDialogOpen, setSecretsDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null);

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openSecretsDialog = (tool: typeof tools[0]) => {
    setSelectedTool(tool);
    setSecretsDialogOpen(true);
  };

  const getToolIcon = (category: keyof typeof toolCategories) => {
    const config = toolCategories[category];
    return <config.icon className="h-5 w-5" />;
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Tools & Integrations</h1>
        <p className="text-zinc-600 mt-1">Manage tool registry, integrations, and access controls</p>
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search tools..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </div>

          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Secrets</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${toolCategories[tool.category as keyof typeof toolCategories].color}-50 flex items-center justify-center`}>
                          {getToolIcon(tool.category as keyof typeof toolCategories)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900">{tool.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={tool.status === "active" ? "default" : "secondary"}
                              className={
                                tool.status === "active"
                                  ? "bg-green-100 text-green-800 text-xs"
                                  : "bg-amber-100 text-amber-800 text-xs"
                              }
                            >
                              {tool.status}
                            </Badge>
                            {tool.approvalRequired && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Approval Req.
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700 capitalize">{tool.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{tool.scope}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tool.riskLevel === "high"
                            ? "text-red-700 border-red-300"
                            : tool.riskLevel === "medium"
                            ? "text-amber-700 border-amber-300"
                            : "text-green-700 border-green-300"
                        }
                      >
                        {tool.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{tool.usageCount} calls</span>
                    </TableCell>
                    <TableCell>
                      {tool.lastUsed ? (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <Clock className="h-3.5 w-3.5" />
                          {tool.lastUsed}
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Configuration
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSecretsDialog(tool)}>
                            <Key className="h-4 w-4 mr-2" />
                            Manage Secrets
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Tool
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="border rounded-lg bg-white">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-zinc-900">Pending Approvals</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Review and approve tool access requests
              </p>
            </div>
            <div className="divide-y">
              {approvalQueue.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-semibold text-zinc-900">{request.tool}</h4>
                        <Badge
                          variant="outline"
                          className={
                            request.riskLevel === "high"
                              ? "text-red-700 border-red-300"
                              : "text-amber-700 border-amber-300"
                          }
                        >
                          {request.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">{request.reason}</p>
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
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Tool Dialog */}
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

      {/* Secrets Management Dialog */}
      <Dialog open={secretsDialogOpen} onOpenChange={setSecretsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Secrets: {selectedTool?.name}</DialogTitle>
            <DialogDescription>
              Configure API keys and credentials. Values are encrypted and never displayed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Security Notice</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Secrets are encrypted at rest. Once saved, values cannot be retrieved, only replaced.
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
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
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
