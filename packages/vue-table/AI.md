# @ioi-dev/vue-table v0.2.5

A performance-first Vue 3 data table component with virtual scrolling, server-side data fetching, row expansion, grouping, CSV import/export, inline editing, and a streamlined API surface.

---

## Table of Contents

1. [Package Overview](#1-package-overview)
2. [Entry Points and Imports](#2-entry-points-and-imports)
3. [Component API](#3-component-api)
4. [Composable API](#4-composable-api-useioitable)
5. [TypeScript Types](#5-typescript-types)
6. [Complete Examples](#6-complete-examples)
7. [Styling Guide](#7-styling-guide)
8. [Accessibility Features](#8-accessibility-features)
9. [Performance Tips](#9-performance-tips)
10. [Common Patterns](#10-common-patterns)
11. [Common Mistakes to Avoid](#11-common-mistakes-to-avoid)

---

## 1. Package Overview

### Philosophy

- **Performance-first**: Built-in virtual scrolling for large datasets (10,000+ rows)
- **JavaScript-first defaults**: Sensible defaults that work out of the box
- **Streamlined API**: Single component + single composable for all use cases
- **TypeScript-native**: Full type inference with generics
- **Headless-friendly**: Unstyled entry point for complete CSS control
- **Server-ready**: Built-in support for server-side pagination, filtering, and sorting

### Key Features

- Virtual scrolling with configurable overscan
- Server-side data mode with debounced fetching
- Multi-column sorting
- Column filtering (text, number, date types)
- Global search with debounce
- Row selection (single/multi) with shift-click range select
- Row expansion with custom content
- Row grouping with aggregations
- Inline cell editing with validation
- Column pinning (left/right)
- Column reordering via drag-and-drop
- Column resizing
- Column visibility control
- CSV export with multiple scopes
- CSV import with preview and mapping
- Pagination (client or server-side)
- Full keyboard navigation
- ARIA-compliant accessibility
- Semantic events for analytics

### Requirements

- Vue 3.4.0+
- Modern browser (ES2020+)

---

## 2. Entry Points and Imports

### Main Entry (Styled)

```typescript
import { IoiTable, Table, DataTable, useIoiTable, useColumnState, createInMemoryColumnStateAdapter } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css'; // or style.css

// Types
import type {
  ColumnDef,
  ColumnGroup,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  SortState,
  FilterState,
  ColumnFilter,
  // ... all types
} from '@ioi-dev/vue-table';
```

### Unstyled Entry

```typescript
import { IoiTable, useIoiTable } from '@ioi-dev/vue-table/unstyled';
// No CSS import needed - you provide all styles
```

### Minimal CSS Entry

```typescript
import { IoiTable, useIoiTable } from '@ioi-dev/vue-table/unstyled';
import '@ioi-dev/vue-table/minimal';
// Functional-only CSS: padding, borders, hover, focus ring. No brand colours or design opinions.
```

### Composables Entry

```typescript
import { useIoiTable } from '@ioi-dev/vue-table/composables/useIoiTable';
import { useColumnState, createInMemoryColumnStateAdapter } from '@ioi-dev/vue-table/composables/useColumnState';
```

### Utility Entry

```typescript
import { get, set } from '@ioi-dev/vue-table/utils/nestedPath';
// get(obj, 'path.to.value') - safely access nested properties
// set(obj, 'path.to.value', newValue) - immutably set nested properties
```

---

## 3. Component API

### Props

```typescript
interface IoiTableProps<TRow> {
  // Data
  rows?: TRow[];                          // Default: []
  columns?: ColumnDef<TRow>[];            // Default: []
  rowKey?: keyof TRow | ((row: TRow, index: number) => string | number);

  // Virtualization
  rowHeight?: number;                     // Default: 36 (pixels)
  overscan?: number;                      // Default: 5 (extra rows above/below viewport)
  height?: number;                        // Default: 320 (viewport height in pixels)

  // Pagination
  pageIndex?: number;                     // Default: 0 (controlled)
  pageSize?: number;                      // Default: 0 (disabled when 0)

  // Debouncing
  globalSearchDebounceMs?: number;        // Default: 0
  filterDebounceMs?: number;              // Default: 0

  // CSV Import Limits
  csvPreviewRowLimit?: number;            // Default: 200
  csvMaxRows?: number;                    // Default: 100000
  csvMaxSizeBytes?: number;               // Default: 5242880 (5MB)

  // Row Expansion
  expandable?: boolean;                   // Default: false
  rowExpandable?: (row: TRow, index: number) => boolean;
  expandedRowKeys?: Array<string | number>;

  // Grouping
  groupBy?: string | string[];
  groupAggregations?: Record<string, AggregationType[]>;
  expandedGroupKeys?: Array<string>;

  // Column Groups (v0.2.5)
  columnGroups?: ColumnGroup[];

  // Row Reorder (v0.2.5)
  rowDraggable?: boolean;                 // Default: false

  // Clipboard Copy (v0.2.5)
  copyable?: boolean;                     // Default: true when selection enabled

  // Server-Side Mode
  dataMode?: 'client' | 'server';         // Default: 'client'
  serverOptions?: ServerDataOptions<TRow>;

  // Accessibility
  ariaLabel?: string;                     // Default: 'Data table'
}
```

### Events

```typescript
interface IoiTableEvents<TRow> {
  'row-click': [payload: { row: TRow; rowIndex: number }];
  'state-change': [event: IoiSemanticEvent<unknown>];
  'row-reorder': [payload: { fromIndex: number; toIndex: number; row: TRow }];
  'update:pageIndex': [value: number];
  'update:pageSize': [value: number];
  'pagination-change': [payload: IoiPaginationChangePayload];
  'update:expandedRowKeys': [value: Array<string | number>];
  'row-expand': [payload: { row: TRow; rowIndex: number; rowKey: string | number; expanded: boolean }];
  'update:expandedGroupKeys': [value: Array<string>];
  'group-expand': [payload: { groupKey: string; groupValue: unknown; expanded: boolean; rowCount: number }];
}
```

### Slots

```typescript
interface IoiTableSlots<TRow> {
  // Custom header cell
  header?: (props: { column: ColumnDef<TRow>; columnIndex: number }) => VNode;

  // Custom header filter cell
  'header-filter'?: (props: {
    column: ColumnDef<TRow>;
    columnIndex: number;
    mode: 'text' | 'select';
    value: string;
    options?: string[];
    setValue: (value: string) => void;
    clear: () => void;
  }) => VNode;

  // Custom data cell
  cell?: (props: {
    row: TRow;
    rowIndex: number;
    column: ColumnDef<TRow>;
    columnIndex: number;
    value: unknown;
  }) => VNode;

  // Expanded row content
  'expanded-row'?: (props: { row: TRow; rowIndex: number }) => VNode;

  // Group header
  'group-header'?: (props: {
    group: GroupHeader;
    expanded: boolean;
    toggle: () => void;
  }) => VNode;

  // Column group header (v0.2.5)
  'column-group-header'?: (props: {
    group: ColumnGroup;
  }) => VNode;

  // Empty state
  empty?: () => VNode;

  // Loading overlay
  loading?: () => VNode;

  // Error overlay
  error?: (props: { error: string | null }) => VNode;
}
```

### Exposed Methods

```typescript
interface IoiTableExpose<TRow> {
  // Scrolling
  scrollToRow: (index: number) => void;
  focusRow: (rowIndex: number) => void;

  // Focus state
  focusedRowIndex: Ref<number>;
  focusedColumnIndex: Ref<number>;
  isCellNavigationMode: Ref<boolean>;

  // CSV Operations
  exportCSV: (options?: ExportCsvOptions) => string;
  parseCSV: (fileOrText: CsvImportSource, options?: ParseCsvOptions) => Promise<CsvImportPreview<TRow>>;
  commitCSVImport: (mapping?: CsvImportMapping, options?: CommitCsvImportOptions) => CsvImportResult<TRow>;

  // State Reset
  resetState: () => void;

  // Filtering
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  clearColumnFilter: (field: string) => void;
  setGlobalSearch: (text: string) => void;
  clearAllFilters: () => void;

  // Pagination
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;

  // Facets
  getColumnFacetOptions: (field: string) => string[];

  // Sorting
  setSortState: (sortState: SortState[]) => void;
  toggleSort: (field: string, multi?: boolean) => void;

  // Selection
  toggleRow: (key: string | number, options?: ToggleRowOptions) => void;
  isSelected: (key: string | number) => boolean;
  clearSelection: () => void;
  selectAll: (scope?: SelectAllScope) => void;
  getSelectedKeys: () => Array<string | number>;
  copySelectionToClipboard: () => Promise<void>;  // v0.2.5

  // Row Expansion
  toggleRowExpansion: (key: string | number) => void;
  expandAllRows: () => void;
  collapseAllRows: () => void;
  isRowExpanded: (key: string | number) => boolean;

  // Group Expansion
  toggleGroupExpansion: (groupKey: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  isGroupExpanded: (groupKey: string) => boolean;

  // Editing
  startEdit: (options: StartEditOptions) => void;
  setEditDraft: (value: unknown) => void;
  commitEdit: () => boolean;
  cancelEdit: () => void;

  // Column State
  setColumnOrder: (order: string[]) => void;
  setColumnVisibility: (columnId: string, hidden: boolean) => void;
  setColumnPin: (columnId: string, pin: ColumnPinState) => void;
  setColumnSizing: (columnId: string, sizing: ColumnSizingUpdate) => void;
  getColumnStateSnapshot: () => ColumnStateSnapshot;

  // Server Mode
  refresh: () => void;
  fetchMore: () => Promise<void>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  hasMore: ComputedRef<boolean>;
}
```

---

## 4. Composable API (useIoiTable)

### Usage

```typescript
import { useIoiTable } from '@ioi-dev/vue-table';
import type { IoiTableApi, IoiTableOptions, ColumnDef } from '@ioi-dev/vue-table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const options = computed<IoiTableOptions<User>>(() => ({
  rows: users.value,
  columns: columns.value,
  rowKey: 'id',
  rowHeight: 40,
  overscan: 10,
  pagination: { pageIndex: 0, pageSize: 50 },
  onCellCommit: (payload) => { /* handle edit */ },
}));

const table = useIoiTable<User>(options);
```

### Returned API

```typescript
interface IoiTableApi<TRow> {
  // Schema version for compatibility checks
  schemaVersion: 1;

  // Reactive Data
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  rowHeight: Ref<number>;
  overscan: Ref<number>;
  state: Ref<IoiTableState>;
  editingDraft: Ref<unknown>;
  editingError: Ref<string | null>;

  // Pagination Computed
  paginationEnabled: ComputedRef<boolean>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  pageCount: ComputedRef<number>;
  totalRows: ComputedRef<number>;

  // Virtualization Computed
  totalHeight: ComputedRef<number>;
  baseIndices: ComputedRef<number[]>;
  filteredIndices: ComputedRef<number[]>;
  sortedIndices: ComputedRef<number[]>;
  virtualRange: ComputedRef<{ start: number; end: number }>;
  virtualPaddingTop: ComputedRef<number>;
  virtualPaddingBottom: ComputedRef<number>;
  visibleIndices: ComputedRef<number[]>;
  visibleRows: ComputedRef<TRow[]>;
  renderEntries: ComputedRef<IoiRenderEntry<TRow>[]>;

  // Grouping Computed
  groups: ComputedRef<Array<{ key: string; value: unknown; indices: number[]; count: number; aggregations: Record<string, number> }>>;

  // Events
  lastEvent: Ref<IoiSemanticEvent<unknown> | null>;

  // Server Mode
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  fetchMore: () => Promise<void>;
  hasMore: ComputedRef<boolean>;

  // Actions namespace
  actions: IoiTableActions<TRow>;

  // All actions are also spread at top level
  // setRows, setColumns, setSortState, etc.
}
```

### Options Interface

```typescript
interface IoiTableOptions<TRow> {
  // Data
  rows?: TRow[];
  columns?: ColumnDef<TRow>[];
  rowKey?: keyof TRow | ((row: TRow, index: number) => string | number);

  // Selection
  selectionMode?: 'single' | 'multi';

  // Virtualization
  rowHeight?: number;
  overscan?: number;
  viewportHeight?: number;

  // Debouncing
  globalSearchDebounceMs?: number;
  filterDebounceMs?: number;

  // CSV
  defaultCsvPreviewRowLimit?: number;
  csvMaxRows?: number;
  csvMaxSizeBytes?: number;

  // Pagination
  pagination?: { pageIndex?: number; pageSize?: number };

  // Row Expansion
  expandable?: boolean;
  rowExpandable?: (row: TRow, index: number) => boolean;
  expandedRowKeys?: Array<string | number>;

  // Grouping
  groupBy?: string | string[];
  groupAggregations?: Record<string, AggregationType[]>;
  expandedGroupKeys?: Array<string>;

  // Column Groups (v0.2.5)
  columnGroups?: ColumnGroup[];

  // Row Reorder (v0.2.5)
  rowDraggable?: boolean;

  // Clipboard Copy (v0.2.5)
  copyable?: boolean;

  // Server Mode
  dataMode?: 'client' | 'server';
  serverOptions?: ServerDataOptions<TRow>;

  // Callbacks
  onPaginationChange?: (payload: IoiPaginationChangePayload) => void;
  onCellCommit?: (payload: IoiCellCommitPayload<TRow>) => void;
  onRowUpdate?: (payload: IoiCellCommitPayload<TRow>) => void;
  onRowExpand?: (payload: IoiRowExpandPayload<TRow>) => void;
  onGroupExpand?: (payload: IoiGroupExpandPayload) => void;
}
```

---

## 5. TypeScript Types

### ColumnDef

```typescript
interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string;                              // Optional unique identifier
  field: keyof TRow | string;               // Field path (supports nested: 'user.address.city')
  header?: string;                          // Header label
  type?: 'text' | 'number' | 'date';        // Column type for filtering/coercion
  headerFilter?: 'text' | 'select';         // Enable header filter row
  editable?: boolean;                       // Allow inline editing
  validate?: (value: unknown, row: TRow) => true | string;  // Validation function
  comparator?: (valueA: unknown, valueB: unknown, rowA: TRow | undefined, rowB: TRow | undefined) => number;
  width?: number | string;                  // Column width (px or %)
  minWidth?: number;                        // Minimum width in pixels
  maxWidth?: number;                        // Maximum width in pixels
  hidden?: boolean;                         // Hide column
  pin?: 'left' | 'right' | 'none';          // Pin column
}
```

### Filter Types

```typescript
// Text Filter
interface TextColumnFilter {
  type: 'text';
  value: string;
  operator?: 'contains' | 'equals' | 'startsWith';
  caseSensitive?: boolean;
}

// Number Filter (simple)
interface NumberValueColumnFilter {
  type: 'number';
  operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
  value: number | string | null | undefined;
}

// Number Filter (range)
interface NumberBetweenColumnFilter {
  type: 'number';
  operator: 'between';
  min: number | string | null | undefined;
  max: number | string | null | undefined;
}

// Date Filter
interface DateColumnFilter {
  type: 'date';
  operator: 'before' | 'after' | 'on';
  value: Date | string | null | undefined;
}

type ColumnFilter = TextColumnFilter | NumberColumnFilter | DateColumnFilter;
```

### State Types

```typescript
interface IoiTableState {
  sort: SortState[];
  filters: FilterState[];
  globalSearch: string;
  selectedRowKeys: Array<string | number>;
  editingCell: { field: string; rowKey?: string | number; rowIndex?: number } | null;
  viewport: { scrollTop: number; viewportHeight: number };
  expandedRowKeys: Array<string | number>;
  expandedGroupKeys: Array<string>;
  loading: boolean;
  error: string | null;
  serverTotalRows: number | null;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterState {
  field: string;
  filter: ColumnFilter;
}
```

### Server-Side Types

```typescript
interface ServerFetchParams {
  pageIndex: number;
  pageSize: number;
  sort: SortState[];
  filters: FilterState[];
  globalSearch: string;
  cursor?: string | null;
}

interface ServerFetchResult<TRow> {
  rows: TRow[];
  totalRows: number;
  pageCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}

interface ServerDataOptions<TRow> {
  query: (params: ServerFetchParams) => Promise<ServerFetchResult<TRow>>;
  debounceMs?: number;           // Default: 300
  initialPageSize?: number;      // Default: 50
  cursorMode?: boolean;          // Enable cursor-based pagination
  onFetchStart?: () => void;
  onFetchSuccess?: (result: ServerFetchResult<TRow>) => void;
  onFetchError?: (error: Error) => void;
}
```

### CSV Types

```typescript
interface ExportCsvOptions {
  includeHeader?: boolean;           // Default: true
  delimiter?: ',' | ';' | '\t';      // Default: ','
  scope?: 'visible' | 'filtered' | 'selected' | 'allLoaded';  // Default: 'filtered'
  includeHiddenColumns?: boolean;    // Default: false
  headerMode?: 'field' | 'header';   // Default: 'field'
  sanitizeFormulas?: boolean;        // Default: true (CSV injection protection)
  formulaEscapePrefix?: "'" | '\t';  // Default: "'"
}

interface ParseCsvOptions {
  delimiter?: ',' | ';' | '\t' | 'auto';
  hasHeader?: boolean;               // Default: true
  previewRowLimit?: number;
  maxRows?: number;
  maxSizeBytes?: number;
}

interface CsvImportPreview<TRow> {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  headers: string[];
  totalRows: number;
  previewRowLimit: number;
  truncated: boolean;
  mapping: CsvImportMapping;
  columns: CsvImportPreviewColumn[];
  rows: CsvImportPreviewRow<TRow>[];
  fatalError?: string | null;
}

interface CsvImportResult<TRow> {
  importedRowCount: number;
  skippedRowCount: number;
  totalRows: number;
  mode: 'append' | 'replace';
  errors: CsvImportPreviewRow<TRow>[];
}
```

### Semantic Events

```typescript
type IoiSemanticEventType =
  | 'data:filter'
  | 'data:sort'
  | 'data:select'
  | 'data:modify'
  | 'data:extract'
  | 'data:explore';

interface IoiSemanticEvent<TPayload> {
  type: IoiSemanticEventType;
  schemaVersion: 1;
  payload: TPayload;
  timestamp: string;
}
```

### Column State Types

```typescript
type ColumnPinState = 'left' | 'right' | 'none';

interface ColumnStateSnapshot {
  order: string[];
  hidden: Record<string, boolean>;
  pin: Record<string, ColumnPinState>;
  widths: Record<string, number | string | undefined>;
  minWidths: Record<string, number | undefined>;
  maxWidths: Record<string, number | undefined>;
}

interface ColumnStatePersistenceAdapter {
  load: () => Partial<ColumnStateSnapshot> | null | undefined;
  save: (snapshot: ColumnStateSnapshot) => void;
}

interface ColumnSizingUpdate {
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
}
```

### Grouping Types

```typescript
type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

interface GroupHeader {
  key: string;
  value: unknown;
  count: number;
  aggregations: Record<string, number>;
}
```

### Column Group Types (v0.2.5)

```typescript
interface ColumnGroup {
  id: string;           // Unique group identifier
  header: string;       // Group header label
  columnIds: string[];  // Column IDs that belong to this group
}
```

---

## 6. Complete Examples

### Basic Table

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import type { ColumnDef } from '@ioi-dev/vue-table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const users = ref<User[]>([
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', createdAt: '2024-01-15' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', createdAt: '2024-02-20' },
]);

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name', headerFilter: 'text' },
  { field: 'email', header: 'Email', headerFilter: 'text' },
  { field: 'role', header: 'Role', headerFilter: 'select' },
  { field: 'createdAt', header: 'Created', type: 'date' },
];
</script>

<template>
  <IoiTable
    :rows="users"
    :columns="columns"
    :height="400"
    row-key="id"
  />
</template>
```

### With Selection and Pagination

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';

const tableRef = ref();
const selectedKeys = ref<number[]>([]);
const pageIndex = ref(0);
const pageSize = ref(20);

function handleSelectionChange() {
  selectedKeys.value = tableRef.value?.getSelectedKeys() ?? [];
}

function exportSelected() {
  const csv = tableRef.value?.exportCSV({ scope: 'selected' });
  // Download csv...
}
</script>

<template>
  <div>
    <button @click="exportSelected" :disabled="selectedKeys.length === 0">
      Export {{ selectedKeys.length }} Selected
    </button>
    <IoiTable
      ref="tableRef"
      :rows="data"
      :columns="columns"
      row-key="id"
      :page-index="pageIndex"
      :page-size="pageSize"
      @state-change="handleSelectionChange"
    />
  </div>
</template>
```

### With Row Expansion

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';

const expandedRowKeys = ref<number[]>([]);

function isRowExpandable(row: Order, index: number) {
  return row.items.length > 0;
}
</script>

<template>
  <IoiTable
    :rows="orders"
    :columns="columns"
    row-key="id"
    expandable
    :row-expandable="isRowExpandable"
    v-model:expanded-row-keys="expandedRowKeys"
  >
    <template #expanded-row="{ row }">
      <div class="order-details">
        <h4>Order Items</h4>
        <ul>
          <li v-for="item in row.items" :key="item.id">
            {{ item.name }} - ${{ item.price }}
          </li>
        </ul>
      </div>
    </template>
  </IoiTable>
</template>
```

### With Grouping and Aggregations

```vue
<script setup lang="ts">
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';

const columns = [
  { field: 'category', header: 'Category' },
  { field: 'product', header: 'Product' },
  { field: 'quantity', header: 'Qty', type: 'number' },
  { field: 'price', header: 'Price', type: 'number' },
];

const groupAggregations = {
  quantity: ['sum'],
  price: ['sum', 'avg'],
};
</script>

<template>
  <IoiTable
    :rows="salesData"
    :columns="columns"
    group-by="category"
    :group-aggregations="groupAggregations"
    :height="500"
  >
    <template #group-header="{ group, expanded, toggle }">
      <div class="custom-group-header" @click="toggle">
        <span>{{ expanded ? '▼' : '▶' }}</span>
        <strong>{{ group.value }}</strong>
        <span>({{ group.count }} items)</span>
        <span>Total: ${{ group.aggregations.price_sum?.toFixed(2) }}</span>
      </div>
    </template>
  </IoiTable>
</template>
```

### With Inline Editing

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import type { ColumnDef, IoiCellCommitPayload } from '@ioi-dev/vue-table';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const products = ref<Product[]>([/* ... */]);

const columns: ColumnDef<Product>[] = [
  { field: 'id', header: 'ID', width: 60 },
  { field: 'name', header: 'Name', editable: true },
  {
    field: 'price',
    header: 'Price',
    type: 'number',
    editable: true,
    validate: (value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0) return 'Price must be a positive number';
      return true;
    },
  },
  {
    field: 'stock',
    header: 'Stock',
    type: 'number',
    editable: true,
    validate: (value) => {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0) return 'Stock must be a non-negative integer';
      return true;
    },
  },
];

function handleCellCommit(payload: IoiCellCommitPayload<Product>) {
  // Update your data source
  console.log('Cell updated:', payload);
  // payload.row, payload.field, payload.oldValue, payload.newValue
}
</script>

<template>
  <IoiTable
    :rows="products"
    :columns="columns"
    row-key="id"
    @cell-commit="handleCellCommit"
  >
    <template #cell="{ row, column, value }">
      <span v-if="column.field === 'price'">${{ value }}</span>
      <span v-else>{{ value }}</span>
    </template>
  </IoiTable>
</template>
```

### Server-Side Data Mode

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import type { ServerFetchParams, ServerFetchResult } from '@ioi-dev/vue-table';

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUsers(params: ServerFetchParams): Promise<ServerFetchResult<User>> {
  const queryParams = new URLSearchParams({
    page: String(params.pageIndex),
    size: String(params.pageSize),
    search: params.globalSearch,
    sort: params.sort.map(s => `${s.field}:${s.direction}`).join(','),
  });

  const response = await fetch(`/api/users?${queryParams}`);
  const data = await response.json();

  return {
    rows: data.users,
    totalRows: data.total,
    hasMore: data.hasMore,
  };
}

const serverOptions = {
  query: fetchUsers,
  debounceMs: 300,
  initialPageSize: 50,
  onFetchStart: () => console.log('Fetching...'),
  onFetchSuccess: (result) => console.log('Fetched:', result.rows.length),
  onFetchError: (error) => console.error('Fetch error:', error),
};
</script>

<template>
  <IoiTable
    data-mode="server"
    :server-options="serverOptions"
    :columns="columns"
    row-key="id"
    :height="600"
  />
</template>
```

### CSV Import with Preview

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import type { CsvImportPreview, CsvImportMapping } from '@ioi-dev/vue-table';

const tableRef = ref();
const csvPreview = ref<CsvImportPreview | null>(null);
const showImportDialog = ref(false);

async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  csvPreview.value = await tableRef.value.parseCSV(file, {
    hasHeader: true,
    previewRowLimit: 100,
  });

  if (!csvPreview.value.fatalError) {
    showImportDialog.value = true;
  }
}

function commitImport(mapping?: CsvImportMapping) {
  const result = tableRef.value.commitCSVImport(mapping, {
    mode: 'append',
    skipInvalidRows: true,
  });

  console.log('Imported:', result.importedRowCount);
  console.log('Skipped:', result.skippedRowCount);
  showImportDialog.value = false;
}
</script>

<template>
  <div>
    <input type="file" accept=".csv" @change="handleFileUpload" />

    <IoiTable
      ref="tableRef"
      :rows="data"
      :columns="columns"
      row-key="id"
    />

    <div v-if="showImportDialog && csvPreview" class="import-dialog">
      <h3>Import Preview ({{ csvPreview.totalRows }} rows)</h3>

      <div v-if="csvPreview.truncated">
        Warning: Only showing first {{ csvPreview.previewRowLimit }} rows
      </div>

      <div v-for="col in csvPreview.columns" :key="col.columnId">
        <label>
          {{ col.header }}:
          <select v-model="csvPreview.mapping[col.columnId]">
            <option :value="null">-- Skip --</option>
            <option
              v-for="(header, idx) in csvPreview.headers"
              :key="idx"
              :value="idx"
            >
              {{ header }}
            </option>
          </select>
        </label>
      </div>

      <button @click="commitImport(csvPreview.mapping)">Import</button>
      <button @click="showImportDialog = false">Cancel</button>
    </div>
  </div>
</template>
```

### Column State Persistence

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IoiTable, createInMemoryColumnStateAdapter, useColumnState } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import type { ColumnStateSnapshot } from '@ioi-dev/vue-table';

const tableRef = ref();

// LocalStorage adapter
const localStorageAdapter = {
  load: () => {
    const saved = localStorage.getItem('table-column-state');
    return saved ? JSON.parse(saved) : null;
  },
  save: (snapshot: ColumnStateSnapshot) => {
    localStorage.setItem('table-column-state', JSON.stringify(snapshot));
  },
};

function saveColumnState() {
  const snapshot = tableRef.value?.getColumnStateSnapshot();
  if (snapshot) {
    localStorageAdapter.save(snapshot);
  }
}

// Restore on mount
onMounted(() => {
  const saved = localStorageAdapter.load();
  if (saved?.order) {
    tableRef.value?.setColumnOrder(saved.order);
  }
});
</script>

<template>
  <IoiTable
    ref="tableRef"
    :rows="data"
    :columns="columns"
    row-key="id"
    @column-reorder="saveColumnState"
  />
</template>
```

### Custom Cell Rendering

```vue
<script setup lang="ts">
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';

const columns = [
  { field: 'status', header: 'Status' },
  { field: 'avatar', header: 'Avatar' },
  { field: 'progress', header: 'Progress', type: 'number' },
];
</script>

<template>
  <IoiTable :rows="users" :columns="columns" row-key="id">
    <template #cell="{ column, value, row }">
      <!-- Status badge -->
      <span
        v-if="column.field === 'status'"
        :class="['status-badge', `status-${value}`]"
      >
        {{ value }}
      </span>

      <!-- Avatar image -->
      <img
        v-else-if="column.field === 'avatar'"
        :src="value"
        :alt="row.name"
        class="avatar"
      />

      <!-- Progress bar -->
      <div v-else-if="column.field === 'progress'" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${value}%` }" />
        <span class="progress-text">{{ value }}%</span>
      </div>

      <!-- Default -->
      <span v-else>{{ value }}</span>
    </template>
  </IoiTable>
</template>
```

### Using useIoiTable Composable (Headless)

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useIoiTable } from '@ioi-dev/vue-table';
import type { ColumnDef, IoiTableOptions } from '@ioi-dev/vue-table';

interface Product {
  id: number;
  name: string;
  price: number;
}

const products = computed(() => [/* ... */]);
const columns: ColumnDef<Product>[] = [/* ... */];

const options = computed<IoiTableOptions<Product>>(() => ({
  rows: products.value,
  columns: columns.value,
  rowKey: 'id',
  rowHeight: 48,
  overscan: 10,
  pagination: { pageIndex: 0, pageSize: 25 },
  onCellCommit: (payload) => {
    console.log('Edit committed:', payload);
  },
}));

const table = useIoiTable<Product>(options);

// Access reactive state
console.log('Visible rows:', table.visibleRows.value);
console.log('Page count:', table.pageCount.value);
console.log('Is loading:', table.loading.value);

// Call actions
function handleSort(field: string) {
  table.toggleSort(field, true); // multi-sort
}

function handleExport() {
  const csv = table.exportCSV({ scope: 'filtered' });
  // Download CSV...
}
</script>

<template>
  <div>
    <!-- Your custom table implementation using table.visibleRows, etc. -->
    <div class="custom-table">
      <div v-for="entry in table.renderEntries.value" :key="entry.renderKey">
        <template v-if="entry.type === 'row'">
          <div class="row">
            {{ entry.row.name }} - ${{ entry.row.price }}
          </div>
        </template>
      </div>
    </div>

    <!-- Pagination controls -->
    <div class="pagination">
      <button
        :disabled="table.pageIndex.value === 0"
        @click="table.setPageIndex(table.pageIndex.value - 1)"
      >
        Previous
      </button>
      <span>Page {{ table.pageIndex.value + 1 }} of {{ table.pageCount.value }}</span>
      <button
        :disabled="table.pageIndex.value >= table.pageCount.value - 1"
        @click="table.setPageIndex(table.pageIndex.value + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
```

---

## 7. Styling Guide

### CSS Class Reference

```css
/* Root container */
.ioi-table { }

/* Screen reader only content */
.ioi-table__sr-only { }

/* Viewport (scrollable container) */
.ioi-table__viewport { }

/* Table element */
.ioi-table__table { }

/* Header cells */
.ioi-table__header-content { }
.ioi-table__header-label { }
.ioi-table__header--sorted-asc { }
.ioi-table__header--sorted-desc { }
.ioi-table__header--pinned-left-edge { }
.ioi-table__header--pinned-right-edge { }
.ioi-table__header--dragging { }
.ioi-table__header--drag-target { }
.ioi-table__header--drag-over-left { }
.ioi-table__header--drag-over-right { }

/* Filter row */
.ioi-table__filter-row { }
.ioi-table__filter-cell { }
.ioi-table__filter-cell--pinned-left-edge { }
.ioi-table__filter-cell--pinned-right-edge { }
.ioi-table__header-filter { }
.ioi-table__filter-input { }
.ioi-table__filter-select { }

/* Resize handle */
.ioi-table__resize-handle { }
.ioi-table__resize-handle--disabled { }

/* Data rows */
.ioi-table__row { }
.ioi-table__row--selected { }
.ioi-table__row--editing { }
.ioi-table__row--expanded { }
.ioi-table__row--focused { }

/* Data cells */
.ioi-table__cell { }
.ioi-table__cell--editing { }
.ioi-table__cell--focused { }
.ioi-table__cell--editable { }
.ioi-table__cell--expand { }
.ioi-table__cell--pinned-left-edge { }
.ioi-table__cell--pinned-right-edge { }

/* Expand icon */
.ioi-table__expand-icon { }

/* Expanded row content */
.ioi-table__expanded-row { }
.ioi-table__expanded-content { }

/* Group header */
.ioi-table__group-header { }
.ioi-table__group-toggle { }
.ioi-table__group-value { }
.ioi-table__group-count { }

/* Column group header (v0.2.5) */
.ioi-table__group-header-row { }
.ioi-table__group-header-cell { }
.ioi-table__group-header-cell--empty { }

/* Row reorder (v0.2.5) */
.ioi-table__drag-handle { }
.ioi-table__row--dragging { }
.ioi-table__row--drag-over { }

/* Empty state */
.ioi-table__empty { }

/* Loading overlay */
.ioi-table__loading-overlay { }

/* Error overlay */
.ioi-table__error-overlay { }

/* Virtual scroll spacer */
.ioi-table__spacer { }
```

### CSS Custom Properties

```css
:root {
  --ioi-table-border: #d7dbe2;
  --ioi-table-focus-color: #0066cc;
  --ioi-table-focus-outline: 2px solid var(--ioi-table-focus-color);
  --ioi-table-focus-outline-offset: -2px;
  --ioi-table-header-height: 36px; /* For filter row positioning */
}
```

### Custom Styling Example

```css
/* Override defaults */
:root {
  --ioi-table-focus-color: #6366f1;
  --ioi-table-border: #e5e7eb;
}

.ioi-table {
  font-family: 'Inter', sans-serif;
  border: 1px solid var(--ioi-table-border);
  border-radius: 8px;
  overflow: hidden;
}

.ioi-table__table {
  width: 100%;
  border-collapse: collapse;
}

.ioi-table__row {
  transition: background-color 0.15s ease;
}

.ioi-table__row:hover {
  background-color: #f9fafb;
}

.ioi-table__row--selected {
  background-color: #eff6ff !important;
}

.ioi-table__cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--ioi-table-border);
}

/* Header styling */
th[role="columnheader"] {
  background-color: #f3f4f6;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--ioi-table-border);
}

/* Pinned column shadow */
.ioi-table__header--pinned-left-edge,
.ioi-table__cell--pinned-left-edge {
  box-shadow: inset -1px 0 0 var(--ioi-table-border);
}

.ioi-table__header--pinned-right-edge,
.ioi-table__cell--pinned-right-edge {
  box-shadow: inset 1px 0 0 var(--ioi-table-border);
}
```

### Unstyled Entry Point

Use the unstyled entry for complete CSS control:

```typescript
import { IoiTable } from '@ioi-dev/vue-table/unstyled';
// No CSS imported - you provide all styles
```

---

## 8. Accessibility Features

### ARIA Support

- **role="grid"**: Main table container
- **role="rowgroup"**: thead and tbody
- **role="row"**: Table rows
- **role="columnheader"**: Header cells
- **role="gridcell"**: Data cells
- **aria-rowcount**: Total row count
- **aria-colcount**: Column count
- **aria-rowindex**: Row position (1-based)
- **aria-colindex**: Column position (1-based)
- **aria-sort**: Sort direction on headers ('ascending', 'descending', 'none')
- **aria-selected**: Selection state on rows
- **aria-expanded**: Expansion state on expandable rows
- **aria-label**: Descriptive labels

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Up | Move to previous row |
| Arrow Down | Move to next row |
| Arrow Left | Move to previous column (cell mode) |
| Arrow Right | Move to next column (cell mode) |
| Home | Move to first row |
| End | Move to last row |
| Page Up | Move up one page |
| Page Down | Move down one page |
| Enter / Space | Toggle selection or expansion |
| Escape | Cancel editing |

### Live Region Announcements

The table includes a screen-reader-only live region that announces:

- Filter changes and result counts
- Sort changes
- Selection changes
- Data modifications
- Loading states
- Error states

### High Contrast Mode Support

```css
@media (prefers-contrast: high) {
  .ioi-table__row--focused,
  .ioi-table__cell--focused {
    background-color: Highlight;
    color: HighlightText;
  }
}

@media (forced-colors: active) {
  .ioi-table__row--selected {
    outline: 2px solid Highlight;
  }
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .ioi-table__row,
  .ioi-table__cell {
    transition: none;
  }
}
```

---

## 9. Performance Tips

### Virtualization

1. **Set appropriate `rowHeight`**: Must match your actual row height in CSS
2. **Adjust `overscan`**: Lower values = less DOM nodes, but more flicker during fast scrolling
3. **Use pagination** for datasets > 10,000 rows to reduce memory

### Large Datasets

1. **Use server-side mode** for datasets > 100,000 rows
2. **Avoid deep object nesting** in row data - flatten when possible
3. **Use `shallowRef`** for row data if you don't need deep reactivity

### Column Optimization

1. **Hide unused columns** with `hidden: true`
2. **Avoid complex `comparator` functions** - pre-sort data server-side when possible
3. **Memoize column definitions** - don't recreate on every render

### Filtering & Sorting

1. **Set `filterDebounceMs`** to prevent excessive re-filtering (300ms recommended)
2. **Set `globalSearchDebounceMs`** for search input debouncing
3. **Use `headerFilter: 'select'`** instead of text filters for low-cardinality columns

### Memory Management

1. **Clear selection** when changing datasets
2. **Reset state** when navigating away from table view
3. **Use `v-if`** instead of `v-show` to completely unmount when not visible

### Example: Optimized Configuration

```typescript
const options = {
  rows: largeDataset,
  columns: columns,
  rowKey: 'id',
  rowHeight: 48,           // Match your CSS row height
  overscan: 3,             // Lower for better performance
  height: 600,
  filterDebounceMs: 300,   // Debounce filter updates
  globalSearchDebounceMs: 300,
  pagination: {
    pageIndex: 0,
    pageSize: 100          // Page for large datasets
  }
};
```

---

## 10. Common Patterns

### Controlled vs Uncontrolled State

```typescript
// Uncontrolled (internal state)
<IoiTable :rows="data" :columns="columns" />

// Controlled pagination
<IoiTable
  :rows="data"
  :columns="columns"
  :page-index="currentPage"
  :page-size="pageSize"
  @update:page-index="currentPage = $event"
  @update:page-size="pageSize = $event"
/>

// Controlled expansion
<IoiTable
  :rows="data"
  :columns="columns"
  expandable
  v-model:expanded-row-keys="expandedKeys"
/>
```

### Programmatic Control

```vue
<script setup>
const tableRef = ref();

// Scroll to specific row
function scrollToRow500() {
  tableRef.value?.scrollToRow(500);
}

// Export current view
function exportCurrentView() {
  return tableRef.value?.exportCSV({ scope: 'visible' });
}

// Apply filter programmatically
function filterByStatus(status: string) {
  tableRef.value?.setColumnFilter('status', {
    type: 'text',
    operator: 'equals',
    value: status,
  });
}

// Reset all state
function resetTable() {
  tableRef.value?.resetState();
}
</script>
```

### Listening to Semantic Events

```vue
<script setup>
function handleStateChange(event: IoiSemanticEvent) {
  // Send to analytics
  analytics.track(event.type, event.payload);
}

// Event types:
// - 'data:filter' - Filter/search changes
// - 'data:sort' - Sort changes
// - 'data:select' - Selection changes
// - 'data:modify' - Data edits
// - 'data:extract' - CSV import/export
// - 'data:explore' - Pagination, scrolling, state reset
</script>

<template>
  <IoiTable @state-change="handleStateChange" ... />
</template>
```

### Nested Field Access

```typescript
// Column definitions support dot notation
const columns: ColumnDef<User>[] = [
  { field: 'profile.firstName', header: 'First Name' },
  { field: 'profile.lastName', header: 'Last Name' },
  { field: 'address.city', header: 'City' },
  { field: 'address.country.name', header: 'Country' },
];
```

### Custom Sort Comparator

```typescript
const columns: ColumnDef<Task>[] = [
  {
    field: 'priority',
    header: 'Priority',
    comparator: (a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return (order[a] ?? 0) - (order[b] ?? 0);
    },
  },
];
```

### Dynamic Columns

```typescript
const columns = computed(() => {
  const base: ColumnDef<Row>[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
  ];

  // Add date columns for each month
  for (let i = 0; i < 12; i++) {
    base.push({
      field: `months.${i}.value`,
      header: monthNames[i],
      type: 'number',
    });
  }

  return base;
});
```

---

## 11. Common Mistakes to Avoid

### 1. Missing `rowKey` for Selection

```typescript
// ❌ Wrong - Selection won't work
<IoiTable :rows="data" :columns="columns" />

// ✅ Correct
<IoiTable :rows="data" :columns="columns" row-key="id" />
```

### 2. Incorrect `rowHeight`

```typescript
// ❌ Wrong - Virtual scroll will be misaligned
<IoiTable :rows="data" row-height={36} />
// But your CSS has 48px rows

// ✅ Correct - Match your CSS
.ioi-table__row { height: 48px; }
<IoiTable :rows="data" row-height={48} />
```

### 3. Not Debouncing Filters

```typescript
// ❌ Wrong - Re-renders on every keystroke
<IoiTable :rows="data" />

// ✅ Correct - Debounce for better UX
<IoiTable :rows="data" :filter-debounce-ms="300" />
```

### 4. Recreating Columns on Every Render

```typescript
// ❌ Wrong - New array every render
const columns = computed(() => [
  { field: 'name', header: 'Name' },
]);

// ✅ Correct - Stable reference
const columns: ColumnDef<Row>[] = [
  { field: 'name', header: 'Name' },
];
```

### 5. Using Index as Key

```typescript
// ❌ Wrong - Unstable keys break selection/expansion
rowKey={(row, index) => index}

// ✅ Correct - Use stable unique identifier
rowKey="id"
// or
rowKey={(row) => row.uuid}
```

### 6. Not Handling Server Errors

```typescript
// ❌ Wrong - No error handling
const serverOptions = {
  query: async (params) => {
    const res = await fetch('/api/data');
    return res.json();
  }
};

// ✅ Correct - Handle errors
const serverOptions = {
  query: async (params) => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    } catch (error) {
      console.error(error);
      return { rows: [], totalRows: 0 };
    }
  },
  onFetchError: (error) => {
    toast.error(`Failed to load data: ${error.message}`);
  }
};
```

### 7. Mutating Row Data Directly

```typescript
// ❌ Wrong - Direct mutation
function handleEdit(payload) {
  payload.row.name = payload.newValue; // Mutates original
}

// ✅ Correct - Create new array
function handleEdit(payload) {
  const index = data.value.findIndex(d => d.id === payload.row.id);
  data.value = [
    ...data.value.slice(0, index),
    { ...data.value[index], [payload.field]: payload.newValue },
    ...data.value.slice(index + 1),
  ];
}
```

### 8. Forgetting CSS Import

```typescript
// ❌ Wrong - No styles
import { IoiTable } from '@ioi-dev/vue-table';

// ✅ Correct - Import styles
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
```

### 9. Using Wrong Export Scope

```typescript
// ❌ Wrong - Exports all data, not just what user sees
table.exportCSV({ scope: 'allLoaded' })

// ✅ Correct - Export what's relevant
table.exportCSV({ scope: 'filtered' })  // After filters
table.exportCSV({ scope: 'selected' })  // User's selection
table.exportCSV({ scope: 'visible' })   // Current viewport
```

### 10. Not Validating CSV Import

```typescript
// ❌ Wrong - No validation
const result = table.commitCSVImport();

// ✅ Correct - Check for errors
const preview = await table.parseCSV(file);
if (preview.fatalError) {
  alert(preview.fatalError);
  return;
}

const result = table.commitCSVImport(mapping);
if (result.errors.length > 0) {
  console.warn('Some rows had errors:', result.errors);
}
```

---

## Quick Reference

### Minimal Setup

```vue
<script setup>
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
</script>

<template>
  <IoiTable :rows="data" :columns="columns" row-key="id" />
</template>
```

### Full Featured Setup

```vue
<IoiTable
  ref="tableRef"
  :rows="data"
  :columns="columns"
  row-key="id"
  :height="600"
  :row-height="48"
  :overscan="5"
  :page-index="page"
  :page-size="50"
  :filter-debounce-ms="300"
  :global-search-debounce-ms="300"
  expandable
  :row-expandable="canExpand"
  v-model:expanded-row-keys="expandedKeys"
  group-by="category"
  :group-aggregations="{ price: ['sum'] }"
  data-mode="client"
  aria-label="Product inventory table"
  @row-click="handleRowClick"
  @state-change="handleStateChange"
  @pagination-change="handlePaginationChange"
  @row-expand="handleRowExpand"
>
  <template #cell="{ column, value, row }">
    <!-- Custom cell rendering -->
  </template>
  <template #expanded-row="{ row }">
    <!-- Expanded content -->
  </template>
  <template #empty>
    <div>No results found</div>
  </template>
</IoiTable>
```
