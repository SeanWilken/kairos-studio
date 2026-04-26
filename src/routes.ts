import { createBrowserRouter } from "react-router";
import { KairosShell } from "./app/components/layout/KairosShell";
import { WorkspaceHome } from "./app/components/pages/WorkspaceHome";
import { FirstRunLanding } from "./app/components/pages/FirstRunLanding";
import { Organization } from "./app/components/pages/Organization";
import { Personas } from "./app/components/pages/Personas";
import { Tools } from "./app/components/pages/Tools";
import { LoginPage } from "./app/components/pages/Login";
import { NotFoundPage } from "./app/components/pages/NotFound";
import { Workflows } from "./app/components/pages/Workflows";
import { Knowledge } from "./app/components/pages/Knowledge";
import { Audit } from "./app/components/pages/Audit";
import { RealtimeLabPage } from "./app/components/pages/RealtimeLab";
import { CreateOrganizationPage, CreateTeamPage, CreateUserPage } from "./app/components/pages/create/CreateRecordsPage";
import { CreatePersonaStudioPage } from "./app/components/pages/create/CreatePersonaStudioPage";
import { CreatePersonaStudioABPage } from "./app/components/pages/create/CreatePersonaStudioABPage";
import { CreateIndexPage } from "./app/components/pages/create/CreateIndexPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: KairosShell,
    children: [
      { index: true, Component: FirstRunLanding },
      { path: "overview", Component: WorkspaceHome },
      { path: "create", 
        children: [
          { index: true, Component: CreateIndexPage },
          { path: "organization", Component: CreateOrganizationPage },
          { path: "user", Component: CreateUserPage },
          { path: "team", Component: CreateTeamPage },
          { path: "persona", Component: CreatePersonaStudioABPage },
          { path: "persona-ab", Component: CreatePersonaStudioPage },
        ]
      },
      { path: "organization", 
        children: [
          { index: true, Component: Organization },
          { path: "*", Component: Organization },
        ]
      },
      { path: "personas", Component: Personas },
      { path: "tools", Component: Tools },
      { path: "workflows", Component: Workflows },
      { path: "knowledge", Component: Knowledge },
      { path: "audit", Component: Audit },
      { path: "realtime", Component: RealtimeLabPage },
      { path: "initialize", Component: FirstRunLanding },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
