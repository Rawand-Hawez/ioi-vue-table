# SPEC.md — IOI Vue Table (v1.0 Locked Feature Specification)

## 1) Executive Summary
IOI Vue Table is a performance-first, AI-ready, open-source datatable for Vue 3 that bridges the gap between TanStack Table’s flexibility and vue-good-table-next’s simplicity. It targets 100k+ rows at 60fps via a hybrid Rust-WASM + TypeScript architecture while keeping a low learning curve.

## 2) Target Audience
- Vue 3 developers building data-intensive apps (1k–100k rows)
- Teams wanting AG Grid-like performance without enterprise pricing
- Developers who find TanStack Table too complex but simpler tables too limited

## 3) Core Value Proposition
“AG Grid’s performance without the bloat. TanStack’s flexibility without the complexity.”

## 4) Locked Feature Set (v1.0 MVP)

### Performance
- Vertical virtualization: 100k+ rows @ 60fps (target; JS fallback acceptable until WASM parity)
- Horizontal virtualization: 50+ columns @ 60fps (target)
- Overscan buffer configurable (default 5 rows/cols)
- Smooth scrolling with native scroll + transform positioning (implementation detail may vary)

### Column System
- ColumnDef supports: field, header, width (px/%), minWidth, maxWidth
- Column state uses stable IDs: explicit `column.id` first, otherwise `String(column.field)`
- Hidden columns
- Sticky pinning left/right
- Pin partitions are derived as `pinnedLeft`, `center`, `pinnedRight`; horizontal windowing is not applied in v1 JS path
- Drag-to-resize with persistence (adapter-based)
- Width clamping and normalization (locked):
  - numeric widths are rounded to integer pixels
  - invalid widths (`NaN`, non-finite, `<= 0`) fall back to `minWidth` when present, otherwise default `160px`
  - `minWidth` and `maxWidth` are normalized to positive integers; when `maxWidth < minWidth`, `maxWidth` is clamped up to `minWidth`
- Percent width handling (locked):
  - percent-width columns are non-resizable in v1 UI
  - resize attempts on percent-width columns are ignored
- Drag-to-reorder
- Reorder rule across pin partitions (locked):
  - header drag reorder is allowed only within the same pin group (`left`, `center`, `right`)
  - cross-group drops are ignored (pin state is not auto-rewritten during reorder)

### Complex Data Handling
- Nested object access via dot notation: user.profile.name
- Array index access: tags.0, items.2.price
- Array display modes: join, chips, count (with max display limit)
- Array editing: inline tag add/remove (v1 may ship basic add/remove UX)
- Null safety: unresolved path does not throw

### Data Operations (Client-side)
- Sorting: single + multi, custom functions
- Sorting is stable (equal keys preserve prior order)
- Null/undefined values sort last in both asc and desc modes
- Date sorting accepts `Date` objects and ISO-8601 strings; invalid dates are treated as null (last)
- Filtering: per-column (text/number/date) + global search
- Processing pipeline order is locked: `baseIndices -> filteredIndices -> sortedIndices -> visibleIndices`
- Text filter defaults to `contains` and is case-insensitive by default; `equals` and `startsWith` are supported in v1
- Number filter operators: `eq`, `lt`, `lte`, `gt`, `gte`, `between` (inclusive range)
- Date filter operators: `before`, `after`, `on` (`on` matches the same UTC calendar day)
- Date filters accept `Date` objects and ISO-8601 strings; invalid row dates are treated as null and never match date predicates
- All filter field access uses nested paths (`nestedPath.get`)
- Array rule for text/global search: treat arrays as "any element matches" after stringifying each element
- Global search is case-insensitive and scans visible (non-hidden) configured columns only
- Grouping: basic 1-level collapsible grouping (no pivot)
- Aggregation: sum/avg/count for group headers

### Row Operations
- Selection: single/multi with checkbox, shift-range select, selectAll (scope-aware)
- Selection state stores row keys (`selectedRowKeys`) and is key-based
- `rowKey` is required for selection actions; if `rowKey` is missing, selection APIs are disabled with a dev warning
- Shift-range selection is computed over the current `sortedIndices` order
- `selectAll` scopes: `visible` (viewport window), `filtered` (sorted+filtered rows), `allLoaded` (all local rows)
- Expansion: expandable row details (lazy rendered)
- Editing: staged inline cell editing with local draft state, commit/cancel actions, optional per-column `validate(value, row)`, and semantic `data:modify` events on commit

### Server-side Mode
- Pagination: page-based or cursor-based
- Lazy loading: infinite scroll with fetchMore
- Debounced sort/filter/search to backend
- Loading states: skeleton rows, error retry
NOTE: In server-mode v1, grouping/aggregation is either disabled or delegated to backend explicitly (must be defined in server contract).

### CSV Import/Export
- Export (JS in v1 baseline): `exportCSV(options?)`
- Export scopes:
  - `visible` → current viewport window (`visibleIndices`)
  - `filtered` → current filtered+sorted set (`sortedIndices`) **default**
  - `selected` → selected row keys intersected with currently loaded rows
  - `allLoaded` → all local rows (`baseIndices`)
- Column inclusion:
  - default exports visible columns only (`hidden !== true`)
  - `includeHiddenColumns: true` exports all configured columns
- Header mode:
  - default `headerMode: "field"` (field paths as headers)
  - optional `headerMode: "header"` (column header labels)
- Flattening (locked):
  - if a column field resolves to a nested object, export flattens to dot-notation columns using path semantics compatible with `nestedPath.get`
  - null/undefined export as empty cells
  - arrays export as `JSON.stringify(array)` (canonical and stable for JS/WASM parity)
- CSV formatting (locked):
  - quote fields containing comma, quote, or newline (and delimiter-aware quoting when delimiter is overridden)
  - escape quotes by doubling (`"` → `""`)
- Import API (JS in v1 baseline):
  - `parseCSV(fileOrText, options?)` returns preview model
  - `commitCSVImport(mapping?, options?)` commits parsed rows
- Import parse behavior (locked):
  - delimiter autodetect supports comma/semicolon/tab
  - first row is treated as headers by default (`hasHeader: true`)
  - no-header mode is supported (`hasHeader: false`)
  - default preview row limit is 200 (`previewRowLimit`)
- Import mapping (locked):
  - auto-map is case-insensitive header -> `column.field`
  - mapping override model is supported before commit
- Import validation (locked):
  - each mapped value is validated by column type (`number`/`date`) and then `column.validate(value, row)` if defined
  - preview returns row-level validation errors
- Import array parsing (locked):
  - if trimmed cell starts with `[` and ends with `]`, import attempts `JSON.parse`
  - parse success with array result -> use parsed array
  - parse failure -> keep original raw string

### Styling & Theming
- Headless option: useIoiTable() composable
- CSS variables for core tokens
- Optional Tailwind preset
- Dark mode: prop or auto
- Conditional row/cell classes

### Accessibility
- Keyboard nav: arrows, Enter edit, Escape cancel, Space select
- ARIA grid roles and rowindex/selected
- Focus management: visible focus rings; trap focus in edit mode

### Developer Experience
- Full TypeScript inference on row type T
- Slots: cell, header, empty, loading, expanded-row
- Events: row-click, cell-update, selection-change, sort-change, filter-change, state-change
- Exposed methods: scrollToRow(), exportCSV(), parseCSV(), commitCSVImport(), resetState(), setColumnFilter(), clearColumnFilter(), setGlobalSearch(), clearAllFilters(), toggleRow(), isSelected(), clearSelection(), selectAll(), getSelectedKeys()

## 5) Out of Scope (Explicit)
- Pivoting
- Spreadsheet formulas
- Built-in charts/sparklines
- PDF export
- Print optimization
- Advanced mobile gestures

## 6) Architecture Overview
Three layers:
1) Core Datatable UI (Vue components + headless composables)
2) Semantic API (machine-readable events + state exposure)
3) Optional MCP server integration (separate addon)

Tech stack:
- Vue 3.4+ + TS 5+
- Rust → WASM for heavy ops (virtualization/sort/filter/CSV/path resolution)
- Vite build + ESM/UMD outputs

## 7) Composable Architecture (Maximized, Locked)
Core composables (custom):
- useIoiTable() — orchestrator / public headless API
- useWasmEngine() — lazy WASM loader + JS fallback
- useWasmVirtualScroll() — viewport range + offsets (Rust if available)
- useWasmSort() — sort (Rust if available)
- useWasmFilter() — filter (Rust if available)
- useWasmCSV() — CSV import/export (Rust if available)
- useNestedPath() — dot path resolver read/write (Rust if available)
- useColumnState() — order/visibility/width/pinning + persistence adapter
- useSortState(), useFilterState(), useGroupState(), useServerMode() — domain state
- useTableSelection() — selection logic (JS-only)
- useTableEditing() — editing state/validation (JS-only)
- useTableKeyboardNav() — focus + keyboard model (JS-only)
- useTableTheme() — CSS variables + dark mode (JS-only)
- useAgentInterface() — semantic events + MCP-friendly interface (addon-safe)

## 8) Public API (Principles)
- Keep surface minimal and stable.
- Internal complexity must not leak into consumer code.
- JS and WASM paths expose identical signatures.

## 9) Performance Targets (Goals, Verified via Harness)
- Scroll: 60fps at 100k rows
- Sort 100k: <100ms (WASM target)
- Filter 100k: <50ms (WASM target)
- CSV parse 10MB: <1s (WASM target)
- Bundle size goal: <75KB total (WASM + TS), enforced via CI checks where possible

## 10) Versioning / Compatibility
- SemVer strictly.
- Event payload schema includes schemaVersion starting at 1.
- Vue 3.4+ baseline; Vue 3.6 tracked in CI; Vapor separate entry later.
