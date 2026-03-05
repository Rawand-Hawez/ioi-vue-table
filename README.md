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

Playground runs at `http://localhost:5173` by default.

## Playground Demo Pages

The playground includes route-style demo pages (hash routes):

- `#/big-data` — 100,000 rows × 50 primitive columns for virtualization stress.
- `#/pinned-columns` — pinned left/right partitions with sizing and order torture actions.
- `#/ops-demo` — sort, filter, global search, and selection interactions with perf timing panel.

## Scripts

- `npm run dev` — starts playground in Vue-only mode
- `npm run build` — builds package + playground
- `npm run test` — runs package tests
- `npm run typecheck` — checks package + playground
- `npm run lint` — lints package + playground
- `npm run ci` — runs lint + typecheck + test + build
- `npm run build:wasm` — placeholder command (WASM intentionally not implemented)

## Status

- JS-first implementation is the active baseline and fully usable without Rust.
- WASM acceleration is planned as a later parity phase; it is not required for current development.
