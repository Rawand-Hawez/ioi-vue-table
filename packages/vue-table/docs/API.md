# API Reference

Complete API reference for `@ioi-dev/vue-table`.

## Table of Contents

- [Components](#components)
- [Props](#props)
- [Events](#events)
- [Slots](#slots)
- [Exposed Methods](#exposed-methods)
- [ColumnDef Reference](#columndef-reference)
- [Composable: useIoiTable](#composable-useioitable)
- [Composable: useColumnState](#composable-usecolumnstate)
- [TypeScript Types](#typescript-types)

---

## Components

### `<Table>` / `<IoiTable>` / `<DataTable>`

All three are aliases for the same component. `Table` is the recommended name.

```vue
<script setup>
import { Table } from '@ioi-dev/vue-table'
</script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" />
</template>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `TRow[]` | `[]` | Array of row data objects |
| `columns` | `ColumnDef<TRow>[]` | `[]` | Column definitions (see [ColumnDef](#columndef-reference)) |
| `rowKey` | `keyof TRow \| ((row: TRow, index: number) => string \| number)` | — | **Required for selection/editing.** Field name or function that returns a unique identifier for each row |
| `rowHeight` | `number` | `36` | Height of each row in pixels (used for virtualization) |
| `overscan` | `number` | `5` | Number of extra rows to render above/below viewport (virtualization) |
| `height` | `number` | `320` | Height of the table viewport in pixels |
| `pageIndex` | `number` | `0` | Current page index (0-based). Use with `v-model:pageIndex` |
| `pageSize` | `number` | `0` | Rows per page. `0` or undefined disables pagination (uses virtual scroll) |
| `globalSearchDebounceMs` | `number` | `0` | Debounce delay for global search input |
| `filterDebounceMs` | `number` | `0` | Debounce delay for column filter inputs |
| `csvPreviewRowLimit` | `number` | `200` | Max rows to preview when parsing CSV |

### Example: All Props

```vue
<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    :row-height="40"
    :overscan="10"
    :height="500"
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    :global-search-debounce-ms="300"
    :filter-debounce-ms="200"
    :csv-preview-row-limit="100"
    @row-click="onRowClick"
    @state-change="onStateChange"
    @pagination-change="onPaginationChange"
  />
</template>
```

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `row-click` | `{ row: TRow, rowIndex: number }` | Fired when a row is clicked |
| `state-change` | `IoiSemanticEvent<unknown>` | Fired on any state change (filter, sort, select, etc.) |
| `update:pageIndex` | `number` | Fired when page index changes (for `v-model:pageIndex`) |
| `update:pageSize` | `number` | Fired when page size changes (for `v-model:pageSize`) |
| `pagination-change` | `IoiPaginationChangePayload` | Detailed pagination change with metadata |

### IoiPaginationChangePayload

```typescript
interface IoiPaginationChangePayload {
  pageIndex: number
  pageSize: number
  pageCount: number
  rowCount: number
  reason: 'setPageIndex' | 'setPageSize' | 'autoReset' | 'clamp' | 'resetState' | 'meta'
}
```

### Example: Events

```vue
<script setup>
import { ref } from 'vue'
import { Table } from '@ioi-dev/vue-table'

const pageIndex = ref(0)
const pageSize = ref(25)

function onRowClick({ row, rowIndex }) {
  console.log('Clicked row:', row, 'at index:', rowIndex)
}

function onStateChange(event) {
  console.log('State changed:', event.type, event.payload)
}

function onPaginationChange(payload) {
  console.log('Page changed:', payload)
}
</script>

<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    v-model:pageIndex="pageIndex"
    v-model:pageSize="pageSize"
    @row-click="onRowClick"
    @state-change="onStateChange"
    @pagination-change="onPaginationChange"
  />
</template>
```

---

## Slots

### `cell`

Custom cell rendering.

**Slot Props:**
```typescript
interface CellSlotProps<TRow> {
  row: TRow           // The row data object
  rowIndex: number    // Row index in the original data
  column: ColumnDef<TRow>  // Column definition
  columnIndex: number      // Column index
  value: unknown           // Cell value (resolved from field path)
}
```

**Example:**
```vue
<template>
  <Table :rows="users" :columns="columns" row-key="id">
    <template #cell="{ row, value, column }">
      <span v-if="column.field === 'status'" :class="`status--${value}`">
        {{ value }}
      </span>
      <span v-else-if="column.field === 'avatar'">
        <img :src="value" :alt="row.name" class="avatar" />
      </span>
      <span v-else>{{ value }}</span>
    </template>
  </Table>
</template>
```

### `header`

Custom header cell rendering.

**Slot Props:**
```typescript
interface HeaderSlotProps<TRow> {
  column: ColumnDef<TRow>
  columnIndex: number
}
```

**Example:**
```vue
<template>
  <Table :rows="users" :columns="columns" row-key="id">
    <template #header="{ column }">
      <span class="custom-header">
        <Icon v-if="column.field === 'name'" name="user" />
        {{ column.header ?? column.field }}
      </span>
    </template>
  </Table>
</template>
```

### `header-filter`

Custom filter UI in the header.

**Slot Props:**
```typescript
interface HeaderFilterSlotProps<TRow> {
  column: ColumnDef<TRow>
  columnIndex: number
  mode: 'text' | 'select'
  value: string
  options?: string[]      // Available for 'select' mode (faceted values)
  setValue: (value: string) => void
  clear: () => void
}
```

**Example:**
```vue
<template>
  <Table :rows="users" :columns="columns" row-key="id">
    <template #header-filter="{ column, mode, value, options, setValue, clear }">
      <input
        v-if="mode === 'text'"
        type="text"
        :value="value"
        @input="setValue($event.target.value)"
        :placeholder="`Filter ${column.header}...`"
      />
      <select v-else :value="value" @change="setValue($event.target.value)">
        <option value="">All</option>
        <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <button v-if="value" @click="clear">×</button>
    </template>
  </Table>
</template>
```

### `empty`

Custom empty state when no data.

**Slot Props:** None

**Example:**
```vue
<template>
  <Table :rows="users" :columns="columns" row-key="id">
    <template #empty>
      <div class="empty-state">
        <Icon name="inbox" />
        <p>No users found</p>
        <button @click="loadUsers">Load Users</button>
      </div>
    </template>
  </Table>
</template>
```

---

## Exposed Methods

Access these methods via a template ref:

```vue
<script setup>
import { ref } from 'vue'
import { Table } from '@ioi-dev/vue-table'

const tableRef = ref()

function exportData() {
  const csv = tableRef.value?.exportCSV({ scope: 'filtered' })
  // Download csv...
}
</script>

<template>
  <Table ref="tableRef" :rows="rows" :columns="columns" row-key="id" />
  <button @click="exportData">Export CSV</button>
</template>
```

### Data Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setColumnFilter` | `(field: string, filter: ColumnFilter) => void` | Set a column filter |
| `clearColumnFilter` | `(field: string) => void` | Clear a column's filter |
| `setGlobalSearch` | `(text: string) => void` | Set global search text |
| `clearAllFilters` | `() => void` | Clear all filters and global search |
| `setSortState` | `(sortState: SortState[]) => void` | Replace sort state |
| `toggleSort` | `(field: string, multi?: boolean) => void` | Toggle sort on a column |
| `getColumnFacetOptions` | `(field: string) => string[]` | Get unique values for a field (for filter dropdowns) |

### Pagination Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setPageIndex` | `(index: number) => void` | Go to a specific page |
| `setPageSize` | `(size: number) => void` | Change page size |

### Selection Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `toggleRow` | `(key: string \| number, options?: { shiftKey?: boolean }) => void` | Toggle row selection |
| `isSelected` | `(key: string \| number) => boolean` | Check if row is selected |
| `clearSelection` | `() => void` | Clear all selections |
| `selectAll` | `(scope?: 'visible' \| 'filtered' \| 'allLoaded') => void` | Select all rows |
| `getSelectedKeys` | `() => Array<string \| number>` | Get selected row keys |

### Editing Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `startEdit` | `(options: { field: string, rowKey?: string \| number, rowIndex?: number, value?: unknown }) => void` | Start editing a cell |
| `setEditDraft` | `(value: unknown) => void` | Update the draft value during editing |
| `commitEdit` | `() => boolean` | Commit the current edit (returns success) |
| `cancelEdit` | `() => void` | Cancel the current edit |

### CSV Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `exportCSV` | `(options?: ExportCsvOptions) => string` | Export table data to CSV string |
| `parseCSV` | `(source: string \| Blob, options?: ParseCsvOptions) => Promise<CsvImportPreview>` | Parse CSV for preview |
| `commitCSVImport` | `(mapping?: CsvImportMapping, options?: CommitCsvImportOptions) => CsvImportResult` | Import parsed CSV data |

### Column State Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setColumnOrder` | `(order: string[]) => void` | Set column order (array of column IDs) |
| `setColumnVisibility` | `(columnId: string, hidden: boolean) => void` | Show/hide a column |
| `setColumnPin` | `(columnId: string, pin: 'left' \| 'right' \| 'none') => void` | Pin/unpin a column |
| `setColumnSizing` | `(columnId: string, sizing: { width?: number }) => void` | Set column width |
| `getColumnStateSnapshot` | `() => ColumnStateSnapshot` | Get current column state for persistence |

### Other Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `scrollToRow` | `(index: number) => void` | Scroll to a specific row |
| `resetState` | `() => void` | Reset all table state |

---

## ColumnDef Reference

```typescript
interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string                    // Unique identifier (defaults to field)
  field: keyof TRow | string     // Data field path (supports dot notation)
  header?: string                // Header label (defaults to field)
  type?: 'text' | 'number' | 'date'  // Data type for sorting/filtering
  headerFilter?: 'text' | 'select'   // Enable header filter UI
  validate?: (value: unknown, row: TRow) => true | string  // Validation function
  comparator?: (a: unknown, b: unknown, rowA: TRow, rowB: TRow) => number  // Custom sort
  width?: number | string        // Column width (px or CSS value)
  minWidth?: number              // Minimum width in pixels
  maxWidth?: number              // Maximum width in pixels
  hidden?: boolean               // Hide the column
  pin?: 'left' | 'right' | 'none'  // Pin column to side
}
```

### Field Path (Dot Notation)

The `field` property supports dot notation for nested objects and array indexing:

```typescript
const columns = [
  { field: 'user.name', header: 'Name' },           // Nested object
  { field: 'user.address.city', header: 'City' },   // Deep nesting
  { field: 'items[0].name', header: 'First Item' }, // Array indexing
  { field: 'tags[2]', header: 'Third Tag' },        // Array element
]
```

### Column Types

| Type | Sort Behavior | Filter Behavior |
|------|---------------|-----------------|
| `text` | Alphabetical | Text operators (contains, equals, startsWith) |
| `number` | Numeric | Number operators (eq, lt, lte, gt, gte, between) |
| `date` | Date comparison | Date operators (before, after, on) |

### Header Filters

| Mode | Description |
|------|-------------|
| `text` | Text input with contains filter |
| `select` | Dropdown with faceted unique values |

### Example: Full ColumnDef

```typescript
const columns: ColumnDef<User>[] = [
  { 
    id: 'id',
    field: 'id', 
    header: 'ID', 
    type: 'number', 
    width: 80,
    pin: 'left'
  },
  { 
    field: 'name', 
    header: 'Name', 
    type: 'text',
    headerFilter: 'text',
    minWidth: 150
  },
  { 
    field: 'status', 
    header: 'Status', 
    headerFilter: 'select',
    width: 120
  },
  { 
    field: 'score', 
    header: 'Score', 
    type: 'number',
    comparator: (a, b) => (a as number) - (b as number)
  },
  { 
    field: 'email', 
    header: 'Email',
    validate: (value) => {
      if (typeof value === 'string' && value.includes('@')) return true
      return 'Invalid email format'
    }
  },
  { 
    field: 'actions', 
    header: 'Actions',
    width: 100,
    pin: 'right'
  }
]
```

---

## Composable: useIoiTable

For headless usage or custom table implementations:

```typescript
import { useIoiTable } from '@ioi-dev/vue-table/composables/useIoiTable'
```

### Parameters

```typescript
const table = useIoiTable<TRow>(
  computed(() => ({
    rows: TRow[],
    columns: ColumnDef<TRow>[],
    rowKey?: keyof TRow | ((row: TRow, index: number) => string | number),
    rowHeight?: number,
    overscan?: number,
    viewportHeight?: number,
    globalSearchDebounceMs?: number,
    filterDebounceMs?: number,
    defaultCsvPreviewRowLimit?: number,
    pagination?: { pageIndex?: number, pageSize?: number },
    onPaginationChange?: (payload: IoiPaginationChangePayload) => void,
    onCellCommit?: (payload: IoiCellCommitPayload<TRow>) => void,
    onRowUpdate?: (payload: IoiCellCommitPayload<TRow>) => void,
  }))
)
```

### Returns: IoiTableApi

```typescript
interface IoiTableApi<TRow> {
  // Schema version
  schemaVersion: 1
  
  // Reactive state
  rows: Ref<TRow[]>
  columns: Ref<ColumnDef<TRow>[]>
  rowHeight: Ref<number>
  overscan: Ref<number>
  state: Ref<IoiTableState>
  editingDraft: Ref<unknown>
  editingError: Ref<string | null>
  
  // Pagination
  paginationEnabled: ComputedRef<boolean>
  pageIndex: ComputedRef<number>
  pageSize: ComputedRef<number>
  pageCount: ComputedRef<number>
  totalRows: ComputedRef<number>
  
  // Virtualization
  totalHeight: ComputedRef<number>
  virtualRange: ComputedRef<{ start: number, end: number }>
  virtualPaddingTop: ComputedRef<number>
  virtualPaddingBottom: ComputedRef<number>
  
  // Data pipeline
  baseIndices: ComputedRef<number[]>
  filteredIndices: ComputedRef<number[]>
  sortedIndices: ComputedRef<number[]>
  visibleIndices: ComputedRef<number[]>
  visibleRows: ComputedRef<TRow[]>
  
  // Events
  lastEvent: Ref<IoiSemanticEvent<unknown> | null>
  
  // Actions (see Exposed Methods above)
  actions: IoiTableActions<TRow>
  // ...all action methods are also available directly on the api object
}
```

### Example: Headless Table

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useIoiTable, type ColumnDef } from '@ioi-dev/vue-table'

interface User {
  id: number
  name: string
  email: string
}

const users = ref<User[]>([...])
const columns: ColumnDef<User>[] = [...]

const table = useIoiTable<User>(
  computed(() => ({
    rows: users.value,
    columns,
    rowKey: 'id',
    rowHeight: 40,
    overscan: 5,
    viewportHeight: 400,
  }))
)

// Access reactive state
console.log(table.visibleRows.value)
console.log(table.totalRows.value)
console.log(table.state.value.sort)

// Call actions
function handleSort(field: string) {
  table.toggleSort(field)
}
</script>

<template>
  <div class="custom-table">
    <div class="header">
      <input 
        type="text" 
        placeholder="Search..." 
        @input="table.setGlobalSearch($event.target.value)"
      />
    </div>
    <div class="body" :style="{ height: '400px', overflow: 'auto' }">
      <div :style="{ height: `${table.totalHeight.value}px`, position: 'relative' }">
        <div :style="{ height: `${table.virtualPaddingTop.value}px` }" />
        <div 
          v-for="(row, i) in table.visibleRows.value" 
          :key="row.id"
          :style="{ height: '40px' }"
        >
          {{ row.name }}
        </div>
        <div :style="{ height: `${table.virtualPaddingBottom.value}px` }" />
      </div>
    </div>
  </div>
</template>
```

---

## Composable: useColumnState

For managing column order, visibility, pinning, and sizing:

```typescript
import { useColumnState, createInMemoryColumnStateAdapter } from '@ioi-dev/vue-table/composables/useColumnState'
```

### Parameters

```typescript
const columnState = useColumnState<TRow>(
  computed(() => ({
    columns: ColumnDef<TRow>[]
  })),
  adapter?: ColumnStateAdapter  // Optional persistence adapter
)
```

### Returns

```typescript
{
  // Computed column groups
  pinnedLeftColumns: ComputedRef<ColumnDef<TRow>[]>
  centerColumns: ComputedRef<ColumnDef<TRow>[]>
  pinnedRightColumns: ComputedRef<ColumnDef<TRow>[]>
  
  // Actions
  setColumnOrder: (order: string[]) => void
  setColumnVisibility: (columnId: string, hidden: boolean) => void
  setColumnPin: (columnId: string, pin: 'left' | 'right' | 'none') => void
  setColumnSizing: (columnId: string, sizing: { width?: number }) => void
  getSnapshot: () => ColumnStateSnapshot
}
```

### Persistence Adapter

```typescript
// Create an adapter for localStorage persistence
const adapter = createInMemoryColumnStateAdapter()

// Or implement your own:
const customAdapter = {
  load: () => JSON.parse(localStorage.getItem('table-columns') || '{}'),
  save: (snapshot) => localStorage.setItem('table-columns', JSON.stringify(snapshot)),
}
```

---

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  // Core types
  ColumnDef,
  IoiTableOptions,
  IoiTableApi,
  IoiTableState,
  
  // Sort & Filter
  SortState,
  FilterState,
  ColumnFilter,
  TextColumnFilter,
  NumberColumnFilter,
  DateColumnFilter,
  
  // Pagination
  IoiPaginationState,
  IoiPaginationOptions,
  IoiPaginationChangePayload,
  
  // Selection
  SelectionMode,
  SelectAllScope,
  
  // Editing
  EditingCellState,
  IoiCellCommitPayload,
  
  // CSV
  ExportCsvOptions,
  ExportCsvScope,
  CsvDelimiter,
  CsvImportSource,
  CsvImportMode,
  ParseCsvOptions,
  CsvImportPreview,
  CsvImportResult,
  CsvImportMapping,
  CsvImportValidationError,
  
  // Slots
  CellSlotProps,
  HeaderSlotProps,
  HeaderFilterSlotProps,
  
  // Events
  IoiSemanticEvent,
  IoiSemanticEventType,
  RowClickPayload,
  
  // Virtualization
  ViewportState,
  VirtualRange,
} from '@ioi-dev/vue-table'
```

---

## Styling

### CSS Class Hooks

The table uses BEM-style class names for styling:

```
.ioi-table                    // Root container
.ioi-table__viewport          // Scrollable viewport
.ioi-table__table             // <table> element
.ioi-table__header-content    // Header cell content wrapper
.ioi-table__header-label      // Default header text
.ioi-table__header-filter     // Filter container in header
.ioi-table__filter-input      // Text filter input
.ioi-table__filter-select     // Select filter dropdown
.ioi-table__resize-handle     // Column resize handle
.ioi-table__row               // Table row
.ioi-table__row--selected     // Selected row
.ioi-table__row--editing      // Row being edited
.ioi-table__cell--editing     // Cell being edited
.ioi-table__header--sorted-asc   // Header sorted ascending
.ioi-table__header--sorted-desc  // Header sorted descending
.ioi-table__header--dragging     // Header being dragged
.ioi-table__header--drag-target  // Drop target header
.ioi-table__spacer            // Virtualization spacer row
.ioi-table__empty             // Empty state cell
.ioi-table__sr-only           // Screen reader only content
```

### Import Paths

```typescript
// Default (includes CSS)
import { Table } from '@ioi-dev/vue-table'

// Unstyled (no CSS)
import { Table } from '@ioi-dev/vue-table/unstyled'

// CSS only
import '@ioi-dev/vue-table/styles.css'
// or
import '@ioi-dev/vue-table/style.css'
```

### Tailwind Example

```vue
<template>
  <Table
    :rows="rows"
    :columns="columns"
    row-key="id"
    class="border rounded-lg"
  />
</template>

<style>
.ioi-table { @apply w-full; }
.ioi-table__viewport { @apply overflow-auto; }
.ioi-table__table { @apply w-full border-collapse; }
.ioi-table__row { @apply hover:bg-gray-50; }
.ioi-table__row--selected { @apply bg-blue-50; }
.ioi-table__header-content { @apply font-semibold text-left p-2 bg-gray-100; }
</style>
```
