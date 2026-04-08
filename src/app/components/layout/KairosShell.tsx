import { Outlet, NavLink } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Workflow,
  Database,
  FileText,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  User,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from "@kairosstack/ui";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Organization", href: "/organization", icon: Building2 },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Knowledge", href: "/knowledge", icon: Database },
  { name: "Audit", href: "/audit", icon: FileText },
];

export function KairosShell() {
  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-zinc-900">Kairos Studio</h1>

          {/* Workspace Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-xs transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <Building2 className="h-4 w-4" />
                Production Workspace
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Building2 className="h-4 w-4 mr-2" />
                Production Workspace
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="h-4 w-4 mr-2" />
                Staging Workspace
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Building2 className="h-4 w-4 mr-2" />
                Development Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Manage Workspaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          {/* Core Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Core Connected</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-zinc-600" />
                </div>
                <span className="text-sm font-medium">Admin User</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <aside className="w-64 bg-white border-r border-zinc-200 flex-shrink-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
