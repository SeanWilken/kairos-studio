# Repository Guide

## Purpose

`@myai-tech/studio` is the React control-plane frontend for configuring and operating a myAI/Core installation. Primary surfaces cover tenant/bootstrap status, organizations and users, personas, knowledge documents, tools, workflows, audit, and realtime diagnostics.

## Architecture

- React 18, TypeScript, Vite, Tailwind CSS 4, TanStack Query, and React Router.
- Shared UI components come from `@myai-tech/myui`; preserve its established visual and interaction patterns.
- `src/main.tsx` bootstraps the application and `src/routes.ts` defines routes.
- `src/app/components/layout/KairosShell.tsx` owns authenticated shell navigation and organization context switching.
- API transport and domain wrappers live in `src/lib/api/`.
- Runtime deployment configuration is resolved by `src/config/runtime.ts` from `window.__MYAI_CONFIG__` with `VITE_MYAI_*` fallback.
- Session tokens are managed by `src/lib/auth-session.ts`; JWT authorization context is interpreted by `src/lib/auth-context.ts`.
- The authenticated token context is authoritative. Do not let a page-local organization selector or persisted workspace scope diverge from the token's tenant/org claims.
- Core API lists may use domain-specific identifiers such as `org_id` and `document_id`; normalize these at the API boundary rather than spreading shape fallbacks through pages.
- Do not replace unavailable API data with convincing seeded data on operational screens. Show explicit loading, empty, unsupported, or error states.

## Commands

- Install: `bun install --frozen-lockfile`
- Develop: `bun run dev`
- Production build: `bunx vite build`
- Typecheck: `bunx tsc -b --pretty false`
- Tests: `bun test src`
- Changelog check: `bun scripts/check-changelog.mjs`
- Container build: `podman build -f Dockerfile -t myaitech/studio:local .`
- Compose run: `podman compose -f docker-compose.yml up -d --build`

The package scripts express the intended CI tasks, but verify them on the active shell/runtime before relying on them. Non-document changes require an entry in `CHANGELOG.md`.

## Contracts And Security

- Treat the versioned Core OpenAPI/contract artifacts as authoritative when available; do not infer mutation contracts from mock UI.
- Never commit access tokens, refresh tokens, provider keys, `.env` files, or generated runtime configuration containing secrets.
- Tokens currently use `localStorage`; this is documented pre-alpha security debt, not a production-ready session design.
