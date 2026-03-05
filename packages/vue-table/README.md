# @ioi-dev/vue-table

Performance-first Vue 3 data table with a small API surface and JS-first defaults.

## Install

```bash
npm install @ioi-dev/vue-table vue
```

Default package entry imports library CSS. Use `@ioi-dev/vue-table/unstyled` for zero-CSS integration.

## Quick Start

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  score: number;
}

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 90 },
  { field: 'name', header: 'Name', type: 'text' },
  { field: 'score', header: 'Score', type: 'number' }
];

const rows: UserRow[] = [
  { id: 1, name: 'Alpha', score: 91 },
  { id: 2, name: 'Beta', score: 77 }
];
</script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" :height="320" />
</template>
```

`IoiTable` remains available as a backward-compatible alias.

## Pagination + Header Filters (Headless)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  status: string;
}

const rows = ref<UserRow[]>([]);
const pageIndex = ref(0);
const pageSize = ref(25);

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID' },
  { field: 'status', header: 'Status', headerFilter: 'select' },
  { field: 'name', header: 'Name', headerFilter: 'text' }
];
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    :rows="rows"
    :columns="columns"
    row-key="id"
  />
</template>
```

## Docs

- Repository: <https://github.com/Rawand-Hawez/ioi-vue-table>
- Full guide: <https://github.com/Rawand-Hawez/ioi-vue-table#readme>
- [Sort/filter/search/pagination + virtual scrolling guide](https://github.com/Rawand-Hawez/ioi-vue-table/blob/main/docs/table-operations.md)

## Behavior Defaults

- CSV export sanitizes formula-like prefixes by default (`sanitizeFormulas: true`).
- Optional debounce: `globalSearchDebounceMs` and `filterDebounceMs` (default `0`).
- Virtualization knobs remain configurable via `rowHeight` and `overscan`.
