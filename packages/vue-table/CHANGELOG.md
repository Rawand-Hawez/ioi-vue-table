# @ioi-dev/vue-table

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
