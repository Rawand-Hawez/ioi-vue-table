# Examples

Common usage patterns for `@ioi-dev/vue-table`.

## Table of Contents

- [Basic Table](#basic-table)
- [With Pagination](#with-pagination)
- [With Sorting](#with-sorting)
- [With Filtering](#with-filtering)
- [With Global Search](#with-global-search)
- [Row Selection](#row-selection)
- [Custom Cell Rendering](#custom-cell-rendering)
- [Inline Editing](#inline-editing)
- [Column Pinning](#column-pinning)
- [Column Resizing & Reordering](#column-resizing--reordering)
- [CSV Export](#csv-export)
- [CSV Import](#csv-import)
- [Server-Side Data](#server-side-data)
- [Headless Usage](#headless-usage)
- [With Tailwind CSS](#with-tailwind-css)
- [Nested Data](#nested-data)

---

## Basic Table

The simplest table with rows and columns:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

interface User {
  id: number
  name: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name', type: 'text' },
  { field: 'email', header: 'Email', type: 'text' },
  { field: 'role', header: 'Role', type: 'text' },
]

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
]
</script>

<template>
  <Table :rows="users" :columns="columns" row-key="id" :height="400" />
</template>
```

---

## With Pagination

Enable pagination by setting `pageSize`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const pageIndex = ref(0)
const pageSize = ref(10)

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
]

const users = ref([...]) // 100+ users

function onPageChange(payload: any) {
  console.log('Page changed:', payload)
}
</script>

<template>
  <div>
    <Table
      :rows="users"
      :columns="columns"
      row-key="id"
      v-model:pageIndex="pageIndex"
      v-model:pageSize="pageSize"
      @pagination-change="onPageChange"
    />
    <div class="pagination-controls">
      <button 
        :disabled="pageIndex === 0" 
        @click="pageIndex--"
      >
        Previous
      </button>
      <span>Page {{ pageIndex + 1 }}</span>
      <button @click="pageIndex++">
        Next
      </button>
    </div>
  </div>
</template>
```

---

## With Sorting

Click column headers to sort. Use `type` for proper sorting behavior:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { field: 'name', header: 'Name', type: 'text' },
  { field: 'score', header: 'Score', type: 'number' },
  { field: 'createdAt', header: 'Created', type: 'date' },
]

const users = ref([
  { id: 1, name: 'Alice', score: 95, createdAt: '2024-01-15' },
  { id: 2, name: 'Bob', score: 82, createdAt: '2024-02-20' },
  // ...
])

// Access sort state via ref
const tableRef = ref()

function logSortState() {
  console.log(tableRef.value?.getColumnStateSnapshot())
}
</script>

<template>
  <Table 
    ref="tableRef"
    :rows="users" 
    :columns="columns" 
    row-key="id" 
  />
</template>
```

### Custom Sort Comparator

```vue
<script setup lang="ts">
const columns: ColumnDef<User>[] = [
  { 
    field: 'status', 
    header: 'Status',
    comparator: (a, b) => {
      // Custom sort order: Active > Pending > Inactive
      const order = { Active: 0, Pending: 1, Inactive: 2 }
      return (order[a as string] ?? 99) - (order[b as string] ?? 99)
    }
  },
]
</script>
```

---

## With Filtering

### Header Filters

Enable filters in column headers:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', type: 'number', width: 80 },
  { 
    field: 'name', 
    header: 'Name', 
    headerFilter: 'text'  // Text input filter
  },
  { 
    field: 'status', 
    header: 'Status', 
    headerFilter: 'select'  // Dropdown with unique values
  },
  { 
    field: 'department', 
    header: 'Department', 
    headerFilter: 'select'
  },
]

const users = [...]
</script>

<template>
  <Table 
    :rows="users" 
    :columns="columns" 
    row-key="id"
    :filter-debounce-ms="300"
  />
</template>
```

### Programmatic Filtering

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()

// Set a filter programmatically
function filterByStatus(status: string) {
  tableRef.value?.setColumnFilter('status', {
    type: 'text',
    operator: 'equals',
    value: status,
    caseSensitive: false
  })
}

// Clear all filters
function clearFilters() {
  tableRef.value?.clearAllFilters()
}
</script>

<template>
  <div>
    <div class="filter-buttons">
      <button @click="filterByStatus('Active')">Active Only</button>
      <button @click="filterByStatus('Inactive')">Inactive Only</button>
      <button @click="clearFilters">Clear Filters</button>
    </div>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
    />
  </div>
</template>
```

---

## With Global Search

Add a global search input:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()
const searchQuery = ref('')

function handleSearch(event: Event) {
  const value = (event.target as HTMLInputElement).value
  tableRef.value?.setGlobalSearch(value)
}

function clearSearch() {
  searchQuery.value = ''
  tableRef.value?.setGlobalSearch('')
}
</script>

<template>
  <div>
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search all columns..."
        @input="handleSearch"
      />
      <button v-if="searchQuery" @click="clearSearch">×</button>
    </div>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
      :global-search-debounce-ms="300"
    />
  </div>
</template>
```

---

## Row Selection

Enable row selection with `row-key`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
]

const users = [...]

const selectedCount = computed(() => {
  return tableRef.value?.getSelectedKeys()?.length ?? 0
})

function selectAll() {
  tableRef.value?.selectAll('filtered')  // or 'visible', 'allLoaded'
}

function clearSelection() {
  tableRef.value?.clearSelection()
}

function logSelected() {
  const keys = tableRef.value?.getSelectedKeys()
  console.log('Selected row keys:', keys)
}

function handleRowClick({ row, rowIndex }: any) {
  console.log('Clicked:', row.name)
}
</script>

<template>
  <div>
    <div class="selection-controls">
      <span>{{ selectedCount }} selected</span>
      <button @click="selectAll">Select All</button>
      <button @click="clearSelection">Clear Selection</button>
      <button @click="logSelected">Log Selected</button>
    </div>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
      @row-click="handleRowClick"
    />
  </div>
</template>
```

### Custom Selection Column

```vue
<script setup lang="ts">
const columns: ColumnDef<User>[] = [
  { 
    id: 'select',
    field: 'id', 
    header: '', 
    width: 50,
    pin: 'left'
  },
  { field: 'name', header: 'Name' },
  // ...
]

const tableRef = ref()
</script>

<template>
  <Table ref="tableRef" :rows="users" :columns="columns" row-key="id">
    <template #cell="{ column, row, rowIndex }">
      <input
        v-if="column.id === 'select'"
        type="checkbox"
        :checked="tableRef?.isSelected(row.id)"
        @change="tableRef?.toggleRow(row.id)"
        @click.stop
      />
      <span v-else>{{ row[column.field] }}</span>
    </template>
  </Table>
</template>
```

---

## Custom Cell Rendering

Use the `cell` slot for custom rendering:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

interface User {
  id: number
  name: string
  avatar: string
  status: 'active' | 'inactive' | 'pending'
  score: number
  lastLogin: string
}

const columns: ColumnDef<User>[] = [
  { field: 'avatar', header: '', width: 60 },
  { field: 'name', header: 'Name' },
  { field: 'status', header: 'Status', width: 100 },
  { field: 'score', header: 'Score', type: 'number', width: 100 },
  { field: 'lastLogin', header: 'Last Login', type: 'date' },
]

const users: User[] = [...]
</script>

<template>
  <Table :rows="users" :columns="columns" row-key="id">
    <template #cell="{ column, row, value }">
      <!-- Avatar cell -->
      <img 
        v-if="column.field === 'avatar'"
        :src="value" 
        :alt="row.name"
        class="avatar"
      />
      
      <!-- Status badge -->
      <span 
        v-else-if="column.field === 'status'"
        :class="['status-badge', `status-badge--${value}`]"
      >
        {{ value }}
      </span>
      
      <!-- Score with color -->
      <span 
        v-else-if="column.field === 'score'"
        :class="['score', value >= 80 ? 'score--high' : 'score--low']"
      >
        {{ value }}%
      </span>
      
      <!-- Date formatting -->
      <span v-else-if="column.field === 'lastLogin'">
        {{ new Date(value).toLocaleDateString() }}
      </span>
      
      <!-- Default -->
      <span v-else>{{ value }}</span>
    </template>
  </Table>
</template>

<style>
.avatar { width: 40px; height: 40px; border-radius: 50%; }
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.status-badge--active { background: #d1fae5; color: #065f46; }
.status-badge--inactive { background: #fee2e2; color: #991b1b; }
.status-badge--pending { background: #fef3c7; color: #92400e; }
.score--high { color: #059669; font-weight: bold; }
.score--low { color: #dc2626; }
</style>
```

---

## Inline Editing

Enable cell editing with the editing API:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', width: 80 },
  { field: 'name', header: 'Name' },
  { 
    field: 'email', 
    header: 'Email',
    validate: (value) => {
      if (typeof value === 'string' && value.includes('@')) return true
      return 'Invalid email'
    }
  },
  { field: 'role', header: 'Role' },
]

const users = ref([
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  // ...
])

function handleCellClick({ row, column, rowIndex }: any) {
  // Start editing on click
  tableRef.value?.startEdit({
    field: column.field,
    rowKey: row.id,
    value: row[column.field]
  })
}

function saveEdit() {
  const success = tableRef.value?.commitEdit()
  if (success) {
    // Update your data source
    console.log('Edit saved')
  }
}

function cancelEdit() {
  tableRef.value?.cancelEdit()
}
</script>

<template>
  <div>
    <div class="edit-controls">
      <button @click="saveEdit">Save</button>
      <button @click="cancelEdit">Cancel</button>
    </div>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
    >
      <template #cell="{ column, row, value, rowIndex }">
        <input
          v-if="tableRef?.state?.editingCell?.field === column.field && 
                tableRef?.state?.editingCell?.rowKey === row.id"
          :value="tableRef?.editingDraft"
          @input="tableRef?.setEditDraft($event.target.value)"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
        />
        <span v-else @click="handleCellClick({ row, column, rowIndex })">
          {{ value }}
        </span>
      </template>
    </Table>
  </div>
</template>
```

---

## Column Pinning

Pin columns to the left or right:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const columns: ColumnDef<User>[] = [
  { 
    field: 'id', 
    header: 'ID', 
    width: 80,
    pin: 'left'  // Pinned to left
  },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
  { field: 'department', header: 'Department' },
  { field: 'status', header: 'Status' },
  { 
    field: 'actions', 
    header: 'Actions', 
    width: 100,
    pin: 'right'  // Pinned to right
  },
]
</script>

<template>
  <Table :rows="users" :columns="columns" row-key="id" :height="400">
    <template #cell="{ column, row }">
      <button v-if="column.field === 'actions'" @click="editUser(row)">
        Edit
      </button>
      <span v-else>{{ row[column.field] }}</span>
    </template>
  </Table>
</template>
```

### Programmatic Pinning

```vue
<script setup lang="ts">
const tableRef = ref()

function pinColumn(columnId: string, side: 'left' | 'right' | 'none') {
  tableRef.value?.setColumnPin(columnId, side)
}
</script>
```

---

## Column Resizing & Reordering

Columns are resizable by dragging the edge and reorderable by dragging the header:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()

const columns: ColumnDef<User>[] = [
  { field: 'id', header: 'ID', width: 80, minWidth: 60, maxWidth: 150 },
  { field: 'name', header: 'Name', width: 150, minWidth: 100 },
  { field: 'email', header: 'Email', width: 200 },
  { field: 'role', header: 'Role', width: 120 },
]

// Save column state to localStorage
function saveColumnState() {
  const snapshot = tableRef.value?.getColumnStateSnapshot()
  localStorage.setItem('table-columns', JSON.stringify(snapshot))
}

// Restore column state
function restoreColumnState() {
  const saved = localStorage.getItem('table-columns')
  if (saved) {
    const snapshot = JSON.parse(saved)
    tableRef.value?.setColumnOrder(snapshot.order)
    // ... restore other state
  }
}
</script>

<template>
  <div>
    <button @click="saveColumnState">Save Layout</button>
    <button @click="restoreColumnState">Restore Layout</button>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
    />
  </div>
</template>
```

---

## CSV Export

Export table data to CSV:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()

function exportCSV() {
  const csv = tableRef.value?.exportCSV({
    includeHeader: true,
    delimiter: ',',
    scope: 'filtered',  // 'visible' | 'filtered' | 'selected' | 'allLoaded'
    includeHiddenColumns: false,
    headerMode: 'header',  // 'field' | 'header'
    sanitizeFormulas: true,  // Protect against CSV injection
  })
  
  // Download the file
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportSelected() {
  const csv = tableRef.value?.exportCSV({
    scope: 'selected',
    includeHeader: true,
  })
  // Download...
}
</script>

<template>
  <div>
    <button @click="exportCSV">Export All</button>
    <button @click="exportSelected">Export Selected</button>
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
    />
  </div>
</template>
```

---

## CSV Import

Import CSV with preview and validation:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table, type ColumnDef, type CsvImportPreview } from '@ioi-dev/vue-table'

const tableRef = ref()
const preview = ref<CsvImportPreview | null>(null)
const fileInput = ref<HTMLInputElement>()

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  preview.value = await tableRef.value?.parseCSV(file, {
    delimiter: 'auto',
    hasHeader: true,
    previewRowLimit: 50,
  })
}

function importCSV() {
  if (!preview.value) return
  
  const result = tableRef.value?.commitCSVImport(
    preview.value.mapping,
    { mode: 'append', skipInvalidRows: true }
  )
  
  console.log('Imported:', result.importedRowCount)
  console.log('Skipped:', result.skippedRowCount)
  preview.value = null
}
</script>

<template>
  <div>
    <input 
      ref="fileInput"
      type="file" 
      accept=".csv"
      @change="handleFileSelect"
    />
    
    <!-- Preview dialog -->
    <div v-if="preview" class="preview-dialog">
      <h3>Preview ({{ preview.totalRows }} rows)</h3>
      <p v-if="preview.fatalError" class="error">{{ preview.fatalError }}</p>
      
      <table>
        <thead>
          <tr>
            <th v-for="col in preview.columns" :key="col.columnId">
              {{ col.header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in preview.rows" :key="row.rowNumber">
            <td v-for="col in preview.columns" :key="col.columnId">
              {{ row.values[col.field] }}
              <span v-if="row.errors.find(e => e.field === col.field)" class="error">
                {{ row.errors.find(e => e.field === col.field)?.message }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <button @click="importCSV">Import</button>
      <button @click="preview = null">Cancel</button>
    </div>
    
    <Table 
      ref="tableRef"
      :rows="users" 
      :columns="columns" 
      row-key="id"
    />
  </div>
</template>
```

---

## Server-Side Data

For large datasets, fetch data from server:

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

const tableRef = ref()
const users = ref([])
const loading = ref(false)
const totalRows = ref(0)

const pageIndex = ref(0)
const pageSize = ref(25)
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const filters = ref<Record<string, string>>({})

async function fetchData() {
  loading.value = true
  
  const params = new URLSearchParams({
    page: String(pageIndex.value),
    size: String(pageSize.value),
    sort: sortField.value,
    direction: sortDirection.value,
    ...filters.value,
  })
  
  const response = await fetch(`/api/users?${params}`)
  const data = await response.json()
  
  users.value = data.rows
  totalRows.value = data.total
  
  loading.value = false
}

function handlePaginationChange(payload: any) {
  pageIndex.value = payload.pageIndex
  pageSize.value = payload.pageSize
  fetchData()
}

function handleStateChange(event: any) {
  if (event.type === 'data:sort') {
    const sort = event.payload[0]
    sortField.value = sort?.field ?? ''
    sortDirection.value = sort?.direction ?? 'asc'
    fetchData()
  }
  if (event.type === 'data:filter') {
    // Update filters and refetch
    fetchData()
  }
}

onMounted(fetchData)
</script>

<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <Table 
      ref="tableRef"
      :rows="users"
      :columns="columns"
      row-key="id"
      v-model:pageIndex="pageIndex"
      v-model:pageSize="pageSize"
      @pagination-change="handlePaginationChange"
      @state-change="handleStateChange"
    >
      <template #empty>
        <div v-if="!loading">No users found</div>
      </template>
    </Table>
  </div>
</template>
```

---

## Headless Usage

Build your own UI with the composable:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
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
    rowHeight: 48,
    overscan: 3,
    viewportHeight: 400,
  }))
)

// All state and methods are available
const { visibleRows, totalRows, state, toggleSort, setGlobalSearch } = table
</script>

<template>
  <div class="custom-table">
    <!-- Search -->
    <input
      type="text"
      placeholder="Search..."
      @input="setGlobalSearch($event.target.value)"
    />
    
    <!-- Header -->
    <div class="header">
      <div 
        v-for="col in columns" 
        :key="col.field"
        @click="toggleSort(col.field)"
      >
        {{ col.header }}
        <span v-if="state.sort.find(s => s.field === col.field)">
          {{ state.sort.find(s => s.field === col.field)?.direction }}
        </span>
      </div>
    </div>
    
    <!-- Body with virtualization -->
    <div class="body" style="height: 400px; overflow: auto;">
      <div :style="{ height: `${table.totalHeight.value}px`, position: 'relative' }">
        <div :style="{ height: `${table.virtualPaddingTop.value}px` }" />
        <div
          v-for="(row, i) in visibleRows.value"
          :key="row.id"
          :style="{ height: '48px' }"
        >
          {{ row.name }} - {{ row.email }}
        </div>
        <div :style="{ height: `${table.virtualPaddingBottom.value}px` }" />
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Showing {{ visibleRows.value.length }} of {{ totalRows.value }} rows
    </div>
  </div>
</template>
```

---

## With Tailwind CSS

Style the table with Tailwind:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'
import '@ioi-dev/vue-table/unstyled'  // Import unstyled version

const columns: ColumnDef<User>[] = [...]
const users = [...]
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-gray-200">
    <Table
      :rows="users"
      :columns="columns"
      row-key="id"
      class="divide-y divide-gray-200"
    />
  </div>
</template>

<style>
.ioi-table {
  @apply w-full text-sm;
}

.ioi-table__viewport {
  @apply overflow-auto;
}

.ioi-table__table {
  @apply w-full border-collapse;
}

.ioi-table__table thead th {
  @apply bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500;
}

.ioi-table__row {
  @apply bg-white hover:bg-gray-50;
}

.ioi-table__row--selected {
  @apply bg-blue-50;
}

.ioi-table__table tbody td {
  @apply whitespace-nowrap px-4 py-3;
}

.ioi-table__empty {
  @apply px-4 py-8 text-center text-gray-500;
}

.ioi-table__filter-input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm;
}

.ioi-table__filter-select {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm;
}

.ioi-table__header--sorted-asc .ioi-table__header-label::after {
  content: ' ↑';
}

.ioi-table__header--sorted-desc .ioi-table__header-label::after {
  content: ' ↓';
}
</style>
```

---

## Nested Data

Access nested object properties with dot notation:

```vue
<script setup lang="ts">
import { Table, type ColumnDef } from '@ioi-dev/vue-table'

interface Order {
  id: number
  customer: {
    name: string
    email: string
    address: {
      city: string
      country: string
    }
  }
  items: Array<{ name: string; price: number }>
  total: number
}

const columns: ColumnDef<Order>[] = [
  { field: 'id', header: 'Order ID', width: 100 },
  { field: 'customer.name', header: 'Customer', width: 150 },
  { field: 'customer.email', header: 'Email', width: 200 },
  { field: 'customer.address.city', header: 'City', width: 120 },
  { field: 'customer.address.country', header: 'Country', width: 120 },
  { field: 'items[0].name', header: 'First Item', width: 150 },
  { field: 'total', header: 'Total', type: 'number', width: 100 },
]

const orders: Order[] = [
  {
    id: 1,
    customer: {
      name: 'Alice',
      email: 'alice@example.com',
      address: { city: 'New York', country: 'USA' }
    },
    items: [{ name: 'Widget', price: 29.99 }],
    total: 29.99
  },
  // ...
]
</script>

<template>
  <Table :rows="orders" :columns="columns" row-key="id" :height="400" />
</template>
```
