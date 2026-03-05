# IOI Vue Table

Performance-first Vue 3 data table with a small API surface and JS-first defaults.

## Status

- JS-first implementation is the active baseline and fully usable without Rust.
- WASM acceleration is planned for a later phase and is not part of current releases.

## Install

```bash
npm install @ioi-dev/vue-table vue
```

## Quick Start

```vue
<script setup lang="ts">
import { IoiTable, type ColumnDef } from '@ioi-dev/vue-table';

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
  <IoiTable :rows="rows" :columns="columns" row-key="id" :height="320" />
</template>
```

## Run Playground

```bash
npm install
npm --workspace @ioi/vue-table-playground run dev
```

Playground routes (hash-based):

- `#/big-data` — 100k x 50 virtualization stress.
- `#/pinned-columns` — interactive pinned resize/reorder behavior.
- `#/ops-demo` — sort/filter/search/selection perf panel.
- `#/csv-import` — CSV preview + mapping + validation + commit.

## Workspace Commands

- `npm --workspace @ioi-dev/vue-table run test`
- `npm --workspace @ioi-dev/vue-table run build`
- `npm --workspace @ioi/vue-table-playground run build`
- `npm --workspaces run lint`
- `npm --workspaces run typecheck`

## Source-of-Truth Docs

- `AGENTS.md`
- `SPEC.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
