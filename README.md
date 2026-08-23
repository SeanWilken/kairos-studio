# @myai-tech/studio

This project was generated with Figma Make and is intended as a local React/Vite frontend workspace.

Current pre-release: `0.1.0-rc.3`. The canonical container image is `myaitech/studio:0.1.0-rc.3`.

## Attribution and licenses

This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under the [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## Component storage strategy

Store generated UI components locally in this repository (recommended), typically under `src/app/components/ui/`.

Why local first:
- Easier to edit generated component code directly.
- Safer when iterating quickly from Figma output.
- Simpler to align with your real schemas and API contracts.

You can extract shared components into an internal package later once patterns stabilize.

## Scripts

- `bun run build` - builds the app with Vite.
- `bun run typecheck` - runs strict TypeScript project checks.
- `bun run test` - runs focused contract tests with Bun.
- `bun run check:frontend` - validates frontend build for local/CI checks.
- `bun run check:changelog` - validates that non-doc changes include `CHANGELOG.md` updates.

## Persona Builder + Import Workflow

Studio now supports a complete persona profile pipeline across builder, import/review, and installed persona retrieval.

- Resume builder (`/create/persona`) captures `orgId`, `scope`, `modelProfile`, `headline`, `summary`, communication preferences, guidelines, tools, and system prompt override.
- Import/review tab covers:
  - `POST /v1/persona-config/import?dry_run=true`
  - `POST /v1/persona-config/import`
  - `GET /v1/reviews/packs`
  - `GET /v1/reviews/packs/{queue_id}`
  - `POST /v1/reviews/packs/{queue_id}/conversation`
  - `POST /v1/reviews/packs/{queue_id}/approve`
  - `POST /v1/reviews/packs/{queue_id}/install`
- Install action now surfaces `installed_persona_id` when available and only enables install for approved queue items.
- Installed personas tab supports:
  - `GET /v1/studio/personas?org_id=...`
  - `GET /v1/studio/personas/{persona_id}`
  - `GET /v1/studio/personas/{persona_id}/export-resume`
- `Prefill Builder` maps export/detail payloads back into builder draft values for edit/resume UX.

### Profile Contract Mapping

The app layer maps profile-like fields into persona payloads:

- Identity: `name`, `role`, `industry`, `headline`, `summary`
- Scope and model: `scope` -> `scope`, `modelProfile` -> `model_profile`
- Behavior: `traits`, `communicationStyle`, `initiativeLevel`, `tone`
- Guardrails: `doList`, `dontList`, `guardrails`
- Capabilities: `tools`
- Prompting: `systemPromptOverride` or generated prompt -> `system_prompt`

Persona create persistence uses `POST /v1/studio/personas` with normalized `data` payload keys.

## Git hooks and CI policy

- Husky hooks:
  - `pre-commit` runs frontend build checks and changelog enforcement.
  - `commit-msg` enforces conventional commits via commitlint.
- GitHub Actions CI runs frontend build checks on push/PR and enforces changelog updates for pull requests.

## Pre-alpha security debt

Studio currently persists access and refresh tokens in `localStorage`. This remains documented pre-alpha debt and must be replaced with a hardened session architecture before a production release.
