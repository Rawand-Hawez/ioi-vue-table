# Table Operations Guide (v0.1.4)

This guide is the frontend implementation contract for table interaction features in `@ioi-dev/vue-table@0.1.4`.

## 0.1.4 Snapshot

Implemented in this release:

- Client-side sorting (`setSortState`, `toggleSort`)
- Per-column filtering (`setColumnFilter`, `clearColumnFilter`, `clearAllFilters`)
- Global search (`setGlobalSearch`)
- Controlled pagination (`pageIndex`, `pageSize`, `pagination-change`)
- Header filter controls (`headerFilter: 'text' | 'select'`)
- Faceted dropdown options (`getColumnFacetOptions(field)`) based on other active filters + global search, excluding self-filter
- Headless rendering (`header-filter` slot + class hooks; no bundled visual theme)

Still not included:

- Built-in pagination UI (frontend app renders buttons/selectors)

## Pipeline Order

Pipeline order is fixed:

`baseIndices -> filteredIndices -> sortedIndices -> (virtual slice | page slice) -> visibleIndices`

Meaning:

- Filters and global search run before sort.
- Pagination always applies to the filtered+sorted dataset.
- Virtual scrolling and pagination are mutually exclusive view modes.

## Virtual Scroll vs Pagination

- Virtual scrolling is active when `pageSize <= 0` (or omitted).
- Pagination is active when `pageSize > 0`.
- When pagination is active, virtual paddings are disabled and the current page rows are rendered.

Defaults:

- `height = 320`
- `rowHeight = 36`
- `overscan = 5`

Important:

- Use numeric `:height` (for example `:height="420"`), not string values like `height="100%"`.
- Keep row CSS height aligned with `rowHeight` for accurate viewport math.

## Frontend State Model (Recommended)

Use a single reactive model in your page/container component:

```ts
const pageIndex = ref(0);
const pageSize = ref(25);
const pageCount = ref(1);
const rowCount = ref(0);
const globalSearch = ref('');
```

Recommendation for this project stage:

- Keep client-side datasets around ~1k rows for rich interaction views.
- Switch to backend pagination/filtering for larger datasets.

## Controlled Pagination Contract

`pageIndex` is `0`-based.

`pagination-change` payload:

```ts
interface IoiPaginationChangePayload {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  rowCount: number;
  reason: 'setPageIndex' | 'setPageSize' | 'autoReset' | 'clamp' | 'resetState' | 'meta';
}
```

Reason semantics:

- `setPageIndex`: user/app moved page
- `setPageSize`: page size changed (table resets page index to `0`)
- `autoReset`: sort/filter/search changed while on page > 0
- `clamp`: current page became out-of-range after row-count change
- `resetState`: full table reset
- `meta`: metadata changed (for example external prop update or pageCount/rowCount refresh)

## Header Filters Contract

Column config:

```ts
const columns: ColumnDef<Row>[] = [
  { field: 'status', header: 'Status', headerFilter: 'select' },
  { field: 'owner', header: 'Owner', headerFilter: 'text' }
];
```

Behavior:

- `headerFilter: 'text'` -> text filter with operator `contains`
- `headerFilter: 'select'` -> text filter with operator `equals`
- Select options come from `getColumnFacetOptions(field)`
- Facet generation excludes the column's own filter and respects all other active filters + global search
- Header filter identity is tied to `column.field` (safe for duplicate visual columns)

## Headless Styling Contract

The table is intentionally unthemed. Style from app-level CSS or framework utilities.

Main class hooks:

- `.ioi-table`
- `.ioi-table__viewport`
- `.ioi-table__table`
- `.ioi-table__header-content`
- `.ioi-table__filter-input`
- `.ioi-table__filter-select`
- `.ioi-table__row`
- `.ioi-table__empty`

For fully custom header controls, use the `header-filter` slot.

Slot props:

```ts
interface HeaderFilterSlotProps<TRow> {
  column: ColumnDef<TRow>;
  columnIndex: number;
  mode: 'text' | 'select';
  value: string;
  options?: string[];
  setValue: (value: string) => void;
  clear: () => void;
}
```

## Implementation Blueprint (Copy/Paste)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef, type IoiPaginationChangePayload } from '@ioi-dev/vue-table';

interface Row {
  id: number;
  owner: string;
  status: string;
  score: number;
}

const rows = ref<Row[]>([]);
const pageIndex = ref(0);
const pageSize = ref(25);
const pageCount = ref(1);
const rowCount = ref(0);

const columns: ColumnDef<Row>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 90 },
  { field: 'status', header: 'Status', type: 'text', headerFilter: 'select' },
  { field: 'owner', header: 'Owner', type: 'text', headerFilter: 'text' },
  { field: 'score', header: 'Score', type: 'number' }
];

function onPaginationChange(payload: IoiPaginationChangePayload): void {
  pageCount.value = payload.pageCount;
  rowCount.value = payload.rowCount;
}

function nextPage(): void {
  if (pageIndex.value < pageCount.value - 1) pageIndex.value += 1;
}

function prevPage(): void {
  if (pageIndex.value > 0) pageIndex.value -= 1;
}
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    :rows="rows"
    :columns="columns"
    row-key="id"
    :height="420"
    :row-height="36"
    :overscan="5"
    @pagination-change="onPaginationChange"
  />

  <div class="table-pager">
    <button type="button" :disabled="pageIndex === 0" @click="prevPage">Prev</button>
    <span>Page {{ pageIndex + 1 }} / {{ pageCount }}</span>
    <button type="button" :disabled="pageIndex >= pageCount - 1" @click="nextPage">Next</button>
    <select v-model.number="pageSize">
      <option :value="10">10</option>
      <option :value="25">25</option>
      <option :value="50">50</option>
    </select>
    <span>{{ rowCount }} rows</span>
  </div>
</template>
```

## Programmatic Operations

Use component `ref` and exposed methods for external controls:

- `setSortState(sortState)`
- `toggleSort(field, multi?)`
- `setColumnFilter(field, filter)`
- `clearColumnFilter(field)`
- `clearAllFilters()`
- `setGlobalSearch(text)`
- `setPageIndex(index)`
- `setPageSize(size)`
- `getColumnFacetOptions(field)`

## Server-Mode Guidance

For backend-driven datasets:

- Keep sort/filter/search/page state in app store/router.
- Fetch current page from API.
- Pass fetched rows to `<Table />`.
- Do not enable client-side pagination (`pageSize = 0` or omit it).

## Common Integration Mistakes

- Treating `pageIndex` as 1-based.
- Rendering backend-paginated rows while also enabling client-side pagination.
- Expecting hidden columns to be included in global search.
- Passing non-numeric `height` and expecting virtual scrolling to behave correctly.
- Forgetting to render your own pager controls (table does not ship pagination UI).

