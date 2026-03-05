# @ioi-dev/vue-table

Performance-first Vue 3 data table with a small API surface and JS-first defaults.

## Install

```bash
npm install @ioi-dev/vue-table vue
```

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

## Docs

- Repository: <https://github.com/Rawand-Hawez/ioi-vue-table>
- Full guide: <https://github.com/Rawand-Hawez/ioi-vue-table#readme>
