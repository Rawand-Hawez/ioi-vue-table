# AI Installation Guide: @ioi-dev/vue-table

## Step 1: Install

```bash
npm install @ioi-dev/vue-table
```

## Step 2: Import CSS

You must explicitly import the CSS. The table does not auto-inject styles.

```js
// In main.ts or your component:
import '@ioi-dev/vue-table/styles.css'
```

For shadcn projects, also import the shadcn theme:
```js
import '@ioi-dev/vue-table/styles.css'
import '@ioi-dev/vue-table/themes/shadcn.css'
```

## Step 3: Basic Usage

```vue
<script setup>
import { IoiTable } from '@ioi-dev/vue-table'
import '@ioi-dev/vue-table/styles.css'

const columns = [
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
]

const rows = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]
</script>

<template>
  <IoiTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    :page-size="10"
    :show-pagination="true"
  />
</template>
```

## Step 4: Selection

```vue
<template>
  <IoiTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    selection-mode="multi"
    v-model:selected-row-keys="selectedKeys"
    @selection-change="onSelectionChange"
  />
</template>
```

## Step 5: Server Mode

```vue
<script setup>
const serverOptions = {
  fetch: async (params) => {
    const res = await fetch(`/api/data?page=${params.pageIndex}&size=${params.pageSize}`)
    const data = await res.json()
    return { rows: data.items, totalRows: data.total }
  }
}
</script>

<template>
  <IoiTable
    :columns="columns"
    :rows="[]"
    data-mode="server"
    :server-options="serverOptions"
    row-key="id"
  />
</template>
```

## Common Mistakes

1. **Forgetting CSS import**: Table renders unstyled. Always import `styles.css`.
2. **Using `query` instead of `fetch`**: The canonical server callback is `serverOptions.fetch`.
3. **Using `cell-edit-commit`**: The canonical event is `cell-commit`.
4. **Not setting `rowKey`**: Selection and editing require `rowKey` to identify rows.

## Exports

- `IoiTable` — Main component (styled)
- `useIoiTable` — Headless composable
- `Table` / `DataTable` — Legacy aliases for `IoiTable`
- Types: `ColumnDef`, `IoiCellCommitPayload`, `ServerFetchParams`, `ServerFetchResult`, `PaginationSlotProps`
