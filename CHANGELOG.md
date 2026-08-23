# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

## [0.1.0-rc.3] - 2026-08-23

- Bound displayed workspace and Knowledge organization context to the authenticated JWT and added guarded shell routes.
- Removed unsupported Knowledge note/reprocess actions and replaced fabricated Tools state with read-only live Core API data.
- Added runtime-config consistency, post-login session rollback, focused contract tests, and release/container metadata for `myaitech/studio`.

- Restored strict API client and knowledge graph typing, and added reproducible typecheck and container gates to CI.

- Added Bun-first Husky hooks for frontend build checks and changelog enforcement.
- Added conventional commit message enforcement via commitlint.
- Added GitHub CI workflow for frontend build validation and pull request changelog checks.
- Add API calls and get persona persistance and interactions proof of concept.
- Hook up more components from UI library
- Centralized /create routes
- A/B testing wizards layouts 
- Added websocket client utilities (`ws-client`) and shared incoming message parsing for realtime UI updates.
- Added automatic auth refresh-and-retry behavior on unauthorized API calls.
- Aligned governance endpoints to settings/baseline/grants/context-explain/policy-decision contracts.
- Reworked Knowledge into current-organization `Upload Files` and `Documents` workflows.
- Added multipart file upload client support for `/v1/knowledge/documents/upload`.
- Added supported knowledge document list and detail API client methods.
- Replaced hardcoded Audit log and Activity summary data with API-backed queries.
- Fixed multiple organization dropdown rendering bugs and setup progress deep-link behavior.
- Moved navigation collapse control from top header to left sidebar.
- Removed `Create Persona (OLD)` option from Create index UI.
- Added initial Docker packaging artifacts for POC image-based test runs.
- Added simplified container packaging for local image build/run (`Containerfile`, `Dockerfile`, `docker-compose.yml`).
- Rebranded UI dependency imports from `@kairosstack/ui` to `@myai-tech/myui`.
- Updated project/package/container naming defaults to `myAI` (`@myai-tech/studio`, `myaitech/studio`).
