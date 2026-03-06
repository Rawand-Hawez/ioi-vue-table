# API Reference

**Package**: @ioi-dev/vue-table  
**Version**: 0.1.17+  
**Last Updated**: 2026-03-07

---

## Overview

IOI Vue Table is a **headless**, performance-first Vue 3 data table component. It provides all functionality without enforcing any specific styling, allowing you to use custom CSS or any CSS framework (Tailwind, Bootstrap, shadCN, etc.).

### Design Philosophy

- **Headless-First**: No built-in styles, complete styling freedom
- **Composable Architecture**: Use `<Table>` component or `useIoiTable()` composable
- **Type-Safe**: Full TypeScript support with strict mode
- **Accessible**: ARIA attributes and keyboard navigation built-in
- **Performant**: Virtual scrolling, efficient updates, minimal re-renders

---

## Installation

```bash
npm install @ioi-dev/vue-table
```

### Entry Points

| Entry Point | Description | Use Case |
|-------------|-------------|----------|
| `@ioi-dev/vue-table` | Default (includes CSS) | Quick start |
| `@ioi-dev/vue-table/unstyled` | No CSS | Headless/custom styling |
| `@ioi-dev/vue-table/composables/useIoiTable` | Composable only | Maximum control |
| `@ioi-dev/vue-table/composables/useColumnState` | Column state management | Advanced usage |
| `@ioi-dev/vue-table/utils/nestedPath` | Nested path utilities | Standalone usage |

---

## Component API

### Basic Usage

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 90 },
  { field: 'name', header: 'Name', type: 'text' },
  { field: 'email', header: 'Email', type: 'text' },
  { field: 'status', header: 'Status', type: 'text' }
];

const rows: UserRow[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' }
];
</script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" :height="400" />
</template>
```

---

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `TRow[]` | `[]` | Table data rows |
| `columns` | `ColumnDef<TRow>[]` | `[]` | Column definitions |
| `rowKey` | `keyof TRow \| ((row: TRow, index: number) => string \| number)` | - | Row identity key (required for selection/editing) |
| `rowHeight` | `number` | `36` | Row height in pixels |
| `overscan` | `number` | `5` | Extra rows to render outside viewport |
| `height` | `number` | `320` | Table viewport height |

### Pagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageIndex` | `number` | `0` | Current page index (0-based) |
| `pageSize` | `number` | `0` | Rows per page (0 = disabled) |

### Expansion Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `expandable` | `boolean` | `false` | Enable row expansion |
| `rowExpandable` | `(row: TRow, index: number) => boolean` | - | Function to determine if row is expandable |
| `expandedRowKeys` | `Array<string \| number>` | - | Controlled expanded row keys |

### Debounce Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `globalSearchDebounceMs` | `number` | `0` | Debounce delay for global search |
| `filterDebounceMs` | `number` | `0` | Debounce delay for column filters |

---

## Events

### Core Events

| Event | Payload | Description |
|-------|---------|-------------|
| `row-click` | `{ row: TRow, rowIndex: number }` | Row clicked |
| `state-change` | `IoiSemanticEvent<unknown>` | Table state changed |

### Pagination Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:pageIndex` | `number` | Page index changed |
| `update:pageSize` | `number` | Page size changed |
| `pagination-change` | `IoiPaginationChangePayload` | Pagination state changed |

### Expansion Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:expandedRowKeys` | `Array<string \| number>` | Expanded row keys changed |
| `row-expand` | `{ row: TRow, rowIndex: number, rowKey: string \| number, expanded: boolean }` | Row expansion toggled |

---

## Slots

### Available Slots

| Slot | Props | Description |
|------|-------|-------------|
| `header` | `{ column: ColumnDef, columnIndex: number }` | Custom header cell |
| `header-filter` | `{ column, columnIndex, mode, value, options, setValue, clear }` | Custom header filter |
| `cell` | `{ row: TRow, rowIndex: number, column: ColumnDef, columnIndex: number, value: unknown }` | Custom cell content |
| `expanded-row` | `{ row: TRow, rowIndex: number }` | Expanded row content |
| `empty` | - | Empty state content |

---

## Column Definition

### ColumnDef Interface

```typescript
interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string;                              // Column identifier
  field: keyof TRow | string;               // Data field (supports nested paths)
  header?: string;                          // Header text
  type?: 'text' | 'number' | 'date';       // Data type
  headerFilter?: 'text' | 'select';        // Header filter type
  validate?: (value: unknown, row: TRow) => true | string;  // Validation function
  comparator?: (valueA, valueB, rowA, rowB) => number;      // Custom sort comparator
  width?: number | string;                  // Column width
  minWidth?: number;                        // Minimum width
  maxWidth?: number;                        // Maximum width
  hidden?: boolean;                         // Hide column
  pin?: 'left' | 'right' | 'none';         // Pin column
}
```

---

## Exposed Methods

Access via template ref:

```vue
<script setup>
import { ref } from 'vue';

const tableRef = ref();

// Usage
tableRef.value.exportCSV();
tableRef.value.toggleRowExpansion(rowKey);
</script>

<template>
  <Table ref="tableRef" ... />
</template>
```

### Data Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `exportCSV` | `(options?: ExportCsvOptions) => string` | Export to CSV |
| `parseCSV` | `(source, options?) => Promise<CsvImportPreview>` | Parse CSV file |
| `commitCSVImport` | `(mapping?, options?) => CsvImportResult` | Import CSV data |
| `resetState` | `() => void` | Reset table state |

### Filter Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setColumnFilter` | `(field: string, filter: ColumnFilter) => void` | Set column filter |
| `clearColumnFilter` | `(field: string) => void` | Clear column filter |
| `setGlobalSearch` | `(text: string) => void` | Set global search |
| `clearAllFilters` | `() => void` | Clear all filters |
| `getColumnFacetOptions` | `(field: string) => string[]` | Get filter options |

### Sort Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setSortState` | `(sortState: SortState[]) => void` | Set sort state |
| `toggleSort` | `(field: string, multi?: boolean) => void` | Toggle column sort |

### Selection Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `toggleRow` | `(key: string \| number, options?) => void` | Toggle row selection |
| `isSelected` | `(key: string \| number) => boolean` | Check if selected |
| `clearSelection` | `() => void` | Clear selection |
| `selectAll` | `(scope?: SelectAllScope) => void` | Select all rows |
| `getSelectedKeys` | `() => Array<string \| number>` | Get selected keys |

### Expansion Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `toggleRowExpansion` | `(key: string \| number) => void` | Toggle row expansion |
| `expandAllRows` | `() => void` | Expand all rows |
| `collapseAllRows` | `() => void` | Collapse all rows |
| `isRowExpanded` | `(key: string \| number) => boolean` | Check if expanded |

### Editing Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `startEdit` | `(options: StartEditOptions) => void` | Start editing cell |
| `setEditDraft` | `(value: unknown) => void` | Set edit value |
| `commitEdit` | `() => boolean` | Commit edit |
| `cancelEdit` | `() => void` | Cancel edit |

### Column State Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setColumnOrder` | `(order: string[]) => void` | Set column order |
| `setColumnVisibility` | `(id: string, visible: boolean) => void` | Show/hide column |
| `setColumnPin` | `(id: string, pin: 'left' \| 'right' \| 'none') => void` | Pin column |
| `setColumnSizing` | `(id: string, width: number) => void` | Resize column |
| `getColumnStateSnapshot` | `() => ColumnStateSnapshot` | Get column state |

---

## Row Expansion Feature

### Basic Expansion

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' }
];

const rows = [...];
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    expandable
  >
    <template #expanded-row="{ row }">
      <div class="p-4 bg-gray-50">
        <h3>Details for {{ row.name }}</h3>
        <p>Email: {{ row.email }}</p>
        <p>Status: {{ row.status }}</p>
      </div>
    </template>
  </Table>
</template>
```

### Controlled Expansion

```vue
<script setup>
import { ref } from 'vue';

const expandedKeys = ref([1, 3]);

function onExpand(payload) {
  console.log('Row expanded:', payload.rowKey, payload.expanded);
}
</script>

<template>
  <Table
    v-model:expandedRowKeys="expandedKeys"
    :rows="rows"
    :columns="columns"
    row-key="id"
    expandable
    @row-expand="onExpand"
  >
    <template #expanded-row="{ row }">
      <!-- Custom content -->
    </template>
  </Table>
</template>
```

### Conditional Expansion

```vue
<script setup>
function isRowExpandable(row, index) {
  // Only expand rows with status 'active'
  return row.status === 'active';
}
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    expandable
    :row-expandable="isRowExpandable"
  >
    <template #expanded-row="{ row }">
      <!-- Only active rows will show this -->
    </template>
  </Table>
</template>
```

---

## Headless Styling

### CSS Class Reference

The table uses semantic class names for styling. No inline styles are applied (except for layout).

#### Container Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.ioi-table` | Root | Table container |
| `.ioi-table__viewport` | Div | Scrollable viewport |
| `.ioi-table__table` | Table | Table element |
| `.ioi-table__sr-only` | Div | Screen reader only content |

#### Header Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.ioi-table__header--sorted-asc` | TH | Ascending sort |
| `.ioi-table__header--sorted-desc` | TH | Descending sort |
| `.ioi-table__header--dragging` | TH | Dragging column |
| `.ioi-table__header--drag-target` | TH | Drop target |
| `.ioi-table__header-content` | Div | Header cell content |
| `.ioi-table__filter-input` | Input | Text filter input |
| `.ioi-table__filter-select` | Select | Select filter dropdown |
| `.ioi-table__resize-handle` | Button | Column resize handle |

#### Row Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.ioi-table__row` | TR | Table row |
| `.ioi-table__row--selected` | TR | Selected row |
| `.ioi-table__row--editing` | TR | Editing row |
| `.ioi-table__row--expanded` | TR | Expanded row |
| `.ioi-table__spacer` | TR | Virtualization spacer |
| `.ioi-table__empty` | TD | Empty state |

#### Cell Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.ioi-table__cell--editing` | TD | Editing cell |
| `.ioi-table__cell--expand` | TD | Expand icon cell |
| `.ioi-table__expand-icon` | Button | Expand/collapse button |
| `.ioi-table__expanded-row` | TR | Expanded row container |
| `.ioi-table__expanded-content` | TD | Expanded row content |

### Tailwind CSS Example

```vue
<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    class="border rounded-lg overflow-hidden"
  />
</template>

<style>
.ioi-table {
  @apply w-full;
}

.ioi-table__viewport {
  @apply overflow-auto;
}

.ioi-table__table {
  @apply w-full border-collapse;
}

.ioi-table__row {
  @apply border-b hover:bg-gray-50 transition-colors;
}

.ioi-table__row--selected {
  @apply bg-blue-50;
}

.ioi-table__row--editing {
  @apply bg-yellow-50;
}

.ioi-table__header-content {
  @apply font-semibold text-left p-3 bg-gray-100;
}

.ioi-table__cell {
  @apply p-3;
}

.ioi-table__expand-icon {
  @apply w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors;
}
</style>
```

### Bootstrap Example

```vue
<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    class="table table-hover"
  />
</template>

<style>
.ioi-table__table {
  @extend .table;
}

.ioi-table__row--selected {
  @extend .table-active;
}

.ioi-table__header-content {
  @extend .thead-light;
}
</style>
```

### Custom CSS Example

```css
/* Custom styling */
.ioi-table {
  font-family: 'Inter', sans-serif;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.ioi-table__viewport {
  max-height: 600px;
}

.ioi-table__row:hover {
  background-color: #f9fafb;
}

.ioi-table__row--selected {
  background-color: #eff6ff;
}

.ioi-table__expand-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.ioi-table__expand-icon:hover {
  transform: scale(1.1);
}

.ioi-table__expanded-content {
  background-color: #f9fafb;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}
```

---

## Composable API

For maximum control, use the `useIoiTable()` composable directly:

```vue
<script setup lang="ts">
import { useIoiTable, type ColumnDef } from '@ioi-dev/vue-table';

const table = useIoiTable({
  rows: myRows,
  columns: myColumns,
  rowKey: 'id',
  expandable: true,
  onRowExpand: (payload) => {
    console.log('Row expanded:', payload);
  }
});

// Access reactive state
console.log(table.state.value.expandedRowKeys);
console.log(table.visibleRows.value);

// Call methods
table.toggleRowExpansion(1);
table.expandAllRows();
table.exportCSV();
</script>

<template>
  <!-- Build your own UI -->
  <div v-for="row in table.visibleRows.value" :key="row.id">
    {{ row.name }}
  </div>
</template>
```

### Composable Return Values

| Property | Type | Description |
|----------|------|-------------|
| `state` | `Ref<IoiTableState>` | Table state |
| `rows` | `Ref<TRow[]>` | Normalized rows |
| `columns` | `Ref<ColumnDef[]>` | Normalized columns |
| `visibleRows` | `ComputedRef<TRow[]>` | Visible rows |
| `visibleIndices` | `ComputedRef<number[]>` | Visible row indices |
| `virtualRange` | `ComputedRef<VirtualRange>` | Viewport range |
| `lastEvent` | `Ref<IoiSemanticEvent>` | Last semantic event |
| `actions` | `IoiTableActions` | All action methods |

---

## TypeScript Support

### Generic Types

```typescript
// Strongly typed table
interface UserRow {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID', type: 'number' },
  { field: 'name', header: 'Name', type: 'text' }
  // TypeScript will validate field names
];
```

### Nested Paths

```typescript
interface ComplexRow {
  id: number;
  user: {
    profile: {
      name: string;
      email: string;
    };
  };
  tags: string[];
}

const columns: ColumnDef<ComplexRow>[] = [
  { field: 'id', header: 'ID' },
  { field: 'user.profile.name', header: 'Name' },
  { field: 'user.profile.email', header: 'Email' },
  { field: 'tags.0', header: 'First Tag' }
];
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Arrow Up/Down` | Navigate rows |
| `Enter` or `Space` | Toggle selection / Toggle expansion |
| `Escape` | Cancel edit |
| `Tab` | Navigate to next focusable element |

### ARIA Attributes

- `role="grid"` on table
- `aria-sort` on sorted columns
- `aria-selected` on selected rows
- `aria-expanded` on expandable rows
- `aria-live="polite"` for announcements

---

## Performance

### Virtualization

- Only visible rows are rendered
- Configurable `overscan` for smooth scrolling
- Works with 100k+ rows at 60fps

### Optimization Tips

1. Use `rowKey` for stable row identity
2. Memoize column definitions
3. Use debouncing for filters/search
4. Avoid inline functions in templates
5. Use `shallowRef` for large datasets

---

## Examples

### Complete Example with All Features

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface UserRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  department: string;
}

const columns: ColumnDef<UserRow>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name', type: 'text' },
  { 
    field: 'status', 
    header: 'Status', 
    type: 'text',
    headerFilter: 'select'
  },
  { 
    field: 'department', 
    header: 'Department', 
    type: 'text',
    headerFilter: 'text'
  }
];

const rows = ref<UserRow[]>([...]);
const pageIndex = ref(0);
const pageSize = ref(25);
const expandedKeys = ref<number[]>([]);

function isExpandable(row: UserRow) {
  return row.status === 'active';
}

function onRowExpand(payload) {
  console.log('Expanded:', payload);
}
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    v-model:expandedRowKeys="expandedKeys"
    :rows="rows"
    :columns="columns"
    row-key="id"
    :height="500"
    expandable
    :row-expandable="isExpandable"
    @row-expand="onRowExpand"
  >
    <template #cell="{ row, column, value }">
      <span v-if="column.field === 'status'" :class="value">
        {{ value }}
      </span>
      <span v-else>{{ value }}</span>
    </template>
    
    <template #expanded-row="{ row }">
      <div class="p-4 bg-gray-50">
        <h3 class="font-bold">{{ row.name }}</h3>
        <p>Email: {{ row.email }}</p>
        <p>Department: {{ row.department }}</p>
      </div>
    </template>
  </Table>
</template>
```

---

## Migration Guide

### From v0.x to v1.0

- `IoiTable` component renamed to `Table` (alias still available)
- Expansion feature added (new props/events/slots)
- No breaking changes to existing API

---

## Support

- **GitHub**: https://github.com/Rawand-Hawez/ioi-vue-table
- **Documentation**: https://github.com/Rawand-Hawez/ioi-vue-table#readme
- **Issues**: https://github.com/Rawand-Hawez/ioi-vue-table/issues

---

## License

MIT
