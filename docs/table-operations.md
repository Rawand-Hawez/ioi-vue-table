# Sort, Filter, Search, and Pagination Guide

This guide documents the current v1 behavior of `@ioi-dev/vue-table` and recommended usage patterns.

## What Is Built In

Built in today:

- Vertical virtualization (virtual scrolling)
- Client-side sorting (`setSortState`, `toggleSort`)
- Per-column filtering (`setColumnFilter`, `clearColumnFilter`, `clearAllFilters`)
- Global search (`setGlobalSearch`)

Not built in yet:

- Pagination state/UI APIs (you implement pagination in app code)

Data pipeline order is fixed:

`baseIndices -> filteredIndices -> sortedIndices -> visibleIndices`

## Virtual Scrolling

Virtual scrolling is enabled by default in `<Table />`. There is no separate enable flag.

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
- Avoid overriding `.ioi-table__viewport` overflow/height rules in custom CSS.

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

## Pagination Patterns (Recommended)

`@ioi-dev/vue-table` currently does not provide built-in page state or page controls. Use one of these patterns.

### Pattern A: Server-side pagination (recommended for large datasets)

- Keep `page`, `pageSize`, `sort`, `filters`, `globalSearch` in your app state.
- Send these to your backend and fetch only current page rows.
- Pass fetched rows into `<Table />`.
- Reset `page` to `1` whenever sort/filter/search changes.

### Pattern B: Client-side pagination after sort/filter/search

If you need local pagination over the fully filtered+sorted dataset, use `useIoiTable()` and page over `sortedIndices`.

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Table, useIoiTable, type ColumnDef } from '@ioi-dev/vue-table';

interface Row {
  id: number;
  name: string;
  score: number;
}

const sourceRows = ref<Row[]>([]);
const columns: ColumnDef<Row>[] = [
  { field: 'id', type: 'number' },
  { field: 'name', type: 'text' },
  { field: 'score', type: 'number' }
];

const model = useIoiTable<Row>(
  computed(() => ({
    rows: sourceRows.value,
    columns,
    rowKey: 'id'
  }))
);

const page = ref(1);
const pageSize = ref(25);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(model.sortedIndices.value.length / pageSize.value))
);

const pagedRows = computed<Row[]>(() => {
  const start = (page.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return model.sortedIndices.value
    .slice(start, end)
    .map((rowIndex) => model.rows.value[rowIndex])
    .filter((row): row is Row => row !== undefined);
});

watch(
  [() => model.state.value.sort, () => model.state.value.filters, () => model.state.value.globalSearch],
  () => {
    page.value = 1;
  },
  { deep: true }
);

function nextPage(): void {
  if (page.value < pageCount.value) {
    page.value += 1;
  }
}
</script>

<template>
  <!-- drive sort/filter/search from `model.*` actions -->
  <Table :rows="pagedRows" :columns="columns" row-key="id" :height="360" />
  <button type="button" @click="nextPage">Next</button>
</template>
```

Important in Pattern B:

- Drive sort/filter/search from `model` actions (`model.setSortState`, `model.setColumnFilter`, `model.setGlobalSearch`).
- Avoid mixing those operations with a separate `<Table ref>` operation layer on `pagedRows`, or you will re-process already paged data.

## Common Mistakes

- Applying global search to hidden columns: hidden columns are intentionally excluded.
- Forgetting page reset: reset to first page when query/sort changes.
- Using local pagination for very large data: prefer server-side pagination for scale.
