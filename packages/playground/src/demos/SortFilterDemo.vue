<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, SelectAllScope, SortState } from '@ioi-dev/vue-table';
import { usePerf } from '../composables/usePerf';
import { useTheme } from '../composables/useTheme';
import { createEmployeeColumns, createEmployees, type Employee } from '../utils/demoData';

const { activeTheme } = useTheme();
const { perfHistory, measure, clearHistory } = usePerf();

const rows = ref<Employee[]>(createEmployees(5_000));
const columns = ref<ColumnDef<Employee>[]>(createEmployeeColumns());

// Pagination
const pageIndex = ref(0);
const pageSize = ref(10);

// Salary filter + global search (name/dept/status are inline in the header)
const salaryMin = ref<number | ''>('');
const globalNeedle = ref('');

// Selection
const selectedCount = ref(0);

// Local sort state (for header indicators)
const sortStates = ref<SortState[]>([]);

interface TableRef {
  setSortState: (s: SortState[]) => void;
  setColumnFilter: (field: string, filter: import('@ioi-dev/vue-table').ColumnFilter) => void;
  clearAllFilters: () => void;
  setGlobalSearch: (text: string) => void;
  selectAll: (scope?: SelectAllScope) => void;
  clearSelection: () => void;
  getSelectedKeys: () => Array<string | number>;
  setPageIndex: (i: number) => void;
}

const tableRef = ref<TableRef | null>(null);

function syncSelected(): void {
  selectedCount.value = tableRef.value?.getSelectedKeys().length ?? 0;
}

/** Returns current sort direction for a field, or '' */
function getSortDir(field: string): 'asc' | 'desc' | '' {
  return sortStates.value.find(s => s.field === field)?.direction ?? '';
}

/** Click a column header to cycle: none → asc → desc → none */
function headerSort(field: string): void {
  const cur = getSortDir(field);
  let next: SortState[];
  if (!cur) next = [{ field, direction: 'asc' }];
  else if (cur === 'asc') next = [{ field, direction: 'desc' }];
  else next = [];
  sortStates.value = next;
  measure(`sort ${field}${next.length ? ' ' + next[0].direction : ' clear'}`, () => {
    tableRef.value?.setSortState(next);
    tableRef.value?.setPageIndex(0);
  });
}

function runSalaryFilter(): void {
  if (salaryMin.value === '' || isNaN(Number(salaryMin.value))) return;
  measure(`filter salary >= ${salaryMin.value}`, () => {
    tableRef.value?.setColumnFilter('salary', { type: 'number', operator: 'gte', value: Number(salaryMin.value) });
    tableRef.value?.setPageIndex(0);
  });
}

function clearSalaryFilter(): void {
  salaryMin.value = '';
  tableRef.value?.setColumnFilter('salary', { type: 'number', operator: 'gte', value: null });
}

function runGlobalSearch(): void {
  measure(`global search "${globalNeedle.value}"`, () => {
    tableRef.value?.setGlobalSearch(globalNeedle.value);
    tableRef.value?.setPageIndex(0);
  });
}

function runSelectAll(): void {
  measure('selectAll(filtered)', () => { tableRef.value?.selectAll('filtered'); });
  syncSelected();
}

function clearAll(): void {
  sortStates.value = [];
  salaryMin.value = '';
  globalNeedle.value = '';
  measure('clearAll', () => {
    tableRef.value?.setSortState([]);
    tableRef.value?.clearAllFilters();
    tableRef.value?.clearSelection();
    tableRef.value?.setPageIndex(0);
  });
  syncSelected();
}

function msColor(ms: number): string {
  if (ms < 5) return '#16a34a';
  if (ms < 50) return '#d97706';
  return '#dc2626';
}
</script>

<template>
  <div class="demo">
    <!-- Header -->
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Sort, Filter &amp; Paginate</h2>
        <p class="demo-desc">
          5,000 employee rows. Click any column header to sort (↑↓). Inline filters in the second
          header row. Salary and global search below. Selected: <strong>{{ selectedCount }}</strong>
        </p>
      </div>
    </div>

    <!-- Slim toolbar: salary + global search -->
    <div class="toolbar">
      <div class="ctrl-group">
        <label class="ctrl-label">Salary ≥</label>
        <input
          v-model.number="salaryMin"
          type="number"
          class="ctrl-input"
          placeholder="e.g. 80000"
          style="width:120px"
          @keydown.enter="runSalaryFilter"
        />
        <button class="btn" @click="runSalaryFilter">Apply</button>
        <button v-if="salaryMin !== ''" class="btn btn-ghost" @click="clearSalaryFilter">×</button>
      </div>

      <div class="ctrl-group">
        <label class="ctrl-label">Global search</label>
        <input
          v-model="globalNeedle"
          class="ctrl-input"
          placeholder="Search all columns…"
          @keydown.enter="runGlobalSearch"
        />
        <button class="btn" @click="runGlobalSearch">Search</button>
      </div>

      <div class="spacer" />

      <button class="btn btn-secondary" @click="runSelectAll">Select Filtered</button>
      <button class="btn btn-danger" @click="clearAll">Clear All</button>
      <button class="btn btn-ghost" @click="clearHistory">Clear Perf</button>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="460"
        :row-height="36"
        :overscan="6"
        v-model:pageIndex="pageIndex"
        v-model:pageSize="pageSize"
        @state-change="syncSelected"
      >
        <template #header="{ column }">
          <div
            class="sort-header"
            :title="`Click to sort by ${column.header ?? column.field}`"
            @click.stop="headerSort(String(column.field))"
          >
            <span>{{ column.header ?? column.field }}</span>
            <span class="sort-icon">
              {{ getSortDir(String(column.field)) === 'asc' ? '↑' : getSortDir(String(column.field)) === 'desc' ? '↓' : '' }}
            </span>
          </div>
        </template>
      </Table>
    </div>

    <div class="pagination-bar">
      <div class="page-info">
        Page {{ pageIndex + 1 }} &nbsp;|&nbsp;
        <select
          :value="pageSize"
          class="page-size-select"
          @change="pageSize = Number(($event.target as HTMLSelectElement).value); pageIndex = 0"
        >
          <option v-for="n in [10, 25, 50, 100]" :key="n" :value="n">{{ n }} / page</option>
        </select>
      </div>
      <div class="page-btns">
        <button class="page-btn" :disabled="pageIndex === 0" @click="pageIndex--">&larr;</button>
        <button class="page-btn" @click="pageIndex++">&rarr;</button>
      </div>
    </div>

    <aside v-if="perfHistory.length" class="perf-panel">
      <div class="perf-panel-header">
        <span class="perf-panel-title">Perf log</span>
        <code class="perf-hint">performance.now()</code>
      </div>
      <ul class="perf-list">
        <li v-for="entry in perfHistory" :key="entry.id" class="perf-entry">
          <span class="perf-entry-label">{{ entry.label }}</span>
          <strong class="perf-entry-ms" :style="{ color: msColor(entry.ms) }">{{ entry.ms }}ms</strong>
        </li>
      </ul>
    </aside>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>const tableRef = ref(null)

// Sort
tableRef.value.setSortState([{ field: 'name', direction: 'asc' }])
tableRef.value.setSortState([])  // clear

// Column filter
tableRef.value.setColumnFilter('salary', {
  type: 'number', operator: 'gte', value: 80000
})

// Global search (all text columns)
tableRef.value.setGlobalSearch('engineering')

// Clear everything
tableRef.value.clearAllFilters()

// Pagination
tableRef.value.setPageIndex(0)

// Selection
tableRef.value.selectAll('filtered')        // 'all' | 'filtered' | 'visible'
tableRef.value.clearSelection()
const keys = tableRef.value.getSelectedKeys()</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.7rem 1rem;
}
.spacer { flex: 1; }
.ctrl-group { display: flex; align-items: center; gap: 0.35rem; }
.ctrl-input { width: 150px; }

.btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.btn-danger:hover { background: #fecaca; }



.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 0.45rem 0.85rem; font-size: 0.8rem; color: #475569; margin-top: 0.5rem;
}
.page-info { display: flex; align-items: center; gap: 0.5rem; }
.page-size-select { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.15rem 0.35rem; font-size: 0.78rem; cursor: pointer; }
.page-btns { display: flex; gap: 0.35rem; }
.page-btn {
  border: 1px solid #e2e8f0; background: #fff; border-radius: 6px;
  padding: 0.25rem 0.65rem; font-size: 0.8rem; cursor: pointer;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.perf-panel {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 0.85rem 1rem;
}
.perf-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
.perf-panel-title { font-weight: 700; font-size: 0.82rem; color: #0f172a; }
.perf-hint { font-size: 0.7rem; color: #94a3b8; background: #f8fafc; border-radius: 4px; padding: 0.1rem 0.3rem; }

.perf-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.35rem; max-height: 400px; overflow-y: auto; }
.perf-entry { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.78rem; }
.perf-entry:last-child { border-bottom: none; }
.perf-entry-label { color: #475569; }
.perf-entry-ms { font-size: 0.85rem; font-weight: 700; }
.perf-empty { margin: 0; font-size: 0.78rem; color: #94a3b8; }

</style>
