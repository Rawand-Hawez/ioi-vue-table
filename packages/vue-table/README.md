# @ioi-dev/vue-table

A performance-first Vue 3 data table component with a streamlined API surface and JavaScript-first defaults. Designed to deliver enterprise-grade performance without the complexity of larger alternatives.

## Overview

IOI Vue Table provides a lightweight yet powerful solution for rendering large datasets in Vue 3 applications. It combines virtual scrolling, efficient sorting and filtering, and flexible customisation options whilst maintaining a small bundle footprint.

### Key Features

- **Performance-First Architecture**: Optimised for rendering thousands of rows with minimal overhead
- **Virtual Scrolling**: Built-in virtualisation for smooth scrolling through large datasets
- **Row Grouping**: Group rows by single or multiple columns with aggregate calculations
- **Flexible Column Definitions**: Strongly-typed column configuration with support for various data types
- **Headless Pagination**: Full control over pagination state with reactive bindings
- **Header Filters**: Built-in support for text and select-based column filtering
- **Row Expansion**: Expandable rows with custom content slots
- **CSV Export/Import**: Secure data export with formula sanitisation and preview-based import
- **TypeScript Support**: Comprehensive type definitions for enhanced developer experience
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

**Available CSS import paths:**

- Canonical: `@ioi-dev/vue-table/styles.css`
- Compatibility alias: `@ioi-dev/vue-table/style.css`

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

- **[API Reference](./API-REFERENCE.md)** - Complete API documentation with examples
- **Repository**: [https://github.com/Rawand-Hawez/ioi-vue-table](https://github.com/Rawand-Hawez/ioi-vue-table)
- **Full Guide**: [https://github.com/Rawand-Hawez/ioi-vue-table#readme](https://github.com/Rawand-Hawez/ioi-vue-table#readme)

## Requirements

- Vue 3.4 or higher
- Modern browser with ES2020 support

## License

MIT

## Contributing

Contributions are welcome. Please refer to the repository guidelines for submission requirements and coding standards.
