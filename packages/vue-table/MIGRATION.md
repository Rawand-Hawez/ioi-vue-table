# Migration Guide: v0.1.x to v0.2

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
  fetch: async (params) => {
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
| `fetch` | `(params: ServerFetchParams) => Promise<ServerFetchResult>` | Required | Fetch function called when data is needed |
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
    fetch: async (params) => {
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
