# CODEX-PR-PLAN.md — First PRs (Do This In Order)

## PR1 — Scaffold + Docs + Workspaces
- Add root npm workspaces package.json
- Create packages/vue-table, packages/playground, packages/table-core placeholders
- Add docs: AGENTS.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md, CONTRIBUTING.md, README.md
- Add LICENSE (MIT), CODE_OF_CONDUCT.md (Contributor Covenant), SECURITY.md (basic)
- Add .editorconfig, .gitignore
- Add basic GitHub Actions CI:
  - install, lint, typecheck, test (Vue-only)
- Playground runs with `npm run dev` at repo root

## PR2 — @ioi/vue-table skeleton (no features yet)
- Implement minimal exports:
  - Component: DataTable (or IoiTable) placeholder rendering header/body
  - Composable: useIoiTable() returning stable API shape
  - Types: ColumnDef, DataTableOptions, TableState skeleton
- Events and slots declared but minimal
- Ensure package builds with Vite library mode
- Ensure types emit cleanly

## PR3 — Basic Column Rendering + Minimal Virtualization (JS)
- Implement vertical virtualization (fixed row height)
- Render visible rows only
- Add overscan support
- Add minimal column widths + header row

## PR4 — Nested Path Resolver (JS fallback)
- Implement useNestedPath.get/set/has with dot + array indexing
- Add tests for edge cases (null-safe)

## PR5 — Sorting + Filtering (JS)
- Sorting single/multi with stable sort
- Filtering per-column + global search
- All ops index-based (no row clones)

Stop here and publish v0.1.0 as “scaffold + early preview”.