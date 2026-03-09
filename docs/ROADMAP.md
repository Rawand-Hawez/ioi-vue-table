# ROADMAP.md — @ioi-dev/vue-table Development Roadmap

**Current Version**: `0.2.3`  
**Package**: `@ioi-dev/vue-table`  
**Last Updated**: 2026-03-09

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

### Known Limitations
- ⚠️ No horizontal virtualization (planned for v1.1)
- ⚠️ No row expansion/detail rows (planned for v1.0)
- ⚠️ No grouping/aggregation (planned for v1.0)
- ⚠️ No column grouping/multi-header (planned for v1.2)
- ⚠️ Memory cleanup needed for debounce timers (technical debt)

---

## 🚧 v1.0.0 — Stable MVP (IN PROGRESS)

**Target**: 2026-Q2  
**Focus**: Production-ready, feature-complete baseline

### Must-Have Features
- [ ] **Row Expansion**
  - Expandable detail rows (lazy rendered)
  - Expand/collapse all
  - Controlled expansion state
  
- [ ] **Grouping & Aggregation**
  - Basic 1-level collapsible grouping
  - Aggregations: sum/avg/count for group headers
  - Group-by column configuration
  
- [ ] **Server-Side Mode (Basic)**
  - Pagination: page-based or cursor-based
  - Lazy loading: infinite scroll with `fetchMore`
  - Debounced sort/filter/search to backend
  - Loading states: skeleton rows, error retry
  - Server-side grouping flag (disabled or delegated)
  
- [ ] **Accessibility Enhancements**
  - Full keyboard nav: arrows, Enter edit, Escape cancel, Space select
  - Focus management: visible focus rings
  - Focus trap in edit mode
  - Screen reader announcements (enhanced)
  
- [ ] **Polish & Stability**
  - Fix memory leak in debounce timers
  - Immutable patterns in editing workflow
  - Comprehensive test coverage (>85%)
  - Performance benchmarks published
  - Bundle size audit (<75KB target)
  
- [ ] **Documentation**
  - API reference (all props/events/methods)
  - Migration guide (from v0.x)
  - Examples gallery (10+ use cases)
  - Server-side integration guide
  - Best practices guide

### Nice-to-Have (May Slip to v1.1)
- [ ] Column auto-sizing (fit content)
- [ ] Row-level CSS class callbacks
- [ ] Dark mode prop support
- [ ] Tailwind preset package

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

### Backward Compatibility
- ✅ JS fallback always available
- ✅ No breaking changes to API
- ✅ WASM opt-in via separate entry point

---

## 🌟 v1.2.0 — Advanced Features

**Target**: 2026-Q4  
**Focus**: Power-user features and ergonomics

### Column Enhancements
- [ ] Column grouping / multi-header rows
- [ ] Column auto-sizing (fit content / fit all)
- [ ] Column menu (filter/sort/hide/pin)
- [ ] Frozen columns (separate from pinning)

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
- [ ] CSS custom properties for theming
- [ ] Dark mode auto-detection

---

## 🤖 v2.0.0 — AI/MCP Integration (FUTURE)

**Target**: 2027+  
**Focus**: AI-ready datatable with agent interface

### Separate Package: `@ioi-dev/vue-table-mcp`
- [ ] MCP server implementation
- [ ] Agent interface for table operations
- [ ] Permission system (read-only, controlled write, full access)
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
| v0.1.15 | 2026-03-06 | ✅ Released |
| v1.0.0-beta | 2026-05-01 | 🚧 In Progress |
| v1.0.0 | 2026-06-15 | ⏳ Planned |
| v1.1.0 | 2026-Q3 | ⏳ Planned |
| v1.2.0 | 2026-Q4 | ⏳ Planned |
| v2.0.0 | 2027+ | 🌟 Future |

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
