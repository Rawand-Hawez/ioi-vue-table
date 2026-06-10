# ROADMAP.md — @ioi-dev/vue-table Development Roadmap

**Current Version**: `0.2.5`  
**Package**: `@ioi-dev/vue-table`  
**Last Updated**: 2026-04-13

---

## 🎯 Vision

AG Grid performance without the bloat. TanStack flexibility without the complexity.

---

## ✅ v0.1.x — Foundation (COMPLETE)

**Status**: Released  
**Focus**: Core architecture and baseline features

### Implemented Features
- ✅ Monorepo structure (`vue-table` + `table-core`)
- ✅ Vue 3.4+ component (`<Table>`, `<IoiTable>`, `<DataTable>` aliases)
- ✅ Headless composable (`useIoiTable`)
- ✅ Index-based data pipeline (memory-efficient)
- ✅ Column system:
  - ✅ Visibility (show/hide)
  - ✅ Reorder (drag-and-drop within pin groups)
  - ✅ Resize (drag handles)
  - ✅ Pinning (left/right)
  - ✅ Width constraints (min/max)
  - ✅ Percent-width support
- ✅ Virtualization (vertical, JS-based)
- ✅ Sorting:
  - ✅ Multi-column sort
  - ✅ Custom comparators
  - ✅ Stable sort (nulls last)
  - ✅ Nested path support
- ✅ Filtering:
  - ✅ Per-column filters (text/number/date)
  - ✅ Global search
  - ✅ Case-insensitive by default
  - ✅ Array value matching
  - ✅ Debounced updates
- ✅ Selection:
  - ✅ Single/multi mode
  - ✅ Shift-range select
  - ✅ SelectAll (visible/filtered/allLoaded scopes)
  - ✅ Key-based (requires `rowKey`)
- ✅ Editing:
  - ✅ Staged inline edits
  - ✅ Column validation
  - ✅ Commit/cancel workflow
  - ✅ Semantic `data:modify` events
- ✅ CSV Export:
  - ✅ Multiple scopes (visible/filtered/selected/allLoaded)
  - ✅ Formula sanitization (security)
  - ✅ Nested object flattening
  - ✅ Array JSON serialization
- ✅ CSV Import:
  - ✅ Delimiter autodetection
  - ✅ Preview with validation
  - ✅ Auto-mapping (case-insensitive)
  - ✅ Type coercion (number/date)
  - ✅ JSON array parsing
- ✅ Pagination (controlled mode)
- ✅ Keyboard navigation (basic)
- ✅ ARIA roles and live regions
- ✅ Semantic versioned events (`schemaVersion: 1`)
- ✅ Documentation baseline (README, SPEC, ARCHITECTURE)

### Known Limitations (current at v0.2.5)
- ⚠️ No horizontal virtualization (planned for v1.1)
- ⚠️ Single-level column groups only — nested groups planned for v1.2
- ⚠️ No RTL support (planned for v1.2)

---

## 🚧 v1.0.0 — API Freeze + Stability (PLANNED)

**Target**: 2026-Q2 (≈ 2026-06-08)
**Focus**: Lock the public surface, raise the quality bar — **not** a feature release.

The features the original v1.0 plan gated on (row expansion, grouping/aggregation, server-side mode, enhanced a11y) all shipped in v0.1.18 – v0.2.0. v0.2.5 added the last missing primitive (column groups) plus row drag-and-drop, clipboard copy, and the minimal CSS tier. v1.0 is therefore a stability release.

### Work items (see [v1.0-PLAN.md](./v1.0-PLAN.md) for detail)
- [ ] **Public-API surface freeze** + snapshot test (`test/public-api.spec.ts`)
- [ ] **Documentation truth-up** — all docs reflect shipping code; no stale `fetch:` / `:fetch-fn` references
- [ ] **SemVer commitments** documented; event payload `schemaVersion: 1` frozen for v1.x
- [ ] **TypeScript matrix CI** (5.3.3 / 5.7.3 / 5.9.3); `vue-tsc` declaration emit clean
- [ ] **SSR safety audit** — `<Table>` rendered via `@vue/server-renderer` without crash
- [ ] **A11y gate** — axe-core, 0 violations on default / unstyled / minimal / grouped / server fixtures
- [ ] **Bundle-size CI gate** — gzip ESM ≤ 55 KB, minified ESM ≤ 90 KB, `minimal.css` ≤ 4 KB gzip
- [ ] **Benchmark regression report** — soft gate, posts PR comment if any of the 8 scenarios regresses > 15 %
- [ ] **Migration guide consolidation** — single `MIGRATION.md` with v0.1→v0.2, v0.2→v0.2.5, v0.2.5→v1.0
- [ ] **Release rehearsal** — `release/v1.0.0-rc.1` published with `--tag next`; `npm pack --dry-run` audited

### Breaking changes
None from v0.2.5. `DataTable` alias gets a `@deprecated` JSDoc tag, scheduled for removal in v2.0.

---

## 🔮 v1.1.0 — WASM Performance Layer

**Target**: 2026-Q3  
**Focus**: Optional Rust/WASM acceleration

### WASM Modules (Optional Addon)
- [ ] **Path Resolver (Rust)**
  - Drop-in replacement for `nestedPath.get/set/has`
  - Identical JS API
  - Fallback to JS if WASM unavailable
  
- [ ] **Virtual Engine (Rust)**
  - Viewport range calculation
  - Offset computation
  - Target: 100k+ rows @ 60fps
  
- [ ] **Sort/Filter (Rust)**
  - Parallel sorting
  - Vectorized filtering
  - Target: 100k sort <100ms, filter <50ms
  
- [ ] **CSV Streaming (Rust)**
  - Streaming parse (memory-efficient for large files)
  - Streaming export (chunked)
  - Target: 10MB parse <1s

### Performance Infrastructure
- [ ] Benchmark harness published
- [ ] Performance comparison docs (JS vs WASM)
- [ ] WASM size optimization (<50KB target)

### Other v1.1 work (non-WASM)
- [ ] Horizontal virtualization (architectural prerequisite for many v1.2 items)
- [ ] Dark mode prop / `prefers-color-scheme` auto-detection
- [ ] Theme tokens via CSS custom properties

### Backward Compatibility
- ✅ JS fallback always available
- ✅ No breaking changes to API
- ✅ WASM opt-in via separate entry point

---

## 🌟 v1.2.0 — Advanced Features

**Target**: 2026-Q4  
**Focus**: Power-user features and ergonomics

### Column Enhancements
- [ ] Nested column groups (single-level shipped in v0.2.5)
- [ ] Column menu (filter/sort/hide/pin)
- [ ] RTL support
- [ ] Frozen columns (separate from pinning)

> Column auto-sizing (`autoSizeColumns`) shipped in v0.2.4.

### Editing Enhancements
- [ ] Undo/redo stack (optional)
- [ ] Bulk edit mode (multi-cell)
- [ ] Edit validation UI (inline errors)
- [ ] Custom cell editors (slots)

### State Management
- [ ] Router sync (URL-based state)
- [ ] Persistence adapters (localStorage, IndexedDB, custom)
- [ ] State snapshot/restore API

### Server-Side Mode (Advanced)
- [ ] Optimistic updates
- [ ] Retry logic with backoff
- [ ] Real-time updates (WebSocket support)
- [ ] Query builder integration

### Styling
- [ ] Official Tailwind preset
- [ ] Bootstrap preset

> CSS custom properties + dark mode planned for v1.1.

### MCP Bridge
- [ ] `useMcpBridge` composable for AI agent integration
- [ ] `@ioi-dev/vue-table-mcp` server package (Node.js, WebSocket)
- [ ] 8 read-oriented tools: `table_get_summary`, `table_get_rows`, `table_sort`, `table_filter`, `table_select_rows`, `table_clear_selection`, `table_export_csv`, `table_get_column_state`
- [ ] Permission model (`read`, `filter`, `select`, `export`, `edit`) with server-side enforcement

---

## 🤖 v2.0.0 — AI/MCP Advanced (FUTURE)

**Target**: 2027+  
**Focus**: Full AI agent integration, multi-table orchestration, audit guardrails

> **Note**: Core MCP bridge ships in v1.2. v2.0.0 covers the advanced tier: multi-table coordination, write-mode permissions, and guardrail policies.

### Advanced MCP (`@ioi-dev/vue-table-mcp` v2)
- [ ] Multi-table coordination (single MCP server, multiple tables)
- [ ] Write-mode permissions (row edit, bulk update via agent)
- [ ] Audit hooks for all mutations
- [ ] Guardrails (auto/notify/confirm/forbid modes)

### Agent Capabilities
- [ ] Natural language queries
- [ ] Automated data exploration
- [ ] Smart filtering/sorting suggestions
- [ ] Anomaly detection hooks

### Security
- [ ] Sandboxed agent operations
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Revocation mechanism

---

## 📊 Performance Targets

| Metric | v1.0 (JS) | v1.1 (WASM) | Status |
|--------|-----------|-------------|--------|
| Virtual scroll (100k rows) | 60fps | 60fps | ✅ Target met |
| Sort (100k rows) | ~200ms | <100ms | 🚧 Needs benchmark |
| Filter (100k rows) | ~150ms | <50ms | 🚧 Needs benchmark |
| CSV parse (10MB) | ~3s | <1s | 🚧 Needs benchmark |
| Bundle size (JS) | <75KB | N/A | ✅ Current: ~45KB |
| Bundle size (WASM) | N/A | <50KB | ⏳ Not started |

---

## 🚫 Out of Scope (v1.x-v2.0)

These features are **explicitly excluded** per SPEC.md:

- ❌ Pivoting
- ❌ Spreadsheet formulas
- ❌ Built-in charts/sparklines
- ❌ PDF export
- ❌ Print optimization
- ❌ Advanced mobile gestures
- ❌ Vapor mode support (planned for v3.0+)

---

## 🗓️ Release Schedule

| Version | Target Date | Status |
|---------|-------------|--------|
| v0.2.3 | 2026-03-09 | ✅ Released |
| v0.2.4 | 2026-04-04 | ✅ Released |
| v0.2.5 | 2026-04-13 | ✅ Released — minimal CSS, row reorder, clipboard copy, column groups |
| v1.0.0-rc.1 | 2026-05 | ⏳ Planned — see [v1.0-PLAN.md](./v1.0-PLAN.md) |
| v1.0.0 | 2026-06 | ⏳ Planned — API freeze, SemVer, quality gates |
| v1.1.0 | 2026-Q3 | ⏳ Planned — WASM perf layer, horizontal virtualization, dark mode |
| v1.2.0 | 2026-Q4 | ⏳ Planned — MCP bridge, nested column groups, RTL, router sync |
| v2.0.0 | 2027+ | ⏳ Planned — MCP advanced tier, drop `DataTable` alias |

---

## 🔄 Versioning Strategy

- **0.x.x**: Pre-release, breaking changes allowed
- **1.x.x**: Stable, SemVer strict
  - Minor versions: new features (backward-compatible)
  - Patch versions: bug fixes only
- **2.x.x**: Major architectural changes (AI integration)

---

## 📝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- PR requirements
- Testing standards

---

## 📚 Related Docs

- [SPEC.md](./SPEC.md) — Feature specification
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical design
- [AGENTS.md](./AGENTS.md) — AI agent context
- [RELEASE.md](./RELEASE.md) — Release process
