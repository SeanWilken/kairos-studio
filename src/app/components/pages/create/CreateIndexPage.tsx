import { ArrowRight, Beaker, Building2, ShieldCheck, Users, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kairosstack/ui";

const createOptions = [
  {
    title: "Create User",
    description: "Enroll a user account, assign role defaults, and bootstrap global admin when needed.",
    href: "/create/user",
    icon: UserPlus,
    status: "Identity",
  },
  {
    title: "Create Organization",
    description: "Add a new organization workspace and establish ownership context.",
    href: "/create/organization",
    icon: Building2,
    status: "Workspace",
  },
  {
    title: "Create Team",
    description: "Create a team under an organization for scoped collaboration and workflows.",
    href: "/create/team",
    icon: Users,
    status: "Org Structure",
  },
  {
    title: "Create Persona",
    description: "Use the new full-height wizard with resume, chat preview, and advanced review tabs.",
    href: "/create/persona",
    icon: ShieldCheck,
    status: "Agent",
  },
  {
    title: "Create Persona (OLD)",
    description: "Legacy persona studio flow kept for reference while we validate the new wizard.",
    href: "/create/persona-ab",
    icon: Beaker,
    status: "Legacy",
  },
];

export function CreateIndexPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Create Records</h1>
        <p className="mt-1 text-zinc-600">Choose what you want to create. Each flow has its own form and validation path.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {createOptions.map((option) => (
          <Link key={option.href} to={option.href} className="block h-full">
            <Card className="h-full border-zinc-200 transition hover:border-zinc-900 hover:shadow-sm">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-zinc-100 p-2">
                    <option.icon className="h-5 w-5 text-zinc-700" />
                  </div>
                  <Badge variant="outline">{option.status}</Badge>
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between pt-0 pb-6">
                <p className="text-sm text-zinc-600">{option.description}</p>
                <p className="inline-flex items-center text-sm font-medium text-zinc-900">
                  Open flow
                  <ArrowRight className="ml-1 h-4 w-4" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
