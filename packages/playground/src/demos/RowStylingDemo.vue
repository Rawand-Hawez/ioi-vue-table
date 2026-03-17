<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef, type AutoSizeOptions } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';

const { activeTheme } = useTheme();

// Extends Record<string, unknown> so the generic Table component accepts it
interface StatusRow extends Record<string, unknown> {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  lastActive: string;
  score: number;
}

// Local type for the exposed autoSizeColumns method — generic Vue components
// don't work with InstanceType<typeof Table> in vue-tsc
interface TableRef {
  autoSizeColumns: (columnIds?: string[], options?: AutoSizeOptions) => void;
}

const columns: ColumnDef<StatusRow>[] = [
  { field: 'id', header: 'ID', width: 60 },
  { field: 'name', header: 'Name', width: 150 },
  { field: 'status', header: 'Status', width: 100 },
  { field: 'lastActive', header: 'Last Active', width: 140 },
  { field: 'score', header: 'Score', width: 80 }
];

const rows: StatusRow[] = [
  { id: 1, name: 'Alice Chen', status: 'active', lastActive: '2 mins ago', score: 95 },
  { id: 2, name: 'Bob Smith', status: 'inactive', lastActive: '3 days ago', score: 72 },
  { id: 3, name: 'Carol Patel', status: 'pending', lastActive: '1 hour ago', score: 45 },
  { id: 4, name: 'David Kim', status: 'error', lastActive: '5 mins ago', score: 12 },
  { id: 5, name: 'Eva Garcia', status: 'active', lastActive: 'Just now', score: 88 },
  { id: 6, name: 'Frank Wilson', status: 'active', lastActive: '10 mins ago', score: 91 },
  { id: 7, name: 'Grace Lee', status: 'inactive', lastActive: '1 week ago', score: 33 },
  { id: 8, name: 'Henry Brown', status: 'pending', lastActive: '2 hours ago', score: 67 }
];

const tableRef = ref<TableRef | null>(null);

function getRowClass(row: StatusRow, rowIndex: number): Record<string, boolean> {
  return {
    [`row-status--${row.status}`]: true,
    'row--high-score': row.score >= 80,
    'row--even': rowIndex % 2 === 0
  };
}

function autoSizeAllColumns(): void {
  tableRef.value?.autoSizeColumns();
}

function autoSizeStatusColumn(): void {
  tableRef.value?.autoSizeColumns(['status'], { maxWidth: 150 });
}

const stringClassMode = ref(false);
</script>

<template>
  <div class="row-styling-demo">
    <section class="demo-section">
      <h2>Dynamic Row Classes</h2>
      <p class="section-desc">
        Use the <code>rowClass</code> prop to apply dynamic CSS classes to rows based on row data.
        Accepts a string, object, or function that receives <code>(row, rowIndex)</code>.
      </p>

      <div class="controls">
        <button class="btn" @click="autoSizeAllColumns">Auto-size All Columns</button>
        <button class="btn btn-secondary" @click="autoSizeStatusColumn">Auto-size Status Only</button>
        <label class="toggle-label">
          <input v-model="stringClassMode" type="checkbox">
          Use string class
        </label>
      </div>

      <div :class="`theme-${activeTheme}`">
        <Table
          ref="tableRef"
          :rows="rows"
          :columns="columns"
          row-key="id"
          :height="320"
          :row-class="stringClassMode ? 'custom-row-class' : getRowClass"
        />
      </div>
    </section>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>&lt;script setup&gt;
// Function returning an object
function getRowClass(row, rowIndex) {
  return {
    [`row-status--${row.status}`]: true,
    'row--high-score': row.score >= 80
  };
}

// Or use a string
const rowClass = 'my-custom-row-class';
&lt;/script&gt;

&lt;template&gt;
  &lt;Table :rows="rows" :row-class="getRowClass" /&gt;
&lt;/template&gt;

&lt;style&gt;
.row-status--active { background: #f0fdf4; }
.row-status--inactive { background: #f8fafc; opacity: 0.7; }
.row-status--pending { background: #fffbeb; }
.row-status--error { background: #fef2f2; }
.row--high-score { border-left: 3px solid #22c55e; }
&lt;/style&gt;</code></pre>
    </section>

    <section class="api-section">
      <h3>autoSizeColumns API</h3>
      <p class="section-desc">
        Programmatically size columns to fit their content. Only measures visible rows for performance.
      </p>
      <pre v-pre class="code-block"><code>// Auto-size all columns
tableRef.autoSizeColumns();

// Auto-size specific columns with options
tableRef.autoSizeColumns(['name', 'status'], {
  includeHeaders: true,  // Include header width (default: true)
  padding: 16,           // Extra padding per cell (default: 16)
  minWidth: 50,          // Minimum width (default: 50)
  maxWidth: 500          // Maximum width (default: 500)
});</code></pre>
    </section>
  </div>
</template>

<style scoped>
.row-styling-demo {
  display: grid;
  gap: 2rem;
}

.demo-section {
  display: grid;
  gap: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.section-desc {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.section-desc code {
  background: #f1f5f9;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: 'SFMono-Regular', Menlo, monospace;
}

.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}


.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
}

.code-section,
.api-section {
  display: grid;
  gap: 0.75rem;
}

.code-block {
  background: #0f172a;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0;
}

.code-block code {
  background: transparent;
  color: #e2e8f0;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre;
}
</style>

<style>
.row-status--active { background: #f0fdf4 !important; }
.row-status--inactive { background: #f8fafc !important; opacity: 0.7; }
.row-status--pending { background: #fffbeb !important; }
.row-status--error { background: #fef2f2 !important; }
.row--high-score { border-left: 3px solid #22c55e; }
.row--even { font-style: italic; }
.custom-row-class { background: #fdf4ff !important; }
</style>
