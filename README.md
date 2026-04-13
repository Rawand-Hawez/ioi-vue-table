# IOI Vue Table

A performance-first Vue 3 data table with virtual scrolling, rich filtering, row grouping, inline editing, CSV export, and server-side mode — all in a zero-dependency, TypeScript-first package.

**[Live Demo →](https://rawand-hawez.github.io/ioi-vue-table/)**

## Features

- **Virtual Scroll** — render 100,000+ rows at 60fps with windowed virtualisation
- **Sort & Filter** — multi-column sort, text / select / number / date header filters, global search
- **Row Grouping** — group by any field with sum, avg, count, min, max aggregations per group
- **Inline Editing** — click-to-edit cells with per-column validation and commit/cancel lifecycle
- **Column Control** — pin, reorder, resize, and toggle column visibility
- **CSV Export** — export all, filtered, or selected rows; formula-injection safe
- **Server-Side Mode** — plug in a `serverOptions.fetch` function; the table handles paging, sorting, and filter state
- **Headless-Capable** — import from `/unstyled` and apply Tailwind, Bootstrap, or any CSS
- **TypeScript-First** — full type definitions with generic row types

## Installation

```bash
npm install @ioi-dev/vue-table
```

Import the default styled build:

```javascript
import { Table } from '@ioi-dev/vue-table';
```

Or the zero-CSS unstyled build:

```javascript
import { Table } from '@ioi-dev/vue-table/unstyled';
```

> **Note**: `IoiTable` remains available as a backward-compatible alias to `Table` in v1.x releases.

## Quick Start

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface Employee {
  id: number;
  name: string;
  department: string;
  salary: number;
}

const columns: ColumnDef<Employee>[] = [
  { field: 'id',         header: 'ID',         type: 'number', width: 72  },
  { field: 'name',       header: 'Name',        type: 'text',   width: 200, headerFilter: 'text'   },
  { field: 'department', header: 'Department',  type: 'text',   width: 150, headerFilter: 'select' },
  { field: 'salary',     header: 'Salary (£)',  type: 'number', width: 130 },
];

const rows: Employee[] = [
  { id: 1, name: 'Oliver Smith',     department: 'Engineering', salary: 85000 },
  { id: 2, name: 'Amelia Jones',     department: 'Product',     salary: 92000 },
  { id: 3, name: 'Harry Williams',   department: 'Design',      salary: 78000 },
];
</script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" :height="320" />
</template>
```

## Column Definition

| Property | Type | Description |
|----------|------|-------------|
| `field` | `string` | Key on the row object |
| `header` | `string` | Column header label |
| `type` | `'text' \| 'number' \| 'date'` | Data type for sorting and filtering |
| `width` | `number` | Column width in pixels |
| `pin` | `'left' \| 'right'` | Pin column to an edge |
| `headerFilter` | `'text' \| 'select'` | Render a filter input in the header row |
| `editable` | `false` | Opt a column out of inline editing |

## Row Grouping

```vue
<script setup lang="ts">
import { Table, type AggregationType, type ColumnDef } from '@ioi-dev/vue-table';

const groupAggregations: Record<string, AggregationType[]> = {
  salary: ['sum', 'avg', 'count'],
};
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    group-by="department"
    :group-aggregations="groupAggregations"
    :height="500"
  >
    <template #group-header="{ group, expanded, toggle }">
      <div @click="toggle()">
        {{ expanded ? '▼' : '▶' }}
        {{ group.value }} — {{ group.count }} rows
        · Sum: £{{ group.aggregations['salary_sum'] }}
      </div>
    </template>
  </Table>
</template>
```

## Server-Side Mode

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ServerDataOptions } from '@ioi-dev/vue-table';

const serverOptions: ServerDataOptions<Row> = {
  fetch: async ({ pageIndex, pageSize, sort, filters }) => {
    const res = await fetch(`/api/data?page=${pageIndex}&size=${pageSize}`);
    const json = await res.json();
    return { rows: json.data, totalRows: json.total };
  },
};
</script>

<template>
  <Table
    data-mode="server"
    :server-options="serverOptions"
    :columns="columns"
    row-key="id"
    :height="500"
  />
</template>
```

## Pagination

```vue
<script setup lang="ts">
import { ref } from 'vue';

const pageIndex = ref(0);
const pageSize  = ref(25);
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

## Table Ref API

Expose the table ref to call imperative methods:

```vue
<script setup lang="ts">
import { ref } from 'vue';

const tableRef = ref();

// Sort
tableRef.value?.setSortState([{ field: 'salary', direction: 'desc' }]);

// Filter
tableRef.value?.setColumnFilter('department', { type: 'text', operator: 'contains', value: 'Eng' });
tableRef.value?.setGlobalSearch('Oliver');
tableRef.value?.clearAllFilters();

// Selection
tableRef.value?.selectAll('filtered');
tableRef.value?.getSelectedKeys();    // → (string | number)[]
tableRef.value?.clearSelection();

// Navigation
tableRef.value?.scrollToRow(999);     // scroll to row index
tableRef.value?.setPageIndex(4);

// Export
tableRef.value?.exportCSV({ scope: 'filtered', filename: 'export.csv' });

// Groups
tableRef.value?.toggleGroupExpansion('Engineering');
tableRef.value?.expandAllGroups();
tableRef.value?.collapseAllGroups();
</script>

<template>
  <Table ref="tableRef" :rows="rows" :columns="columns" row-key="id" />
</template>
```

## Styling

The component uses a BEM class API for styling hooks:

| Class | Description |
|-------|-------------|
| `.ioi-table` | Root container |
| `.ioi-table__viewport` | Scrollable viewport |
| `.ioi-table__header-content` | Header cell content wrapper |
| `.ioi-table__filter-row` | Header filter row (`<tr>`) |
| `.ioi-table__filter-cell` | Header filter cell (`<th>`) |
| `.ioi-table__filter-input` | Text filter input |
| `.ioi-table__filter-select` | Select filter dropdown |
| `.ioi-table__row` | Data row |
| `.ioi-table__row--selected` | Selected row |
| `.ioi-table__row--focused` | Keyboard-focused row |
| `.ioi-table__cell` | Data cell |
| `.ioi-table__cell--editing` | Actively edited cell |
| `.ioi-table__cell--editable` | All cells in an editable column |
| `.ioi-table__group-header` | Group header row |
| `.ioi-table__header--sorted-asc` | Ascending sort indicator |
| `.ioi-table__header--sorted-desc` | Descending sort indicator |
| `.ioi-table__header--pinned-left-edge` | Last pinned-left column header |
| `.ioi-table__header--pinned-right-edge` | First pinned-right column header |
| `.ioi-table__header--drag-over-left` | Drag target — drop before |
| `.ioi-table__header--drag-over-right` | Drag target — drop after |

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
| `rowHeight` | Configurable | Row height in pixels for virtualisation calculations |
| `overscan` | Configurable | Extra rows rendered outside viewport for smoother scrolling |

## Roadmap

| Version | Focus | Target |
|---------|-------|--------|
| **v0.2.5** | Minimal CSS tier, row reorder, clipboard copy, column groups | 2026-Q2 |
| **v1.0** | Row expansion, stable API, full test coverage | 2026-Q2 |
| **v1.1** | Optional Rust/WASM acceleration (sort, filter, virtual engine, CSV streaming) | 2026-Q3 |
| **v1.2** | Column grouping (nested), undo/redo, state persistence, MCP bridge, real-time updates | 2026-Q4 |
| **v2.0** | MCP advanced tier (multi-table, write-mode, guardrails) | 2027+ |

Core MCP bridge planned for v1.2. The WASM layer in v1.1 is fully opt-in via a separate entry point — the JavaScript implementation remains first-class with no breaking API changes. See [ROADMAP.md](./docs/ROADMAP.md) for full details.

## Development

```bash
npm install

# Run playground (demo site)
npm --workspace @ioi/vue-table-playground run dev

# Run tests
npm --workspace @ioi-dev/vue-table run test

# Build package
npm --workspace @ioi-dev/vue-table run build

# Lint & typecheck
npm run ci
```

## Compatibility

| Requirement | Support |
|-------------|---------|
| Vue 3.4+ | Full support (baseline target) |
| Vue 3.6 | Compatibility tracked in CI |
| Vapor Mode | Planned for future release (separate entry point) |
| Browsers | Modern browsers with ES2020 support |
| TypeScript | 5.x |

## Contributing

Contributions are welcome. Please refer to [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for submission requirements, coding standards, and development setup.

## License

MIT
