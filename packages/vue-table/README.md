# @ioi-dev/vue-table

A performance-first Vue 3 data table component with a streamlined API surface and JavaScript-first defaults. Designed to deliver enterprise-grade performance without the complexity of larger alternatives.

> **v0.2.5** - Minimal CSS tier, row reorder, clipboard copy, column groups

## Overview

IOI Vue Table provides a lightweight yet powerful solution for rendering large datasets in Vue 3 applications. It combines virtual scrolling, efficient sorting and filtering, and flexible customisation options whilst maintaining a small bundle footprint.

### Key Features

- **Performance-First Architecture**: Optimised for rendering thousands of rows with minimal overhead
- **Virtual Scrolling**: Built-in virtualisation for smooth scrolling through large datasets
- **Dynamic Row Classes**: Apply CSS classes per-row via string, object, or `(row, index) => ...` function
- **Auto-Size Columns**: Programmatically size columns to fit content with a single call
- **Row Grouping**: Group rows by single or multiple columns with aggregate calculations
- **Inline Editing**: Cell-level editing with validation, keyboard commit/cancel, and Tab navigation
- **Row Selection**: Single and multi-row selection with shift-click range and Ctrl+A
- **Flexible Column Definitions**: Strongly-typed column configuration with support for various data types
- **Headless Pagination**: Full control over pagination state with reactive bindings
- **Header Filters**: Built-in support for text and select-based column filtering
- **Row Expansion**: Expandable rows with custom content slots
- **CSV Export/Import**: Secure data export with formula sanitisation and preview-based import
- **Server-Side Mode**: Fetch data from server with debounced requests, loading/error states, cursor-based pagination, and infinite scroll support
- **Accessibility (a11y)**: Full keyboard navigation (Arrow keys, Home/End, PageUp/PageDown), focus management, ARIA attributes, live region announcements, and WCAG 2.1 AA compliance
- **TypeScript Support**: Comprehensive type definitions with full generic inference
- **Zero-Dependency Core**: Minimal external dependencies to reduce bundle size

## Keywords

vue, vue3, vuejs, vue-3, table, datatable, data-table, grid, data-grid, table-component, vue-component, virtual-scroll, virtualization, virtual-list, sorting, filtering, pagination, grouping, row-groups, aggregations, group-by, row-expansion, csv-export, csv-import, typescript, ts, performance, lightweight, enterprise, responsive, headless, reactive, composition-api, vue-composition-api, frontend, ui-component, data-display, spreadsheet, ag-grid-alternative, tanstack-alternative

## Installation

```bash
npm install @ioi-dev/vue-table
```

### CSS Integration

The default package entry includes library CSS. For zero-CSS integration, use the unstyled entry point:

```bash
@ioi-dev/vue-table/unstyled
```

**Available entry points:**

| Entry Point | CSS | Use Case |
|-------------|-----|----------|
| `@ioi-dev/vue-table` | Full styles | Quick start |
| `@ioi-dev/vue-table/minimal` | Functional-only (padding, borders, hover) | Custom design systems |
| `@ioi-dev/vue-table/unstyled` | None | Headless / full CSS control |

**Available CSS import paths:**

- Canonical: `@ioi-dev/vue-table/styles.css`
- Compatibility alias: `@ioi-dev/vue-table/style.css`

The minimal CSS tier provides cell padding, row borders, sticky header, subtle hover, and keyboard focus ring — with zero brand colours, rounded corners, or shadows. Ideal as a starting point for custom themes:

```ts
import { Table } from '@ioi-dev/vue-table/unstyled';
import '@ioi-dev/vue-table/minimal';
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

> **Note**: `IoiTable` remains available as a backward-compatible alias for `Table`.

## Advanced Usage

### Pagination with Header Filters

This example demonstrates headless pagination with reactive state management and built-in header filters:

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

### Row Grouping

Group rows by single or multiple columns with aggregate calculations:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface SalesRow {
  id: number;
  region: string;
  product: string;
  amount: number;
}

const rows = ref<SalesRow[]>([
  { id: 1, region: 'North', product: 'Widget', amount: 100 },
  { id: 2, region: 'North', product: 'Gadget', amount: 200 },
  { id: 3, region: 'South', product: 'Widget', amount: 150 },
  { id: 4, region: 'South', product: 'Gadget', amount: 250 }
]);

const expandedGroups = ref<string[]>(['North']);

const groupAggregations = {
  amount: ['sum', 'avg']
};
</script>

<template>
  <Table
    v-model:expandedGroupKeys="expandedGroups"
    :rows="rows"
    :columns="[
      { field: 'region', header: 'Region' },
      { field: 'product', header: 'Product' },
      { field: 'amount', header: 'Amount', type: 'number' }
    ]"
    row-key="id"
    group-by="region"
    :group-aggregations="groupAggregations"
  />
</template>
```

### Server-Side Mode

For large datasets or real-time data, use server-side mode to fetch data on demand:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ServerDataOptions, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID', type: 'number' },
  { field: 'name', header: 'Name', type: 'text' },
  { field: 'email', header: 'Email', type: 'text' }
];

const serverOptions: ServerDataOptions<UserRow> = {
  fetch: async (params) => {
    const response = await fetch(`/api/users?page=${params.pageIndex}&size=${params.pageSize}`);
    const data = await response.json();
    return {
      rows: data.items,
      totalRows: data.total
    };
  },
  debounceMs: 300
};
</script>

<template>
  <Table
    data-mode="server"
    :server-options="serverOptions"
    :columns="columns"
    row-key="id"
  />
</template>
```

### Row Selection

Single and multi-row selection with reactive state:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow { id: number; name: string; role: string; }

const columns: ColumnDef<UserRow>[] = [
  { field: 'name', header: 'Name' },
  { field: 'role', header: 'Role' }
];

const rows: UserRow[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'Editor' }
];

const selectedKeys = ref<number[]>([]);
</script>

<template>
  <Table
    v-model:selectedRowKeys="selectedKeys"
    :rows="rows"
    :columns="columns"
    row-key="id"
    selection-mode="multi"
  />
  <p>Selected: {{ selectedKeys }}</p>
</template>
```

### Inline Editing

Enable cell editing per column. Commit with Enter, cancel with Escape, Tab to move between cells:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface ProductRow { id: number; name: string; price: number; }

const rows = ref<ProductRow[]>([
  { id: 1, name: 'Widget', price: 9.99 },
  { id: 2, name: 'Gadget', price: 24.99 }
]);

const columns: ColumnDef<ProductRow>[] = [
  { field: 'id', header: 'ID', editable: false },
  { field: 'name', header: 'Name' },
  { field: 'price', header: 'Price', type: 'number' }
];

function onCellEdit(payload: { field: string; rowIndex: number; oldValue: unknown; newValue: unknown }) {
  const row = rows.value[payload.rowIndex];
  (row as Record<string, unknown>)[payload.field] = payload.newValue;
}
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    @cell-edit-commit="onCellEdit"
  />
</template>
```

> All columns are editable by default. Set `editable: false` on a column to opt out.

### Dynamic Row Classes

Apply CSS classes to rows based on data using a string, object, or function:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface OrderRow { id: number; status: 'active' | 'pending' | 'error'; total: number; }

const columns: ColumnDef<OrderRow>[] = [
  { field: 'id', header: 'ID' },
  { field: 'status', header: 'Status' },
  { field: 'total', header: 'Total', type: 'number' }
];

const rows: OrderRow[] = [
  { id: 1, status: 'active', total: 120 },
  { id: 2, status: 'pending', total: 45 },
  { id: 3, status: 'error', total: 0 }
];

function getRowClass(row: OrderRow): Record<string, boolean> {
  return {
    'row--active': row.status === 'active',
    'row--pending': row.status === 'pending',
    'row--error': row.status === 'error'
  };
}
</script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" :row-class="getRowClass" />
</template>

<style>
.row--active { background: #f0fdf4; }
.row--pending { background: #fffbeb; }
.row--error  { background: #fef2f2; }
</style>
```

### Auto-Size Columns

Resize columns to fit their content based on rendered cell widths:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';

const tableRef = ref<InstanceType<typeof Table> | null>(null);

function fitAll() {
  tableRef.value?.autoSizeColumns();
}

function fitNameOnly() {
  tableRef.value?.autoSizeColumns(['name'], { maxWidth: 300 });
}
</script>

<template>
  <button @click="fitAll">Fit All</button>
  <button @click="fitNameOnly">Fit Name</button>
  <Table ref="tableRef" :rows="rows" :columns="columns" row-key="id" />
</template>
```

`autoSizeColumns(columnIds?, options?)` accepts an optional list of column IDs and an options object:

| Option | Default | Description |
|--------|---------|-------------|
| `includeHeaders` | `true` | Include header cell widths in the calculation |
| `padding` | `16` | Extra padding added to each measured cell |
| `minWidth` | `50` | Floor width in pixels |
| `maxWidth` | `500` | Ceiling width in pixels |

### Accessibility

The table is built with accessibility in mind:

- **Keyboard Navigation**: Full support for Arrow keys, Home/End, Page Up/Down
- **Focus Management**: Visible focus indicators and focus trapping in edit mode
- **Screen Reader Support**: ARIA attributes and live region announcements
- **WCAG 2.1 AA Compliance**: Color contrast, focus visibility, and reduced motion support

```vue
<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    aria-label="Employee directory"
  />
</template>
```

### Row Reorder

Enable drag-and-drop row reordering. The table does **not** mutate your data — it fires a `row-reorder` event with the source and destination indices so you can update your data source:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface TaskRow { id: number; title: string; priority: number; }

const rows = ref<TaskRow[]>([
  { id: 1, title: 'Design mockups', priority: 1 },
  { id: 2, title: 'Implement API', priority: 2 },
  { id: 3, title: 'Write tests', priority: 3 }
]);

const columns: ColumnDef<TaskRow>[] = [
  { field: 'id', header: 'ID', type: 'number' },
  { field: 'title', header: 'Title' },
  { field: 'priority', header: 'Priority', type: 'number' }
];

function onReorder(payload: { fromIndex: number; toIndex: number }) {
  const [moved] = rows.value.splice(payload.fromIndex, 1);
  rows.value.splice(payload.toIndex, 0, moved);
}
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    row-draggable
    @row-reorder="onReorder"
  />
</template>
```

Drag handles are keyboard-accessible: use Alt+Arrow keys to move the focused row up or down.

### Clipboard Copy

When row selection is active, pressing Ctrl+C (Cmd+C on macOS) copies selected rows as tab-separated values to the clipboard. Headers are included and hidden columns are excluded.

```ts
copyable?: boolean  // default: true when selection is enabled
```

You can also call the method programmatically via the table ref:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';

const tableRef = ref<InstanceType<typeof Table> | null>(null);

async function copySelected() {
  await tableRef.value?.copySelectionToClipboard();
}
</script>

<template>
  <button @click="copySelected">Copy Selection</button>
  <Table ref="tableRef" :rows="rows" :columns="columns" row-key="id" selection-mode="multi" />
</template>
```

### Column Groups

Render spanning multi-level column headers by grouping columns under shared header cells:

```vue
<script setup lang="ts">
import { Table, type ColumnDef, type ColumnGroup } from '@ioi-dev/vue-table';

interface SalesRow { id: number; q1: number; q2: number; q3: number; q4: number; region: string; }

const columns: ColumnDef<SalesRow>[] = [
  { id: 'region', field: 'region', header: 'Region' },
  { id: 'q1', field: 'q1', header: 'Q1', type: 'number' },
  { id: 'q2', field: 'q2', header: 'Q2', type: 'number' },
  { id: 'q3', field: 'q3', header: 'Q3', type: 'number' },
  { id: 'q4', field: 'q4', header: 'Q4', type: 'number' }
];

const columnGroups: ColumnGroup[] = [
  { id: 'quarters', header: 'Quarterly Revenue', columnIds: ['q1', 'q2', 'q3', 'q4'] }
];
</script>

<template>
  <Table :rows="rows" :columns="columns" :column-groups="columnGroups" row-key="id" />
</template>
```

Column groups support a `#column-group-header` slot for custom group header content. Single-level only in v0.2.5; nested groups are planned for a future release.

## Configuration Options

### Behaviour Defaults

| Option | Default | Description |
|--------|---------|-------------|
| `sanitizeFormulas` | `true` | Sanitises formula-like prefixes in CSV exports to prevent injection attacks |
| `globalSearchDebounceMs` | `0` | Debounce interval for global search input (milliseconds) |
| `filterDebounceMs` | `0` | Debounce interval for filter operations (milliseconds) |
| `rowHeight` | Configurable | Height of each row for virtualisation calculations |
| `overscan` | Configurable | Number of extra rows to render outside viewport for smoother scrolling |

## Documentation

- **[Live Demo](https://rawand-hawez.github.io/ioi-vue-table/)** - Interactive playground with all features
- **[API Reference](https://github.com/Rawand-Hawez/ioi-vue-table/blob/main/packages/vue-table/API-REFERENCE.md)** - Complete API documentation with examples
- **[Migration Guide](https://github.com/Rawand-Hawez/ioi-vue-table/blob/main/packages/vue-table/MIGRATION.md)** - Guide for upgrading between versions
- **[Repository](https://github.com/Rawand-Hawez/ioi-vue-table)** - Source code and issue tracker

## Requirements

- Vue 3.4 or higher
- Modern browser with ES2020 support

## License

MIT

## Contributing

Contributions are welcome. Please refer to the repository guidelines for submission requirements and coding standards.
