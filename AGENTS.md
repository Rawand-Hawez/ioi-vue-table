# AGENTS.md — @ioi-dev/vue-table (Codex / AI Agent Context)

## Project Identity
- GitHub repo: ioi-vue-table
- Package name (locked): @ioi-dev/vue-table
- Product name (docs): IOI Vue Table
- Primary goal: performance-first Vue 3 datatable that stays approachable.
- Positioning: “AG Grid performance without the bloat. TanStack flexibility without the complexity.”

## Support Policy (Locked)
- Baseline: Vue 3.4+ stable (default build target).
- Vue 3.6: track compatibility via CI, but do not hard-depend on 3.6 preview behavior.
- Vapor Mode: NOT supported in v1.0. Plan as separate entry point later (e.g. @ioi-dev/vue-table/vapor) using function renderers instead of slots.

## Non-Negotiable Invariants
1) JS fallback is first-class.
   - Repo must work for contributors without Rust installed.
   - WASM is an accelerator, not a required dev dependency.
2) WASM boundary must remain low-overhead.
   - Rust returns indices/ranges, not cloned rows.
   - Avoid passing large JS objects across WASM.
3) Nested paths are foundational.
   - Dot notation + array indexing must work for read/write.
   - Null-safe: unresolved path never throws.
4) Public API remains small and stable.
   - Component + composable are the main surface.
   - Semantic events are versioned from day one.
5) Performance claims must be measurable.
   - Include benchmark harness in repo; avoid marketing-only claims.

## Repo Structure (Target)
- packages/vue-table            # published npm package @ioi-dev/vue-table
- packages/table-core           # Rust workspace (optional for local dev)
- packages/mcp-server (later)   # optional addon package

## Contributor Modes
- Mode A (default): Vue-only dev (JS pipeline + virtualization + tests) — no Rust required.
- Mode B (full): build WASM + run perf benches.

## Implementation Order (High-Level)
- Phase A: Vue core + JS pipeline + virtualization + selection + editing + CSV export + docs.
- Phase B: WASM parity (path resolver → virtual engine → sort/filter → CSV streaming).
- Phase C: AI/MCP addon (separate package), strict guardrails, audit hooks.

## Code Quality Rules
- TypeScript strict mode.
- No heavy runtime dependencies unless justified (bundle size discipline).
- Add tests for every bug fix.
- Avoid breaking changes in v1.x; use SemVer and deprecations.

## Semantic Events (Locked)
- All state-changing actions emit machine-readable payloads with schemaVersion.
- Guardrails exist for agent actions (auto/notify/confirm/forbid).

## Naming Conventions (Locked)
- Composable: useIoiTable()
- Component (recommended): <IoiTable />
- Internal identifiers: ioiTable* prefix
- WASM artifacts:
  - vue_table_engine.wasm
  - vue_table_csv.wasm
  - vue_table_engine.js / vue_table_csv.js

## “Won’t Do” / Out of Scope (v1.x)
- Pivoting, spreadsheet formulas, charts built-in, PDF export, print optimization, complex mobile gestures.