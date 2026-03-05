# IOI Vue Table

AG Grid performance without the bloat. TanStack flexibility without the complexity.

IOI Vue Table is a performance-first Vue 3 data table with a small, stable public API:

- JS-first baseline, fully usable without Rust or WASM
- Headless rendering with slot APIs and framework-friendly class hooks
- Built-in sorting, column filters, global search, selection, editing, and CSV workflows
- Virtualized rendering by default, with controlled pagination when virtual scroll is off
- Semantic events for state changes (`schemaVersion` + machine-readable payloads)

`IoiTable` remains available as a backward-compatible alias to `Table` in v1.x.

## Install

```bash
npm install @ioi-dev/vue-table vue
```

## 60-Second Quick Start

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

## Controlled Pagination + Header Filters

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  owner: string;
  status: string;
}

const rows = ref<UserRow[]>([]);
const pageIndex = ref(0);
const pageSize = ref(25);

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID' },
  { field: 'status', header: 'Status', headerFilter: 'select' },
  { field: 'owner', header: 'Owner', headerFilter: 'text' }
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

`headerFilter: 'select'` options are faceted from current table context (other active filters + global search, excluding its own filter).

## Headless Styling

The table ships headless-first. You can style it with Tailwind, shadCN, Bootstrap, or plain CSS by targeting class hooks such as:

- `.ioi-table`
- `.ioi-table__viewport`
- `.ioi-table__table`
- `.ioi-table__header-content`
- `.ioi-table__filter-input` / `.ioi-table__filter-select`
- `.ioi-table__row` / `.ioi-table__empty`

## Performance Model

- Current target: smooth client-side operation around ~1k rows with rich interactions
- Large datasets: use virtualization and server-side data strategies
- WASM remains an optional accelerator path; JS fallback is always first-class
- WASM boundaries stay low-overhead (indices/ranges, no large object shuttling)

## Docs

- [Table operations guide](docs/table-operations.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Specification](docs/SPEC.md)
- [Roadmap](docs/ROADMAP.md)

## Run Playground

```bash
npm install
npm --workspace @ioi/vue-table-playground run dev
```

Playground routes (hash-based):

- `#/big-data` for virtualization stress tests
- `#/pinned-columns` for pinning + resize + reorder
- `#/ops-demo` for sort/filter/search/selection
- `#/csv-import` for CSV preview, validation, and commit

## Workspace Commands

- `npm --workspace @ioi-dev/vue-table run test`
- `npm --workspace @ioi-dev/vue-table run build`
- `npm --workspace @ioi/vue-table-playground run build`
- `npm --workspaces run lint`
- `npm --workspaces run typecheck`

## Compatibility

- Vue 3.4+ stable is the baseline target
- Vue 3.6 compatibility is tracked in CI (no preview-only behavior dependency)
- Vapor mode is intentionally out of scope for v1.0 and planned as a separate entry point later
