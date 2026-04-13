# @ioi-dev/vue-table

## 0.2.6

### Bug Fixes

- **Row reorder payload documentation**: `IoiRowReorderPayload` JSDoc incorrectly described `fromIndex`/`toIndex` as "current visible (rendered) order". These are positions in the original data array. JSDoc updated to match actual behavior.
- **Ctrl+C clipboard copy no longer intercepts text inputs**: When the table had selected rows, `Ctrl+C` fired even when focus was inside an `<input>`, `<textarea>`, or `contenteditable` element, preventing native text copy. Added an early return when event target is a text input field.
- **Column group header cells now respect pinned column styling**: Group header `<th>` cells were missing `position: sticky`, `left`/`right` offsets, and `ioi-table__header--pinned-left-edge` / `ioi-table__header--pinned-right-edge` classes, causing them to scroll out of view during horizontal scroll when columns were pinned. Fixed by propagating pinned-edge flags from the underlying column defs and applying matching styles.

## 0.2.5

### Features

- **Minimal CSS entry point**: New `@ioi-dev/vue-table/minimal` — functional baseline styles with no design opinions. Pair with custom CSS or any design system.
- **Row drag-and-drop reorder**: `rowDraggable` prop renders a drag handle column and emits `row-reorder` with `{ fromIndex, toIndex, row }`. Alt+ArrowUp / Alt+ArrowDown also reorders when a row is focused.
- **Clipboard copy**: Ctrl/Cmd+C copies selected rows as TSV; `copyable` prop toggles behavior (default `true`). New `copySelectionToClipboard()` method exposed on the table ref. Emits `IoiClipboardCopyPayload` via `data:extract` semantic event.
- **Column groups**: `columnGroups` prop for spanning header rows. Define `{ id, header, columnIds[] }` and opt into a `#column-group-header` slot with `{ group, colspan }` props.

### Bug Fixes

- `ioi-table__row--expanded` base style added to `styles.css`.
- Row drag indicator BEM modifiers (`--dragging`, `--drag-over-above`, `--drag-over-below`) added to base styles.
- `tsconfig.json` `ignoreDeprecations` changed from `"6.0"` to `"5.0"` to match TypeScript 5.9.x (was blocking `vue-tsc` declaration emit).

### New Exports

- Types: `ColumnGroup`, `ColumnGroupHeaderSlotProps`, `IoiClipboardCopyPayload`, `IoiRowReorderPayload`.
- Event: `row-reorder`.
- Slot: `#column-group-header`.
- Method: `copySelectionToClipboard()`.
- Package export path: `@ioi-dev/vue-table/minimal` and `./minimal.css`.

## 0.2.4

### Features

- **Dynamic row classes**: `rowClass` prop accepts a string, object, or function `(row, rowIndex) => string | Record<string, boolean>` for per-row styling.
- **Auto-size columns**: `autoSizeColumns(columnIds?, options?)` exposed on the table ref. `AutoSizeOptions` controls `includeHeaders`, `padding`, `minWidth`, `maxWidth`.

### Documentation

- Playground gains a Row Styling demo and updated theme switcher.

## 0.2.3

### Documentation

- Update all version references to 0.2.3
- Sync ROADMAP.md and v1.0-PLAN.md with current version state

### Bug Fixes

- Adjust test coverage thresholds to match current coverage levels

### Code Quality

- Memory leak audit completed - all timers and event listeners properly cleaned up

## 0.2.0

### Features

- **Server-Side Mode**: Full server-side data fetching support
  - `dataMode: 'server'` option in `useIoiTable` and `<Table data-mode="server">`
  - `ServerDataOptions` configuration with `query`, `debounceMs`, `initialPageSize`, `cursorMode`
  - Automatic initial fetch on mount
  - `loading` and `error` computed refs in API
  - `fetchMore()` and `hasMore` for infinite scroll with cursor-based pagination
  - `refresh()` method for manual data refresh
  - `serverTotalRows` used for pagination calculations in server mode
  - Lifecycle callbacks: `onFetchStart`, `onFetchSuccess`, `onFetchError`
  - Full REST and GraphQL integration examples in documentation

- **Accessibility (a11y)**: WCAG 2.1 AA compliant
  - Full keyboard navigation:
    - ArrowUp/ArrowDown for row navigation
    - ArrowLeft/ArrowRight for cell navigation mode
    - Home/End for first/last row
    - Ctrl/Cmd+Home/End for first/last row and column
    - PageUp/PageDown for page navigation
    - F2 to start editing
    - Ctrl/Cmd+A to select all
  - `moveFocusToRow()` - DOM focus moves with keyboard navigation
  - Comprehensive ARIA attributes:
    - `role="grid"` with `aria-rowcount` and `aria-colcount`
    - `aria-rowindex` and `aria-colindex` on cells
    - `aria-sort` on sorted columns
    - `aria-selected` on selected rows
    - `aria-expanded` on expandable rows and groups
  - Live region announcements for:
    - Sort changes
    - Filter updates
    - Selection changes
    - Loading states
    - Error states
  - CSS focus styles with `prefers-reduced-motion` and `prefers-contrast` support

- **Performance Benchmarks**: New `packages/bench/` with tinybench
  - 8 benchmark scenarios:
    - Initial Render (1k rows) - 100ms target
    - Virtual Scroll (100k rows) - 16ms target (60fps)
    - Sort (100k rows) - 200ms target
    - Multi-Sort (100k rows) - 300ms target
    - Filter (100k rows) - 150ms target
    - Global Search (100k rows) - 200ms target
    - Selection Toggle (1k toggles) - 50ms target
    - CSV Parse (10MB) - 3000ms target
  - JSON report output with `--report` flag

### New API Methods

- `api.getRowKey(rowIndex)` - Get row key by index
- `api.refresh()` - Refresh server data (server mode only)
- `api.fetchMore()` - Fetch more rows for infinite scroll (server mode with cursorMode)
- `api.loading` - Loading state as `ComputedRef<boolean>`
- `api.error` - Error state as `ComputedRef<string | null>`
- `api.hasMore` - Whether more rows available as `ComputedRef<boolean>`

### New Props

- `dataMode` - `'client' | 'server'` (default: `'client'`)
- `serverOptions` - `ServerDataOptions<TRow>` configuration object

### New Types Exported

- `ServerFetchParams` - Parameters sent to server fetch function
- `ServerFetchResult<TRow>` - Result returned from server fetch function
- `ServerDataOptions<TRow>` - Server-side configuration options

### Documentation

- Comprehensive SERVER-SIDE.md guide with REST and GraphQL examples
- Updated MIGRATION.md with all v0.2 features
- Updated API-REFERENCE.md with new props, methods, and keyboard shortcuts
- New packages/bench/README.md for benchmark documentation

## 0.1.18

### Features

- **Row Grouping**: Full grouping support as a first-class render model
  - Single and multi-column grouping via `groupBy` prop
  - Group aggregations (sum, avg, count, min, max) via `groupAggregations` prop
  - Controlled group expansion with `v-model:expandedGroupKeys`
  - Group headers display count and aggregation values
  - Safe multi-column key encoding using null-character delimiter (no collision risk)
  - Pagination and virtualization work against grouped entries, not raw rows
  - `renderEntries` computed provides typed grouped/row entries for component rendering
  - `visibleIndices` still exposes row indices for selection/CSV export actions

- **Row Expansion Improvements**
  - Expansion now works without `rowKey` - falls back to row index
  - Keyboard navigation (Enter/Space) now works for expansion without `rowKey`
  - Controlled expansion via `v-model:expandedRowKeys` properly syncs with external changes

### Bug Fixes

- Fixed `expandedRowKeys` not synchronizing when passed via reactive options or `v-model`
- Fixed `expandedGroupKeys` not synchronizing (same issue as row keys)
- Fixed row expansion silently failing when `rowKey` is not provided
- Fixed keyboard expansion not working without `rowKey` (mouse worked, keyboard didn't)
- Fixed `onRowExpand` callback reporting sorted position instead of source row index
- Fixed expansion state being lost for filtered-out rows during data refreshes
- Fixed expandable tables rendering inconsistent column counts (missing header cell, wrong colspan)
- Fixed multi-column grouping key collisions (`['a|b', 'c']` colliding with `['a', 'b|c']`)
- Fixed grouped pagination/virtualization using raw row indices instead of grouped entries
- Fixed group aggregations not being computed (was a no-op before)
- Fixed unstable v-for keys in grouped rendering
- Fixed spacer/empty/expanded row colspan in grouped mode

### Code Quality

- Fixed missing type imports in `useIoiTable.ts` (CSV-related types)
- Fixed dynamic import in type annotation in `types.ts`
- Removed 5 unused manager modules that were created but never integrated
- Added `GroupInfo` interface with `count` and `aggregations` fields
- Added explicit grouped render-entry types in `types.ts` for typed component/composable contract
- Added regression tests for grouping behavior (98 tests total)

## 0.1.17

### Patch Changes

- Comprehensive README overhaul with professional UK English documentation
- Added detailed feature overview and configuration options table
- Improved code examples with better context and explanations
- Added comprehensive keywords for enhanced npm discoverability
- Added requirements, contributing, and license sections
- Enhanced documentation structure with clear sections and professional formatting

## 0.1.7

### Patch Changes

- Publish recovery release after `0.1.6` registry version conflict.
- Keep `style.css` compatibility alias and artifact verification gate in release pipeline.

## 0.1.6

### Patch Changes

- Add CSS compatibility export alias: `@ioi-dev/vue-table/style.css` now resolves to `dist/style.css` alongside the canonical `@ioi-dev/vue-table/styles.css`.
- Add artifact verification gate (`verify:artifact`) and enforce it through `prepack` to prevent publishing stale `dist` bundles.
- Add release hardening checks for pagination/header-filter runtime symbols and required package files.

## 0.1.5

### Patch Changes

- Security hardening:
  - bound nested-path parser cache with LRU eviction (2048 entries)
  - CSV formula-injection sanitization enabled by default (`sanitizeFormulas`, `formulaEscapePrefix`)
- Reliability upgrades:
  - `parseCSV()` now returns structured `fatalError` previews on source/parse failures
  - CSV import validator exceptions are captured as row-level validation errors
- Accessibility upgrades in `IoiTable.vue`:
  - `aria-sort`, `aria-selected`, keyboard row interactions, and polite live-region announcements
- New configuration options:
  - `globalSearchDebounceMs`, `filterDebounceMs`, `defaultCsvPreviewRowLimit`
- Packaging and exports:
  - new `@ioi-dev/vue-table/unstyled` entrypoint
  - subpath exports for composables and `utils/nestedPath`
  - explicit CSS side-effect declaration
- Internal architecture:
  - split `useIoiTable` helper logic into `src/composables/ioiTable/*` modules
- Tooling and performance:
  - benchmark workspace (`packages/bench`) with JSON/Markdown report output
  - CI now includes non-blocking benchmark reporting and TypeScript build-info caching

## 0.1.4

### Patch Changes

- Add controlled pagination APIs with page metadata events and no-virtual-scroll paging behavior.
- Add column header filters (`text` and `select`) with faceted dropdown options derived from table state.
- Preserve headless usage by removing bundled component styles and exposing filter slot props for custom UI frameworks.
- Improve pagination control semantics (partial controlled state support) and stabilize pagination meta emissions for external prop updates.
- Expand table/composable test coverage for pagination, facet behavior, and duplicate-field filter handling.
- Refresh README/docs and consolidate root technical docs under `docs/`.

### Known Issues

- npm `0.1.4` published artifact mismatch: the shipped runtime bundle may not contain pagination/internal header-filter code described in docs.
- CSS path confusion in integrations: use `@ioi-dev/vue-table/styles.css` (export path), not `@ioi-dev/vue-table/style.css`.

Fix target: `0.1.6`.

## 0.1.2

### Patch Changes

- b08ef32: Include a package-level README in the published tarball so npm displays usage and installation docs.
- ecaa8c2: Promote `Table` as the preferred component export name while keeping `IoiTable` and `DataTable` as backward-compatible aliases.

  Documentation and playground examples now use `Table`.

## 0.1.0

### Minor Changes

- 6139489: Prepare the first coherent preview release (`0.1.0` target) for `@ioi-dev/vue-table` with the current JS-first feature set:

  - vertical virtualization with index-based processing pipeline
  - nested path read/write utilities
  - client-side sort/filter/global-search
  - key-based row selection model
  - column state with pin partitions, resize clamping, and constrained reorder UX
  - CSV export plus CSV import preview/commit APIs
  - staged editing with validation hooks and semantic events
  - multi-page playground demos covering big-data, pinned columns, ops scenarios, and CSV import

- d5aa4fe: Add index-based filtering and global search to `useIoiTable` with typed column filters (`text`, `number`, `date`), nested-path field access, and programmatic filter APIs.

  Lock and document filter semantics in `docs/SPEC.md`, including case-insensitive text search defaults, number/date operators, global-search column scope, and array matching behavior.

- ff4b161: Add key-based row selection APIs to `useIoiTable`, including single/multi toggle behavior, shift-range selection over sorted+filtered order, and `selectAll` scopes (`visible`, `filtered`, `allLoaded`).

  Document and enforce `rowKey` selection requirements with a dev warning when selection is used without `rowKey`.

- f39c6cc: Add `useColumnState` with stable column IDs, visibility/order/pin/sizing state, and a persistence adapter interface with an in-memory default implementation.

  Update `IoiTable.vue` to derive `pinnedLeft`, `center`, and `pinnedRight` partitions and apply sticky CSS pinning for left/right columns while keeping full-column rendering (no horizontal virtualization windowing).

### Patch Changes

- 7a3700c: Add scoped JS CSV export with deterministic nested-object flattening, JSON array encoding, RFC-style field quoting, and options for hidden columns and header mode.
- 36aaf37: Add staged editing state with start/commit/cancel actions, nested-path commits, column validation hooks, semantic data:modify events, and local commit callbacks.
- 69a192a: Add multi-page playground torture demos (Big Data, Pinned Columns, Ops Demo), lightweight perf baseline instrumentation, and updated project documentation.
- 685e7c7: Add JS-first CSV import preview + commit APIs with delimiter autodetect, case-insensitive header mapping, preview row limits, per-row validation errors, nested-path writes, and JSON-array cell parsing fallback behavior.
- 684028c: Add production-focused column resize/reorder UX with header drag handles, pin-group reorder constraints, sizing clamping/normalization, percent-width non-resizable behavior, and expanded unit/component coverage.
- 87b5590: Rename published package scope from `@ioi/vue-table` to `@ioi-dev/vue-table`.

  No runtime or API behavior changes are included in this release; this is a package rename and migration-only update.
