# Migration Guide

---

## v0.2.5 → v1.0 (planned)

v1.0 is an **API-freeze + stability release**. No breaking changes from v0.2.5 are planned. See [`docs/v1.0-PLAN.md`](../../docs/v1.0-PLAN.md) for the full plan and [`docs/ROADMAP.md`](../../docs/ROADMAP.md) for the post-v1.0 release line.

### SemVer commitments (effective with v1.0.0)

- Stable surface: every export from `@ioi-dev/vue-table` and `@ioi-dev/vue-table/unstyled`; every documented prop / event / slot / exposed method; `ServerFetchParams` and `ServerFetchResult` shape; the BEM class vocabulary (`ioi-table__*`).
- Event payload `schemaVersion: 1` is **frozen for all v1.x**. Any payload break increments to `schemaVersion: 2` and ships in v2.0.
- Experimental (`@experimental` JSDoc): `useColumnState` persistence adapter shape — may change in a minor.
- Internal (not SemVer-covered): `src/composables/ioiTable/*` module boundaries; CSS class internals beyond the documented BEM vocabulary.

### Scheduled deprecations for v2.0

- `DataTable` alias is marked `@deprecated` in v1.0 and removed in v2.0. Migrate to `Table` (or `IoiTable`).

---

## v0.2.x → v0.2.5

No breaking changes. v0.2.5 is fully additive.

### New features

| Feature | How to use |
|---------|------------|
| Minimal CSS | `import '@ioi-dev/vue-table/minimal'` (or `'/minimal.css'`) for functional baseline styles. Pair with `'/unstyled'` for a clean starting point. |
| Row reorder | Add `:row-draggable="true"` and listen to `@row-reorder="({ fromIndex, toIndex, row }) => …"`. Alt+ArrowUp / Alt+ArrowDown also reorders when a row is focused. |
| Clipboard copy | Press `Ctrl/Cmd+C` while rows are selected, or call `tableRef.copySelectionToClipboard()`. Toggle with `:copyable="false"`. |
| Column groups | Pass `:column-groups="[{ id, header, columnIds }]"`. Override per-group rendering with `#column-group-header="{ group, colspan }"`. Single-level only in v0.2.5; nested groups are planned for v1.2. |
| `ioi-table__row--expanded` base style | Now in `styles.css` — themes that overrode it should still work; themes that relied on the unstyled default should re-check. |

### New exports

- Types: `ColumnGroup`, `ColumnGroupHeaderSlotProps`, `IoiClipboardCopyPayload`, `IoiRowReorderPayload`.
- Event: `row-reorder`.
- Slot: `#column-group-header`.
- Method: `copySelectionToClipboard()`.
- Package export paths: `./minimal`, `./minimal.css`.

### Type imports — no longer need local definitions

`GroupHeader` and `AggregationType` are exported from the package. Remove any local copies:

```ts
// Before (v0.2.x workaround)
type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
interface GroupHeader { key: string; value: unknown; count: number; aggregations: Record<string, number>; }

// After (v0.2.5)
import type { AggregationType, GroupHeader } from '@ioi-dev/vue-table';
```

### Internal fix

`tsconfig.json` removed the obsolete `ignoreDeprecations: "6.0"` value that was breaking `vue-tsc` declaration emit on TypeScript 5.9.x. No public API change, but downstream consumers using TypeScript 5.9.x will now get clean type emit when building from source.

---

## v0.1.x → v0.2

This guide helps you migrate from IOI Vue Table v0.1.x to v0.2.

## Breaking Changes

### None

v0.2 is fully backward compatible with v0.1.x. All existing code will continue to work without modifications.

---

## New Features

### Server-Side Mode

Enable server-side data fetching with the new `dataMode` and `serverOptions` props:

```typescript
import { useIoiTable, type ServerDataOptions } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  email: string;
}

const serverOptions: ServerDataOptions<UserRow> = {
  query: async (params) => {
    const response = await fetch(`/api/users?page=${params.pageIndex}&size=${params.pageSize}`);
    const data = await response.json();
    return {
      rows: data.items,
      totalRows: data.total
    };
  },
  debounceMs: 300,
  initialPageSize: 50
};

const api = useIoiTable({
  dataMode: 'server',
  serverOptions,
  columns,
  rowKey: 'id'
});
```

#### ServerDataOptions Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `query` | `(params: ServerFetchParams) => Promise<ServerFetchResult>` | Required | Query function called when data is needed |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `initialPageSize` | `number` | `50` | Initial page size for server mode |
| `cursorMode` | `boolean` | `false` | Enable cursor-based pagination for infinite scroll |
| `onFetchStart` | `() => void` | - | Callback when fetch starts |
| `onFetchSuccess` | `(result: ServerFetchResult) => void` | - | Callback on successful fetch |
| `onFetchError` | `(error: Error) => void` | - | Callback on fetch error |

#### Infinite Scroll with fetchMore()

```typescript
const api = useIoiTable({
  dataMode: 'server',
  serverOptions: {
    query: async (params) => {
      const cursor = params.cursor ? `&cursor=${params.cursor}` : '';
      const response = await fetch(`/api/items?page=${params.pageIndex}${cursor}`);
      return await response.json();
    },
    cursorMode: true
  },
  columns,
  rowKey: 'id'
});

// Check if more data available
if (api.hasMore.value) {
  await api.fetchMore();
}
```

---

### New API Methods

#### `api.getRowKey(rowIndex)`

Get the row key for a given row index. Returns `null` if `rowKey` is not configured.

```typescript
const key = api.getRowKey(5); // Returns string | number | null
```

#### `api.refresh()`

Refresh server-side data. Only applicable in server mode.

```typescript
api.refresh(); // Re-fetches data from server
```

#### `api.fetchMore()`

Fetch more rows for infinite scroll. Only applicable in server mode with `cursorMode: true`.

```typescript
await api.fetchMore();
```

#### `api.loading`

Loading state as a `ComputedRef<boolean>`.

```typescript
if (api.loading.value) {
  console.log('Data is loading...');
}
```

#### `api.error`

Error state as a `ComputedRef<string | null>`.

```typescript
if (api.error.value) {
  console.error('Error:', api.error.value);
}
```

#### `api.hasMore`

Whether more rows are available for infinite scroll. `ComputedRef<boolean>`.

```typescript
if (api.hasMore.value) {
  // Show "Load More" button
}
```

---

### New Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataMode` | `'client' \| 'server'` | `'client'` | Data mode for the table |
| `serverOptions` | `ServerDataOptions<TRow>` | - | Server-side configuration (required when `dataMode` is `'server'`) |

---

### Accessibility Improvements

#### Enhanced Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowUp` / `ArrowDown` | Navigate between rows |
| `ArrowLeft` / `ArrowRight` | Enter/exit cell navigation mode |
| `Home` | Move to first row |
| `End` | Move to last row |
| `Ctrl/Cmd + Home` | Move to first row, first column |
| `Ctrl/Cmd + End` | Move to last row, last column |
| `PageUp` | Move up by page size |
| `PageDown` | Move down by page size |
| `Enter` / `Space` | Toggle selection, expansion, or group |
| `F2` | Start editing (in cell navigation mode) |
| `Escape` | Cancel edit or exit cell navigation |
| `Ctrl/Cmd + A` | Select all filtered rows |

#### ARIA Attributes

The table now includes comprehensive ARIA support:

- `role="grid"` on table element
- `aria-rowcount` / `aria-colcount` for grid dimensions
- `aria-rowindex` / `aria-colindex` on cells
- `aria-sort` on sorted columns
- `aria-selected` on selected rows
- `aria-expanded` on expandable rows and groups
- `aria-live="polite"` region for announcements

#### Live Region Announcements

Screen readers receive announcements for:

- Sort changes (column, direction)
- Filter updates (row count)
- Selection changes (count)
- Loading states
- Error states

#### CSS Focus Styles

Focus styles respect user preferences:

- `prefers-reduced-motion` support
- `prefers-contrast` support
- Visible focus indicators

---

## Deprecated APIs

None in this release.

---

## Removed APIs

None in this release.

---

## TypeScript Changes

### New Types Exported

```typescript
import type {
  ServerFetchParams,
  ServerFetchResult,
  ServerDataOptions
} from '@ioi-dev/vue-table';
```

### ServerFetchParams

```typescript
interface ServerFetchParams {
  pageIndex: number;
  pageSize: number;
  sort: SortState[];
  filters: FilterState[];
  globalSearch: string;
  cursor?: string | null;
}
```

### ServerFetchResult

```typescript
interface ServerFetchResult<TRow> {
  rows: TRow[];
  totalRows: number;
  pageCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}
```

---

## Performance Benchmarks

New benchmark suite in `packages/bench/`:

```bash
# Run benchmarks
pnpm --filter @ioi-dev/vue-table-bench bench

# Run with JSON report
pnpm --filter @ioi-dev/vue-table-bench bench:report
```

### Benchmark Scenarios

| Scenario | Data Size | Target |
|----------|-----------|--------|
| Initial Render | 1,000 rows | 100ms |
| Virtual Scroll | 100,000 rows | 16ms (60fps) |
| Sort | 100,000 rows | 200ms |
| Multi-Sort | 100,000 rows | 300ms |
| Filter | 100,000 rows | 150ms |
| Global Search | 100,000 rows | 200ms |
| Selection Toggle | 1,000 toggles | 50ms |
| CSV Parse | 10MB | 3000ms |
