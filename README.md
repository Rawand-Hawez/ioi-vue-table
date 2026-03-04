# IOI Vue Table

IOI Vue Table is a performance-first Vue 3 datatable designed to stay approachable.

## Monorepo Layout

- `packages/vue-table` — publishable package (`@ioi/vue-table`)
- `packages/playground` — local development playground
- `packages/table-core` — Rust/WASM placeholder (optional, not required for default dev)

## Source-of-Truth Docs

- `AGENTS.md`
- `SPEC.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`

## Vue-only Quick Start (No Rust Required)

1. `npm install`
2. `npm run dev`

## Scripts

- `npm run dev` — starts playground in Vue-only mode
- `npm run build` — builds package + playground
- `npm run test` — runs package tests
- `npm run typecheck` — checks package + playground
- `npm run lint` — lints package + playground
- `npm run ci` — runs lint + typecheck + test + build
- `npm run build:wasm` — placeholder command (WASM intentionally not implemented)
