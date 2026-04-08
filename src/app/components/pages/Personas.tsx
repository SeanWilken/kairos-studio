import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  GitBranch,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs, TabsContent, TabsList, TabsTrigger,
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

const personas = [
  {
    id: 1,
    name: "Customer Support Agent",
    role: "Support Specialist",
    status: "active",
    version: "v2.3",
    scope: "Support Division",
    description: "Handles customer inquiries, ticket management, and basic troubleshooting",
    capabilities: ["email", "ticket_system", "knowledge_base"],
    guardrails: ["no_refunds_over_1000", "escalate_legal_issues"],
    testsPassed: 24,
    testsFailed: 1,
    lastUpdated: "2026-04-06",
  },
  {
    id: 2,
    name: "Data Analysis Assistant",
    role: "Analyst",
    status: "active",
    version: "v1.8",
    scope: "Engineering",
    description: "Analyzes datasets, generates reports, and provides insights",
    capabilities: ["database_read", "api_access", "report_generation"],
    guardrails: ["read_only_db", "no_pii_export"],
    testsPassed: 18,
    testsFailed: 0,
    lastUpdated: "2026-04-05",
  },
  {
    id: 3,
    name: "Code Review Bot",
    role: "Developer Assistant",
    status: "draft",
    version: "v0.5",
    scope: "Engineering",
    description: "Reviews pull requests and suggests improvements",
    capabilities: ["git_access", "code_analysis"],
    guardrails: ["no_auto_merge", "require_human_approval"],
    testsPassed: 12,
    testsFailed: 3,
    lastUpdated: "2026-04-07",
  },
  {
    id: 4,
    name: "Sales Outreach Agent",
    role: "Sales Assistant",
    status: "review",
    version: "v1.2",
    scope: "Sales Division",
    description: "Drafts personalized outreach emails and follows up with leads",
    capabilities: ["email", "crm_access", "calendar"],
    guardrails: ["no_discounts_without_approval", "max_3_followups"],
    testsPassed: 15,
    testsFailed: 2,
    lastUpdated: "2026-04-04",
  },
];

const testResults = [
  { id: 1, scenario: "Customer complaint about delayed shipment", result: "pass", response: "Correctly escalated to supervisor" },
  { id: 2, scenario: "Request for refund over $500", result: "pass", response: "Applied guardrail: requested manager approval" },
  { id: 3, scenario: "Technical troubleshooting question", result: "pass", response: "Referenced knowledge base article KB-245" },
  { id: 4, scenario: "Attempt to access restricted customer PII", result: "fail", response: "Guardrail failed: accessed restricted field" },
  { id: 5, scenario: "Multi-step ticket resolution", result: "pass", response: "Successfully completed all steps" },
];

export function Personas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<typeof personas[0] | null>(null);

  const filteredPersonas = personas.filter(
    (persona) =>
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTestHarness = (persona: typeof personas[0]) => {
    setSelectedPersona(persona);
    setTestDialogOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Persona Studio</h1>
        <p className="text-zinc-600 mt-1">Design agent personas with roles, capabilities, and guardrails</p>
      </div>

      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search personas..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPersonas.map((persona) => (
              <div key={persona.id} className="border rounded-lg bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">{persona.name}</h3>
                      <p className="text-sm text-zinc-600">{persona.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        persona.status === "active"
                          ? "default"
                          : persona.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        persona.status === "active"
                          ? "bg-green-100 text-green-800"
                          : persona.status === "review"
                          ? "bg-amber-100 text-amber-800"
                          : ""
                      }
                    >
                      {persona.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <GitBranch className="h-4 w-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-sm text-zinc-700 mb-4">{persona.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Scope</span>
                    <span className="font-medium text-zinc-900">{persona.scope}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Version</span>
                    <span className="font-medium text-zinc-900">{persona.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Last Updated</span>
                    <span className="font-medium text-zinc-900">{persona.lastUpdated}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-900">Capabilities</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-zinc-900">Guardrails</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.guardrails.map((guardrail) => (
                      <Badge key={guardrail} variant="secondary" className="text-xs">
                        {guardrail}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-zinc-700">{persona.testsPassed} passed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-zinc-700">{persona.testsFailed} failed</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openTestHarness(persona)}>
                    <Play className="h-4 w-4 mr-1.5" />
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="border rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Persona Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Customer Support", icon: MessageSquare, description: "Handle customer inquiries and support tickets" },
                { name: "Data Analyst", icon: Users, description: "Analyze data and generate insights" },
                { name: "Code Assistant", icon: Shield, description: "Help with code review and suggestions" },
              ].map((template) => (
                <button
                  key={template.name}
                  className="border rounded-lg p-6 text-left hover:border-zinc-400 hover:shadow-sm transition-all"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <template.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-1">{template.name}</h4>
                  <p className="text-xs text-zinc-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Persona Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Persona</DialogTitle>
            <DialogDescription>
              Define a new agent persona with capabilities and guardrails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="persona-name">Persona Name</Label>
                <Input id="persona-name" placeholder="e.g., Customer Support Agent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="persona-role">Role</Label>
                <Input id="persona-role" placeholder="e.g., Support Specialist" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona-description">Description</Label>
              <Textarea id="persona-description" placeholder="Describe what this persona does..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona-scope">Scope</Label>
              <Select>
                <SelectTrigger id="persona-scope">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="support">Support Division</SelectItem>
                  <SelectItem value="sales">Sales Division</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="persona-prompt">Prompt Seed</Label>
              <Textarea
                id="persona-prompt"
                placeholder="Enter the system prompt for this persona..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Create Persona</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Harness Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Harness: {selectedPersona?.name}</DialogTitle>
            <DialogDescription>
              Review test scenarios and behavior validation results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-zinc-900">Test Coverage</p>
                <p className="text-xs text-zinc-600">
                  {selectedPersona?.testsPassed} passed, {selectedPersona?.testsFailed} failed
                </p>
              </div>
              <Button size="sm">
                <Play className="h-4 w-4 mr-1.5" />
                Run All Tests
              </Button>
            </div>

            <div className="space-y-2">
              {testResults.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      {test.result === "pass" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{test.scenario}</p>
                        <p className="text-sm text-zinc-600 mt-1">{test.response}</p>
                      </div>
                    </div>
                    <Badge variant={test.result === "pass" ? "default" : "destructive"} className="text-xs">
                      {test.result}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
