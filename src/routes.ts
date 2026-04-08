import { createBrowserRouter } from "react-router";
import { KairosShell } from "./app/components/layout/KairosShell";
import { WorkspaceHome } from "./app/components/pages/WorkspaceHome";
import { Organization } from "./app/components/pages/Organization";
import { Personas } from "./app/components/pages/Personas";
import { Tools } from "./app/components/pages/Tools";
import { Workflows } from "./app/components/pages/Workflows";
import { Knowledge } from "./app/components/pages/Knowledge";
import { Audit } from "./app/components/pages/Audit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: KairosShell,
    children: [
      { index: true, Component: WorkspaceHome },
      { path: "organization", Component: Organization },
      { path: "personas", Component: Personas },
      { path: "tools", Component: Tools },
      { path: "workflows", Component: Workflows },
      { path: "knowledge", Component: Knowledge },
      { path: "audit", Component: Audit },
    ],
  },
]);
