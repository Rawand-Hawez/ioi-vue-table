# @ioi-dev/vue-table

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

  Lock and document filter semantics in `SPEC.md`, including case-insensitive text search defaults, number/date operators, global-search column scope, and array matching behavior.

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
