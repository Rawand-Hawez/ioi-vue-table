# Sort, Filter, Search, and Pagination Guide

This guide documents the current v1 behavior of `@ioi-dev/vue-table` and recommended usage patterns.

## What Is Built In

Built in today:

- Vertical virtualization (virtual scrolling)
- Client-side pagination state (controlled) when `pageSize > 0`
- Client-side sorting (`setSortState`, `toggleSort`)
- Per-column filtering (`setColumnFilter`, `clearColumnFilter`, `clearAllFilters`)
- Global search (`setGlobalSearch`)
- Faceted select options via `getColumnFacetOptions(field)` (excludes the column’s own filter)

Not built in yet:

- Pagination UI controls (you render buttons/selects in app code)

Data pipeline order is fixed:

`baseIndices -> filteredIndices -> sortedIndices -> (virtual slice | page slice) -> visibleIndices`

## Virtual Scrolling

Virtual scrolling is enabled by default in `<Table />` when pagination is not enabled.

When `pageSize > 0` (pagination enabled), the table renders the current page and virtual scrolling is disabled.

```vue
<Table
  :rows="rows"
  :columns="columns"
  row-key="id"
  :height="420"
  :row-height="34"
  :overscan="6"
/>
```

How it works:

- `height` creates the internal scroll viewport and should always be set intentionally.
- `row-height` is used to compute virtual ranges and paddings.
- `overscan` renders extra rows above/below the viewport to reduce pop-in while scrolling.
- `height` is treated as a numeric pixel value (`number` prop). Non-numeric values are ignored and fallback to default height.

Current defaults:

- `height = 320`
- `rowHeight = 36`
- `overscan = 5`

Tuning tips:

- Increase `overscan` when fast scrolling shows row pop-in.
- Keep `row-height` close to actual row CSS height for accurate scroll math.
- For very large local datasets, keep pagination server-side when possible.

Troubleshooting:

- Use `:height="420"` (number binding), not `height="100%"` (string).
- Keep `overscan` relatively small (single-digit to low double-digit values for most cases).
- If you are paginating (`pageSize > 0`), `height` is treated as a virtual scrolling concern and does not create an internal scroll viewport.

## Sort

### Programmatic sort with `<Table />`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef, type SortState } from '@ioi-dev/vue-table';

interface Row {
  id: number;
  city: string;
  score: number;
}

const rows = ref<Row[]>([]);
const columns: ColumnDef<Row>[] = [
  { field: 'id', type: 'number', width: 90 },
  { field: 'city', type: 'text' },
  { field: 'score', type: 'number' }
];

interface TableExpose {
  setSortState: (sortState: SortState[]) => void;
  toggleSort: (field: string, multi?: boolean) => void;
}

const tableRef = ref<TableExpose | null>(null);

function sortScoreDesc(): void {
  tableRef.value?.setSortState([{ field: 'score', direction: 'desc' }]);
}

function multiSortCityThenScore(): void {
  tableRef.value?.setSortState([
    { field: 'city', direction: 'asc' },
    { field: 'score', direction: 'desc' }
  ]);
}

function cycleScoreSort(): void {
  tableRef.value?.toggleSort('score');
  // toggle order: none -> asc -> desc -> none
}
</script>

<template>
  <button type="button" @click="sortScoreDesc">Sort Score Desc</button>
  <button type="button" @click="multiSortCityThenScore">Sort City + Score</button>
  <button type="button" @click="cycleScoreSort">Toggle Score Sort</button>

  <Table ref="tableRef" :rows="rows" :columns="columns" row-key="id" :height="360" />
</template>
```

### Sort behavior guarantees

- Stable sort: equal values keep prior order.
- Multi-sort order follows array order in `setSortState`.
- `null`/`undefined` sort last in both ascending and descending.
- Date columns accept `Date` and ISO strings; invalid dates are treated as null (last).

## Column Filters

Use `setColumnFilter(field, filter)` where `filter` is one of:

- Text: `{ type: 'text', value, operator?, caseSensitive? }`
- Number: `{ type: 'number', operator, value }` or `{ type: 'number', operator: 'between', min, max }`
- Date: `{ type: 'date', operator: 'before' | 'after' | 'on', value }`

Examples:

```ts
tableRef.value?.setColumnFilter('city', {
  type: 'text',
  operator: 'equals',
  value: 'Erbil'
});

tableRef.value?.setColumnFilter('score', {
  type: 'number',
  operator: 'gte',
  value: 700
});

tableRef.value?.setColumnFilter('createdAt', {
  type: 'date',
  operator: 'after',
  value: '2026-01-01T00:00:00.000Z'
});

tableRef.value?.clearColumnFilter('score');
tableRef.value?.clearAllFilters();
```

### Header filter UI in `<Table />` (headless)

You can opt into simple, unstyled header filter controls per column:

```ts
const columns: ColumnDef<Row>[] = [
  { field: 'status', header: 'Status', headerFilter: 'select' },
  { field: 'owner', header: 'Owner', headerFilter: 'text' }
];
```

Behavior:

- `headerFilter: 'text'` renders an `<input>` and applies a text `contains` filter.
- `headerFilter: 'select'` renders a `<select>` and applies a text `equals` filter.
- Select options are derived from `getColumnFacetOptions(field)` using **other filters + global search** (excluding the column’s own filter).
- Use the `header-filter` slot to render your own control with Tailwind/ShadCN/Bootstrap, etc.

### Filter semantics

- Text defaults: `operator='contains'`, `caseSensitive=false`.
- Number operators: `eq`, `lt`, `lte`, `gt`, `gte`, `between` (inclusive).
- Date `on` compares by UTC calendar day.
- Nested paths are supported (example: `user.profile.name`, `items.0.price`).
- Arrays match if any stringified element matches the text/global query.

## Global Search

```ts
tableRef.value?.setGlobalSearch('needle');
```

Rules:

- Case-insensitive.
- Searches only visible columns (`hidden !== true`).
- Composes with column filters (both must match).

## Pagination

Pagination is a client-side view over the fully filtered + sorted dataset.

Rules:

- `pageIndex` is **0-based**.
- Enable pagination by setting `pageSize > 0`.
- When pagination is enabled, virtual scrolling is disabled and the table renders the current page rows.
- Sort/filter/search auto-reset the page index to `0`.

### Controlled pagination with `<Table />`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef, type IoiPaginationChangePayload } from '@ioi-dev/vue-table';

interface Row {
  id: number;
  name: string;
  score: number;
}

const rows = ref<Row[]>([]);
const columns: ColumnDef<Row>[] = [
  { field: 'id', type: 'number' },
  { field: 'name', type: 'text' },
  { field: 'score', type: 'number' }
];

const pageSize = ref(25);
const pageIndex = ref(0);
const pageCount = ref(1);

function onPaginationChange(payload: IoiPaginationChangePayload): void {
  pageCount.value = payload.pageCount;
}

function nextPage(): void {
  if (pageIndex.value < pageCount.value - 1) {
    pageIndex.value += 1;
  }
}
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    :rows="rows"
    :columns="columns"
    row-key="id"
    :height="360"
    @pagination-change="onPaginationChange"
  />
  <button type="button" @click="nextPage">Next</button>
</template>
```

### Server-side pagination (still recommended for large datasets)

- Keep `pageIndex`, `pageSize`, `sort`, `filters`, `globalSearch` in your app state.
- Fetch only the current page rows from your backend.
- Pass fetched rows into `<Table />` and **do not enable client-side pagination** (omit `pageSize` or set `pageSize` to `0`).

## Common Mistakes

- Applying global search to hidden columns: hidden columns are intentionally excluded.
- Treating `pageIndex` as 1-based: it is 0-based.
- Double paginating: don’t page rows in app code and also set `pageSize` on `<Table />`.
- Using client-side pagination for very large data: prefer server-side pagination for scale.
