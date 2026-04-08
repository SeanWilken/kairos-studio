import { useState } from "react";

import {
  Building2,
  Users,
  UserPlus,
  ChevronRight,
  ChevronDown,
  Shield,
  Clock,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Key,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
} from "@kairosstack/ui";

interface OrgNode {
  id: string;
  name: string;
  type: "tenant" | "org" | "division";
  children?: OrgNode[];
  userCount?: number;
}

const orgHierarchy: OrgNode = {
  id: "tenant-1",
  name: "Acme Corporation",
  type: "tenant",
  children: [
    {
      id: "org-1",
      name: "Engineering",
      type: "org",
      userCount: 45,
      children: [
        { id: "div-1", name: "Backend Team", type: "division", userCount: 15 },
        { id: "div-2", name: "Frontend Team", type: "division", userCount: 12 },
        { id: "div-3", name: "DevOps Team", type: "division", userCount: 8 },
      ],
    },
    {
      id: "org-2",
      name: "Product",
      type: "org",
      userCount: 23,
      children: [
        { id: "div-4", name: "Product Management", type: "division", userCount: 10 },
        { id: "div-5", name: "Design", type: "division", userCount: 13 },
      ],
    },
    {
      id: "org-3",
      name: "Operations",
      type: "org",
      userCount: 18,
      children: [
        { id: "div-6", name: "Support", type: "division", userCount: 12 },
        { id: "div-7", name: "Sales", type: "division", userCount: 6 },
      ],
    },
  ],
};

const users = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@acme.com",
    role: "Global Admin",
    scope: "Tenant",
    division: "All Divisions",
    lastActive: "2026-04-07 14:30",
    status: "active",
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    email: "michael.r@acme.com",
    role: "Division Admin",
    scope: "Division",
    division: "Backend Team",
    lastActive: "2026-04-07 13:15",
    status: "active",
  },
  {
    id: 3,
    name: "Emily Watson",
    email: "emily.watson@acme.com",
    role: "Member",
    scope: "Division",
    division: "Frontend Team",
    lastActive: "2026-04-07 11:45",
    status: "active",
  },
  {
    id: 4,
    name: "James Kim",
    email: "james.kim@acme.com",
    role: "Org Admin",
    scope: "Organization",
    division: "Engineering",
    lastActive: "2026-04-06 16:20",
    status: "active",
  },
  {
    id: 5,
    name: "Anna Kowalski",
    email: "anna.k@acme.com",
    role: "Member",
    scope: "Division",
    division: "Design",
    lastActive: "2026-04-05 09:30",
    status: "invited",
  },
];

const auditLog = [
  {
    id: 1,
    timestamp: "2026-04-07 14:15",
    actor: "Sarah Chen",
    action: "Added user",
    target: "Anna Kowalski",
    details: "Role: Member, Division: Design",
  },
  {
    id: 2,
    timestamp: "2026-04-07 10:30",
    actor: "James Kim",
    action: "Updated role",
    target: "Michael Rodriguez",
    details: "Changed from Member to Division Admin",
  },
  {
    id: 3,
    timestamp: "2026-04-06 15:45",
    actor: "Sarah Chen",
    action: "Created division",
    target: "DevOps Team",
    details: "Under Engineering organization",
  },
  {
    id: 4,
    timestamp: "2026-04-06 12:00",
    actor: "Sarah Chen",
    action: "Revoked access",
    target: "John Smith",
    details: "Removed from Backend Team",
  },
];

function OrgTreeNode({ node, level = 0 }: { node: OrgNode; level?: number }) {
  const [expanded, setExpanded] = useState(level === 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tenant":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case "org":
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case "division":
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children && node.children.length > 0 && (
          <button className="p-0.5">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            )}
          </button>
        )}
        {(!node.children || node.children.length === 0) && <div className="w-5" />}
        {getTypeIcon(node.type)}
        <span className="text-sm font-medium text-zinc-900 flex-1">{node.name}</span>
        {node.userCount !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {node.userCount} users
          </Badge>
        )}
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <OrgTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Organization() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Organization & Access</h1>
        <p className="text-zinc-600 mt-1">
          Manage organizational structure, users, and permissions
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Users & Roles Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>

          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Division/Org</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-zinc-900">{user.name}</div>
                        <div className="text-sm text-zinc-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "Global Admin"
                            ? "default"
                            : user.role === "Division Admin" || user.role === "Org Admin"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{user.scope}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{user.division}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Clock className="h-3.5 w-3.5" />
                        {user.lastActive}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "default" : "secondary"}
                        className={
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {user.status}
                      </Badge>
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
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Scope Matrix */}
          <div className="border rounded-lg bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-zinc-700" />
              <h3 className="text-lg font-semibold text-zinc-900">Permission Scope Matrix</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-900">Capability</th>
                    <th className="text-center py-3 px-4 font-semibold text-zinc-900">Global Admin</th>
                    <th className="text-center py-3 px-4 font-semibold text-zinc-900">Org Admin</th>
                    <th className="text-center py-3 px-4 font-semibold text-zinc-900">Division Admin</th>
                    <th className="text-center py-3 px-4 font-semibold text-zinc-900">Member</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-zinc-700">Manage workspace settings</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-zinc-700">Create/edit personas</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-zinc-700">Deploy workflows</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-zinc-700">Manage users in scope</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-zinc-700">Upload knowledge documents</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-zinc-700">View audit logs</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">✓</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-medium">Partial</td>
                    <td className="py-3 px-4 text-center text-zinc-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy">
          <div className="border rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Organization Structure</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  Tenant → Organizations → Divisions hierarchy
                </p>
              </div>
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Add Division
              </Button>
            </div>
            <OrgTreeNode node={orgHierarchy} />
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <div className="border rounded-lg bg-white">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-zinc-900">Permission Change Audit Trail</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Complete history of all permission and access modifications
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Clock className="h-3.5 w-3.5" />
                        {entry.timestamp}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-zinc-900">{entry.actor}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-700">{entry.target}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-600">{entry.details}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Add a new user to your organization and assign their role and scope.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" placeholder="user@acme.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global-admin">Global Admin</SelectItem>
                  <SelectItem value="org-admin">Org Admin</SelectItem>
                  <SelectItem value="division-admin">Division Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="division">Division/Organization</Label>
              <Select>
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="backend">Backend Team</SelectItem>
                  <SelectItem value="frontend">Frontend Team</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setInviteDialogOpen(false)}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
