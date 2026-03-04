# MONOREPO-SETUP.md — npm workspaces + tooling (Locked)

## Package Manager
- Use npm (not pnpm/yarn).
- Use npm workspaces for monorepo structure.

## Workspace Layout (Locked)
/
  package.json               # root workspace config
  packages/
    vue-table/               # @ioi/vue-table (published)
    table-core/              # Rust workspace (optional local dev)
    playground/              # Vite demo app using local workspace package

## Root package.json (Key Requirements)
- private: true
- workspaces: ["packages/*"]
- scripts must support:
  - dev: run playground dev server
  - build: build vue-table (no WASM requirement in v0)
  - test: run vue-table tests
  - lint/typecheck: TS checks for vue-table
  - format (optional)
- Ensure Vue-only mode works without Rust installed.

## Publishing
- Only packages/vue-table is published to npm.
- Root and playground are not published.

## Tooling Recommendations
- TypeScript strict
- Vite for builds
- Vitest for tests
- ESLint + Prettier (lightweight config)
- changesets for versioning (recommended for OSS)