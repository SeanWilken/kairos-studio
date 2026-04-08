# @figma/my-make-file

This project was generated with Figma Make and is intended as a local React/Vite frontend workspace.

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
- `bun run check:frontend` - validates frontend build for local/CI checks.
- `bun run check:changelog` - validates that non-doc changes include `CHANGELOG.md` updates.

## Git hooks and CI policy

- Husky hooks:
  - `pre-commit` runs frontend build checks and changelog enforcement.
  - `commit-msg` enforces conventional commits via commitlint.
- GitHub Actions CI runs frontend build checks on push/PR and enforces changelog updates for pull requests.
