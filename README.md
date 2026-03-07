# IOI Vue Table

A performance-first Vue 3 data table component with a streamlined, stable public API designed for enterprise applications.

## Overview

IOI Vue Table provides a lightweight yet powerful solution for rendering large datasets in Vue 3 applications. Built with performance and developer experience at its core, it offers comprehensive data table functionality whilst maintaining a small bundle footprint and intuitive API surface.

### Key Features

- **JavaScript-First Architecture**: Fully functional without requiring Rust or WASM dependencies
- **Headless Rendering**: Slot-based APIs and framework-friendly class hooks for complete styling control
- **Comprehensive Data Operations**: Built-in sorting, column filters, global search, selection, and editing workflows
- **Virtualised Rendering**: Default virtualisation for smooth performance with large datasets
- **Controlled Pagination**: Full pagination control when virtual scroll is disabled
- **CSV Workflows**: Import and export capabilities with security sanitisation
- **Semantic Events**: Versioned, machine-readable payloads for state changes
- **TypeScript Support**: Comprehensive type definitions for enhanced developer experience

> **Note**: `IoiTable` remains available as a backward-compatible alias to `Table` in v1.x releases.

## Installation

```bash
npm install @ioi-dev/vue-table
```

### CSS Integration

The default import includes library CSS. For zero-CSS integration:

```javascript
import { Table } from '@ioi-dev/vue-table/unstyled'
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

## Advanced Usage

### Controlled Pagination with Header Filters

This example demonstrates headless pagination with reactive state management and built-in header filters:

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

> **Note**: `headerFilter: 'select'` options are faceted from current table context, considering other active filters and global search whilst excluding the column's own filter.

## Styling

### Headless-First Design

The component ships with a headless-first architecture, enabling seamless integration with any styling solution:

- **Tailwind CSS**: Direct class targeting
- **shadCN/ui**: Compatible with component primitives
- **Bootstrap**: Standard class overrides
- **Custom CSS**: Full control via class hooks

### Available Class Hooks

| Class | Description |
|-------|-------------|
| `.ioi-table` | Root table container |
| `.ioi-table__viewport` | Scrollable viewport |
| `.ioi-table__table` | Inner table element |
| `.ioi-table__header-content` | Header cell content |
| `.ioi-table__filter-input` | Text filter inputs |
| `.ioi-table__filter-select` | Select filter dropdowns |
| `.ioi-table__row` | Table rows |
| `.ioi-table__empty` | Empty state container |
| `.ioi-table__row--selected` | Selected row state |
| `.ioi-table__row--editing` | Editing row state |
| `.ioi-table__header--sorted-asc` | Ascending sort indicator |
| `.ioi-table__header--sorted-desc` | Descending sort indicator |
| `.ioi-table__cell--editing` | Editing cell state |

## Configuration Options

### CSV Export

| Option | Default | Description |
|--------|---------|-------------|
| `sanitizeFormulas` | `true` | Sanitises formula-like values to prevent injection attacks |
| `formulaEscapePrefix` | `"'"` | Custom prefix for formula sanitisation (`"'"` or `"\t"`) |

### Performance Tuning

| Option | Default | Description |
|--------|---------|-------------|
| `globalSearchDebounceMs` | `0` | Debounce interval for global search (milliseconds) |
| `filterDebounceMs` | `0` | Debounce interval for filter operations (milliseconds) |
| `rowHeight` | Configurable | Row height for virtualisation calculations |
| `overscan` | Configurable | Extra rows to render outside viewport for smoother scrolling |

## Performance Model

### Current Capabilities

- **Client-Side Operations**: Smooth performance with approximately 1,000 rows with rich interactions
- **Large Datasets**: Utilise virtualisation and server-side data strategies for optimal performance
- **WASM Acceleration**: Optional accelerator path available, with JavaScript fallback always first-class
- **Low-Overhead Boundaries**: WASM integration uses indices and ranges, avoiding large object shuttling


## Development

### Running the Playground

```bash
npm install
npm --workspace @ioi/vue-table-playground run dev
```

### Available Routes

The playground includes several demonstration routes:

- `#/big-data` - Virtualisation stress tests
- `#/pinned-columns` - Column pinning, resize, and reorder demonstrations
- `#/ops-demo` - Sort, filter, search, and selection operations
- `#/csv-import` - CSV preview, validation, and commit workflows

### Workspace Commands

```bash
# Testing
npm --workspace @ioi-dev/vue-table run test

# Building
npm --workspace @ioi-dev/vue-table run build
npm --workspace @ioi/vue-table-playground run build

# Code Quality
npm --workspaces run lint
npm --workspaces run typecheck
```

## Compatibility

| Requirement | Support |
|-------------|---------|
| Vue 3.4+ | Full support (baseline target) |
| Vue 3.6 | Compatibility tracked in CI |
| Vapor Mode | Planned for future release (separate entry point) |

## Requirements

- Vue 3.4 or higher
- Modern browser with ES2020 support

## License

MIT

## Contributing

Contributions are welcome. Please refer to the repository guidelines for submission requirements and coding standards.
