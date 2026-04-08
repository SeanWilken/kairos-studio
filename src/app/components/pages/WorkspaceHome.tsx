import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  UserPlus,
  Users,
  Wrench,
  Workflow,
  Upload,
  ArrowRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  Button, 
  Progress,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kairosstack/ui";

const setupSteps = [
  { id: 1, label: "Core connection established", completed: true, timestamp: "2026-04-07 09:15" },
  { id: 2, label: "Organization structure configured", completed: true, timestamp: "2026-04-07 09:22" },
  { id: 3, label: "Initial persona created", completed: true, timestamp: "2026-04-07 10:08" },
  { id: 4, label: "Tool registry initialized", completed: false, timestamp: null },
  { id: 5, label: "First workflow deployed", completed: false, timestamp: null },
];

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Email tool credentials expiring",
    message: "SMTP credentials for Production division expire in 7 days",
    action: "Update Credentials",
  },
  {
    id: 2,
    type: "info",
    title: "Persona approval pending",
    message: "2 personas awaiting review before production deployment",
    action: "Review Personas",
  },
  {
    id: 3,
    type: "warning",
    title: "Knowledge sync delayed",
    message: "Document vectorization queue has 43 items pending",
    action: "View Queue",
  },
];

const quickActions = [
  {
    icon: UserPlus,
    label: "Invite User",
    description: "Add team members to your organization",
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    icon: Users,
    label: "Create Persona",
    description: "Define a new agent persona with capabilities",
    iconBg: "bg-purple-50 group-hover:bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    icon: Wrench,
    label: "Add Tool",
    description: "Register a new tool integration",
    iconBg: "bg-orange-50 group-hover:bg-orange-100",
    iconColor: "text-orange-600"
  },
  {
    icon: Workflow,
    label: "New Workflow",
    description: "Build a multi-agent workflow",
    iconBg: "bg-green-50 group-hover:bg-green-100",
    iconColor: "text-green-600"
  },
  {
    icon: Upload,
    label: "Upload Docs",
    description: "Add documents to knowledge base",
    iconBg: "bg-teal-50 group-hover:bg-teal-100",
    iconColor: "text-teal-600"
  },
];

export function WorkspaceHome() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const completedSteps = setupSteps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / setupSteps.length) * 100;

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Workspace Overview</h1>
        <p className="text-zinc-600 mt-1">Monitor your Studio environment and setup progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Core Status Card */}
        <div className="border rounded-lg bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Core Status</h2>
              <p className="text-sm text-zinc-600">System health and connectivity</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-zinc-700">Core Connection</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-zinc-700">API Gateway</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-zinc-700">Knowledge Index</span>
              <span className="text-sm font-medium text-green-600">Synced</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-zinc-700">Workflow Engine</span>
              <span className="text-sm font-medium text-green-600">Running</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Last health check</span>
              <span className="text-zinc-900 font-medium">2 minutes ago</span>
            </div>
          </div>
        </div>

        {/* Setup Progress */}
        <div className="border rounded-lg bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Setup Progress</h2>
          <p className="text-sm text-zinc-600 mb-4">Initial workspace configuration</p>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-700">{completedSteps} of {setupSteps.length} completed</span>
              <span className="text-sm font-medium text-zinc-900">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="space-y-3">
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-300 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.completed ? 'text-zinc-900' : 'text-zinc-500'}`}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {step.timestamp}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Needs Attention</h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg bg-white p-4 flex items-start gap-4 ${
                alert.type === 'warning' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500'
              }`}
            >
              {alert.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900">{alert.title}</h3>
                <p className="text-sm text-zinc-600 mt-0.5">{alert.message}</p>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                {alert.action}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setActiveModal(action.label)}
              className="border rounded-lg bg-white p-5 text-left hover:border-zinc-400 hover:shadow-sm transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${action.iconBg}`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">{action.label}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Skeleton */}
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeModal}</DialogTitle>
            <DialogDescription>
              This feature is ready for implementation. The modal structure is in place.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-sm text-zinc-600">
            Modal content for "{activeModal}" will be implemented based on specific requirements.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
