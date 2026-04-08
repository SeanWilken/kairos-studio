import { useState } from "react";
import {
  Workflow,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  GitBranch,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
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
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kairosstack/ui";

const workflows = [
  {
    id: 1,
    name: "Customer Onboarding",
    description: "Automated customer onboarding process with multi-step verification",
    status: "active",
    agents: ["Customer Support Agent", "Data Analysis Assistant"],
    triggers: ["New customer signup", "Manual trigger"],
    executions: 142,
    successRate: 98.5,
    lastRun: "2026-04-07 14:15",
    avgDuration: "3m 24s",
  },
  {
    id: 2,
    name: "Weekly Report Generation",
    description: "Generates and distributes weekly analytics reports to stakeholders",
    status: "active",
    agents: ["Data Analysis Assistant"],
    triggers: ["Schedule: Every Monday 9:00 AM"],
    executions: 24,
    successRate: 100,
    lastRun: "2026-04-07 09:00",
    avgDuration: "8m 12s",
  },
  {
    id: 3,
    name: "Support Ticket Triage",
    description: "Automatically categorizes and routes support tickets",
    status: "active",
    agents: ["Customer Support Agent"],
    triggers: ["New ticket created"],
    executions: 387,
    successRate: 95.2,
    lastRun: "2026-04-07 14:30",
    avgDuration: "45s",
  },
  {
    id: 4,
    name: "Sales Lead Qualification",
    description: "Evaluates and scores incoming sales leads",
    status: "paused",
    agents: ["Sales Outreach Agent", "Data Analysis Assistant"],
    triggers: ["New lead form submission"],
    executions: 67,
    successRate: 91.0,
    lastRun: "2026-04-05 11:22",
    avgDuration: "2m 15s",
  },
  {
    id: 5,
    name: "Code Review Workflow",
    description: "Automated PR review and feedback system",
    status: "draft",
    agents: ["Code Review Bot"],
    triggers: ["Pull request opened"],
    executions: 0,
    successRate: 0,
    lastRun: null,
    avgDuration: "—",
  },
];

const executionHistory = [
  {
    id: 1,
    workflow: "Customer Onboarding",
    status: "success",
    startTime: "2026-04-07 14:15",
    duration: "3m 12s",
    steps: 5,
  },
  {
    id: 2,
    workflow: "Support Ticket Triage",
    status: "success",
    startTime: "2026-04-07 14:30",
    duration: "42s",
    steps: 3,
  },
  {
    id: 3,
    workflow: "Support Ticket Triage",
    status: "failed",
    startTime: "2026-04-07 14:28",
    duration: "1m 8s",
    steps: 3,
    error: "API timeout on step 2",
  },
  {
    id: 4,
    workflow: "Weekly Report Generation",
    status: "success",
    startTime: "2026-04-07 09:00",
    duration: "8m 24s",
    steps: 7,
  },
  {
    id: 5,
    workflow: "Customer Onboarding",
    status: "success",
    startTime: "2026-04-07 13:42",
    duration: "3m 18s",
    steps: 5,
  },
];

export function Workflows() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<typeof workflows[0] | null>(null);

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openConfig = (workflow: typeof workflows[0]) => {
    setSelectedWorkflow(workflow);
    setConfigDialogOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Workflows & Agent Network</h1>
        <p className="text-zinc-600 mt-1">Build multi-agent workflows and orchestration logic</p>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search workflows..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Workflow className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-zinc-900">{workflow.name}</h3>
                        <Badge
                          variant={
                            workflow.status === "active"
                              ? "default"
                              : workflow.status === "paused"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            workflow.status === "active"
                              ? "bg-green-100 text-green-800"
                              : workflow.status === "paused"
                              ? "bg-amber-100 text-amber-800"
                              : ""
                          }
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-600 mb-3">{workflow.description}</p>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Executions</p>
                          <p className="text-sm font-medium text-zinc-900">{workflow.executions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Success Rate</p>
                          <p className="text-sm font-medium text-zinc-900">{workflow.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Avg Duration</p>
                          <p className="text-sm font-medium text-zinc-900">{workflow.avgDuration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Last Run</p>
                          <p className="text-sm font-medium text-zinc-900">
                            {workflow.lastRun || "Never"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Users className="h-4 w-4 text-zinc-600" />
                            <span className="text-xs font-medium text-zinc-700">Agents</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {workflow.agents.map((agent) => (
                              <Badge key={agent} variant="outline" className="text-xs">
                                {agent}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <GitBranch className="h-4 w-4 text-zinc-600" />
                            <span className="text-xs font-medium text-zinc-700">Triggers</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {workflow.triggers.map((trigger) => (
                              <Badge key={trigger} variant="secondary" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {workflow.status === "active" ? (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-1.5" />
                        Pause
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1.5" />
                        Activate
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openConfig(workflow)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="h-4 w-4 mr-2" />
                          Test Run
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions">
          <div className="border rounded-lg bg-white">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-zinc-900">Recent Executions</h3>
              <p className="text-sm text-zinc-600 mt-1">
                View workflow execution history and performance metrics
              </p>
            </div>
            <div className="divide-y">
              {executionHistory.map((execution) => (
                <div key={execution.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    {execution.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">{execution.workflow}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {execution.startTime}
                        </div>
                        <span>•</span>
                        <span>Duration: {execution.duration}</span>
                        <span>•</span>
                        <span>{execution.steps} steps</span>
                      </div>
                      {execution.error && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span>{execution.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={execution.status === "success" ? "default" : "destructive"}
                    className={
                      execution.status === "success"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {execution.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Build a multi-agent workflow with triggers and orchestration logic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input id="workflow-name" placeholder="e.g., Customer Onboarding" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-trigger">Trigger Type</Label>
              <Select>
                <SelectTrigger id="workflow-trigger">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                  <SelectItem value="schedule">Scheduled (Cron)</SelectItem>
                  <SelectItem value="event">Event-Based</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                After creating the workflow, you'll be able to add agents, configure steps, and define the execution flow in the visual workflow builder.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure: {selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>
              Adjust workflow settings and safety adapters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="retry-config">Max Retry Attempts</Label>
              <Select defaultValue="3">
                <SelectTrigger id="retry-config">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No retries</SelectItem>
                  <SelectItem value="1">1 retry</SelectItem>
                  <SelectItem value="3">3 retries</SelectItem>
                  <SelectItem value="5">5 retries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout-config">Execution Timeout</Label>
              <Select defaultValue="300">
                <SelectTrigger id="timeout-config">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="safety-adapter">Safety Adapter</Label>
              <Select defaultValue="standard">
                <SelectTrigger id="safety-adapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setConfigDialogOpen(false)}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
