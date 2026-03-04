# ROADMAP.md — Milestones and Scope Control

## v0.x (Scaffold + Foundations)
- Monorepo structure (vue-table + optional table-core)
- Docs baseline: README, SPEC, ARCHITECTURE, CONTRIBUTING
- Playground/demo site
- JS fallback pipeline skeleton

## v1.0 (Stable, JS-first core)
- Vue component + headless composable
- Column system: visibility, reorder, resize, pinning
- Virtual scroll (JS) for large datasets (good enough baseline)
- Sorting/filtering (JS) incl nested paths and arrays
- Selection + expansion + basic inline editing
- CSV export (JS) + import preview UX (basic)
- A11y baseline keyboard nav

## v1.1 (WASM parity — performance unlock)
- Rust path resolver
- Rust virtual engine
- Rust sort/filter
- Rust CSV streaming parse/export
- Perf harness published

## v1.2 (Polish + plugins)
- Column autosize
- Undo/redo editing (optional)
- Router sync + persistence adapter package
- Better server-mode ergonomics

## v1.3+ (Optional AI/MCP addon)
- Separate package: agent interface + MCP server
- Strict permissions + audit hooks
