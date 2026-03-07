# API Reference

**Package**: @ioi-dev/vue-table  
**Version**: 0.1.18+  
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

### Grouping Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `groupBy` | `string \| string[]` | - | Column field(s) to group by |
| `groupAggregations` | `Record<string, AggregationType[]>` | - | Aggregation functions per column |
| `expandedGroupKeys` | `Array<string>` | - | Controlled expanded group keys |

#### AggregationType

```typescript
type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
```

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
| `row-expand` | `{ row, rowIndex, rowKey, expanded }` | Row expansion toggled |

### Grouping Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:expandedGroupKeys` | `Array<string>` | Expanded group keys changed |
| `group-expand` | `IoiGroupExpandPayload` | Group expansion toggled |

#### IoiGroupExpandPayload

```typescript
interface IoiGroupExpandPayload {
  groupKey: string;       // Unique group identifier
  groupValue: unknown;    // The grouping value
  expanded: boolean;      // New expansion state
  rowCount: number;       // Number of rows in this group
}
```

---

## Slots

### Available Slots

| Slot | Props | Description |
|------|-------|-------------|
| `header` | `{ column: ColumnDef, columnIndex: number }` | Custom header cell |
| `header-filter` | `{ column, columnIndex, mode, value, options, setValue, clear }` | Custom header filter |
| `cell` | `{ row: TRow, rowIndex: number, column: ColumnDef, columnIndex: number, value: unknown }` | Custom cell content |
| `expanded-row` | `{ row: TRow, rowIndex: number }` | Expanded row content |
| `group-header` | `{ group: GroupHeader }` | Custom group header content |
| `empty` | - | Empty state content |

### GroupHeader Props

```typescript
interface GroupHeader {
  key: string;                          // Unique group key
  value: unknown;                       // The grouping value
  count: number;                        // Number of rows in group
  aggregations: Record<string, number>; // Computed aggregations
}
```

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

### Grouping Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `toggleGroupExpansion` | `(groupKey: string) => void` | Toggle group expansion |
| `expandAllGroups` | `() => void` | Expand all groups |
| `collapseAllGroups` | `() => void` | Collapse all groups |
| `isGroupExpanded` | `(groupKey: string) => boolean` | Check if group expanded |

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

## Row Grouping Feature

### Basic Grouping

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table';

interface SalesRow {
  id: number;
  region: string;
  product: string;
  amount: number;
  date: string;
}

const columns: ColumnDef<SalesRow>[] = [
  { field: 'region', header: 'Region', type: 'text' },
  { field: 'product', header: 'Product', type: 'text' },
  { field: 'amount', header: 'Amount', type: 'number' },
  { field: 'date', header: 'Date', type: 'date' }
];

const rows: SalesRow[] = [
  { id: 1, region: 'North', product: 'Widget A', amount: 100, date: '2024-01-15' },
  { id: 2, region: 'North', product: 'Widget B', amount: 200, date: '2024-01-16' },
  { id: 3, region: 'South', product: 'Widget A', amount: 150, date: '2024-01-15' },
  { id: 4, region: 'South', product: 'Widget B', amount: 250, date: '2024-01-16' }
];
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    group-by="region"
    :height="400"
  />
</template>
```

### Grouping with Aggregations

```vue
<script setup lang="ts">
const groupAggregations = {
  amount: ['sum', 'avg', 'min', 'max'],
  id: ['count']
};
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    group-by="region"
    :group-aggregations="groupAggregations"
    :height="400"
  >
    <template #group-header="{ group }">
      <div class="flex items-center gap-4 p-2 bg-gray-100 font-semibold">
        <span>{{ group.value }}</span>
        <span class="text-gray-500">({{ group.count }} items)</span>
        <span class="text-blue-600">Total: ${{ group.aggregations.amount_sum }}</span>
        <span class="text-green-600">Avg: ${{ group.aggregations.amount_avg?.toFixed(2) }}</span>
      </div>
    </template>
  </Table>
</template>
```

### Multi-Column Grouping

```vue
<script setup lang="ts">
// Group by region, then by product
const groupBy = ['region', 'product'];
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    :group-by="groupBy"
    :height="400"
  />
</template>
```

### Controlled Group Expansion

```vue
<script setup lang="ts">
import { ref } from 'vue';

// Pre-expand specific groups
const expandedGroupKeys = ref(['North', 'South|Widget A']);

function onGroupExpand(payload) {
  console.log('Group:', payload.groupValue, 'Expanded:', payload.expanded);
  console.log('Rows in group:', payload.rowCount);
}
</script>

<template>
  <Table
    v-model:expandedGroupKeys="expandedGroupKeys"
    :rows="rows"
    :columns="columns"
    row-key="id"
    group-by="region"
    @group-expand="onGroupExpand"
    :height="400"
  />
</template>
```

### Grouping with Pagination

Grouping works seamlessly with pagination. Pagination is applied to the grouped entries (groups + rows), not raw rows:

```vue
<script setup lang="ts">
import { ref } from 'vue';

const pageIndex = ref(0);
const pageSize = ref(10);
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    :rows="rows"
    :columns="columns"
    row-key="id"
    group-by="region"
    :height="400"
  />
</template>
```

### Grouping with Virtualization

Virtual scrolling works with grouped data for optimal performance:

```vue
<template>
  <Table
    :rows="largeDataset"
    :columns="columns"
    row-key="id"
    group-by="category"
    :height="600"
    :overscan="10"
  />
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

#### Group Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.ioi-table__group-header` | TR | Group header row |
| `.ioi-table__group-content` | TD | Group header content cell |
| `.ioi-table__group-toggle` | Button | Group expand/collapse button |

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

.ioi-table__group-header {
  @apply bg-gray-50 font-semibold;
}

.ioi-table__group-content {
  @apply p-3;
}

.ioi-table__group-toggle {
  @apply mr-2 text-gray-600 hover:text-gray-900;
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

.ioi-table__group-header {
  background-color: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
}

.ioi-table__group-content {
  padding: 12px 16px;
  font-weight: 600;
}

.ioi-table__group-toggle {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 8px;
  transition: transform 0.2s;
}

.ioi-table__group-toggle[aria-expanded="true"] {
  transform: rotate(90deg);
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
| `renderEntries` | `ComputedRef<IoiRenderEntry[]>` | Render entries (groups + rows) |
| `groups` | `ComputedRef<GroupHeader[]>` | Group metadata |
| `virtualRange` | `ComputedRef<VirtualRange>` | Viewport range |
| `lastEvent` | `Ref<IoiSemanticEvent>` | Last semantic event |
| `actions` | `IoiTableActions` | All action methods |

### Render Entries API

When using grouping, `renderEntries` provides a unified way to render both groups and rows:

```typescript
interface IoiRenderEntry<TRow> {
  type: 'group' | 'row';
  renderKey: string;
  // For groups:
  group?: GroupHeader;
  // For rows:
  row?: TRow;
  rowIndex?: number;
}
```

```vue
<script setup lang="ts">
import { useIoiTable } from '@ioi-dev/vue-table';

const table = useIoiTable({
  rows: myRows,
  columns: myColumns,
  groupBy: 'category'
});
</script>

<template>
  <div v-for="entry in table.renderEntries.value" :key="entry.renderKey">
    <div v-if="entry.type === 'group'" class="group-header">
      {{ entry.group.value }} ({{ entry.group.count }})
    </div>
    <div v-else class="row">
      {{ entry.row.name }}
    </div>
  </div>
</template>
```

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

### Grouping Types

```typescript
import type { 
  GroupHeader, 
  IoiGroupRenderEntry, 
  IoiRowRenderEntry,
  IoiRenderEntry,
  AggregationType,
  IoiGroupExpandPayload
} from '@ioi-dev/vue-table';

// Group header structure
const group: GroupHeader = {
  key: 'North',
  value: 'North',
  count: 25,
  aggregations: {
    amount_sum: 15000,
    amount_avg: 600
  }
};

// Aggregation configuration
const aggregations: Record<string, AggregationType[]> = {
  amount: ['sum', 'avg'],
  quantity: ['sum', 'count'],
  price: ['min', 'max']
};
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Arrow Up/Down` | Navigate rows |
| `Enter` or `Space` | Toggle selection / Toggle expansion / Toggle group |
| `Escape` | Cancel edit |
| `Tab` | Navigate to next focusable element |

### ARIA Attributes

- `role="grid"` on table
- `aria-sort` on sorted columns
- `aria-selected` on selected rows
- `aria-expanded` on expandable rows and groups
- `aria-live="polite"` for announcements

---

## Performance

### Virtualization

- Only visible rows are rendered
- Configurable `overscan` for smooth scrolling
- Works with 100k+ rows at 60fps
- Virtualization works with grouped data

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
const expandedGroupKeys = ref<string[]>([]);

function isExpandable(row: UserRow) {
  return row.status === 'active';
}

function onRowExpand(payload) {
  console.log('Expanded:', payload);
}

function onGroupExpand(payload) {
  console.log('Group expanded:', payload.groupValue, payload.rowCount);
}
</script>

<template>
  <Table
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    v-model:expandedRowKeys="expandedKeys"
    v-model:expandedGroupKeys="expandedGroupKeys"
    :rows="rows"
    :columns="columns"
    row-key="id"
    :height="500"
    expandable
    :row-expandable="isExpandable"
    group-by="department"
    @row-expand="onRowExpand"
    @group-expand="onGroupExpand"
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
    
    <template #group-header="{ group }">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{{ group.value }}</span>
        <span class="text-gray-500 text-sm">({{ group.count }} employees)</span>
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
- Grouping feature added (new props/events/slots/methods)
- No breaking changes to existing API

---

## Support

- **GitHub**: https://github.com/Rawand-Hawez/ioi-vue-table
- **Documentation**: https://github.com/Rawand-Hawez/ioi-vue-table#readme
- **Issues**: https://github.com/Rawand-Hawez/ioi-vue-table/issues

---

## License

MIT
