<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, SelectAllScope } from '@ioi-dev/vue-table';
import { usePerf } from '../composables/usePerf';
import { useTheme } from '../composables/useTheme';
import { createEmployeeColumns, createEmployees, type Employee } from '../utils/demoData';

const { activeTheme } = useTheme();
const { measure, clearHistory } = usePerf();

const rows = ref<Employee[]>(createEmployees(5_000));
const columns = ref<ColumnDef<Employee>[]>(createEmployeeColumns());

// Pagination state
const pageIndex = ref(0);
const pageSize = ref(10);

// Salary filter + global search
const salaryMin = ref<number | ''>('');
const globalNeedle = ref('');

// Selection
const selectedCount = ref(0);

interface TableRef {
  setColumnFilter: (field: string, filter: import('@ioi-dev/vue-table').ColumnFilter) => void;
  clearAllFilters: () => void;
  setGlobalSearch: (text: string) => void;
  selectAll: (scope?: SelectAllScope) => void;
  clearSelection: () => void;
  getSelectedKeys: () => Array<string | number>;
}

const tableRef = ref<TableRef | null>(null);

function syncSelected(): void {
  selectedCount.value = tableRef.value?.getSelectedKeys().length ?? 0;
}

function runSalaryFilter(): void {
  if (salaryMin.value === '' || isNaN(Number(salaryMin.value))) return;
  measure(`filter salary >= ${salaryMin.value}`, () => {
    tableRef.value?.setColumnFilter('salary', { type: 'number', operator: 'gte', value: Number(salaryMin.value) });
    pageIndex.value = 0;
  });
}

function clearSalaryFilter(): void {
  salaryMin.value = '';
  tableRef.value?.setColumnFilter('salary', { type: 'number', operator: 'gte', value: null });
}

function runGlobalSearch(): void {
  measure(`global search "${globalNeedle.value}"`, () => {
    tableRef.value?.setGlobalSearch(globalNeedle.value);
    pageIndex.value = 0;
  });
}

function runSelectAll(): void {
  measure('selectAll(filtered)', () => { tableRef.value?.selectAll('filtered'); });
  syncSelected();
}

function clearAll(): void {
  salaryMin.value = '';
  globalNeedle.value = '';
  measure('clearAll', () => {
    tableRef.value?.clearAllFilters();
    tableRef.value?.clearSelection();
    pageIndex.value = 0;
  });
  syncSelected();
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Sort, Filter &amp; Paginate</h2>
        <p class="demo-desc">
          5,000 employee rows. Built-in sorting and pagination.
          Selected: <strong class="text-blue-600">{{ selectedCount }}</strong>
        </p>
      </div>
    </div>

    <div class="toolbar">
      <div class="ctrl-group">
        <label class="ctrl-label">Salary ≥</label>
        <input
          v-model.number="salaryMin"
          type="number"
          class="ctrl-input"
          placeholder="e.g. 80000"
          style="width:110px"
          @keydown.enter="runSalaryFilter"
        >
        <button class="pg-btn" @click="runSalaryFilter">Apply</button>
        <button v-if="salaryMin !== ''" class="pg-btn pg-btn-ghost" @click="clearSalaryFilter">×</button>
      </div>

      <div class="ctrl-group">
        <label class="ctrl-label">Global search</label>
        <input
          v-model="globalNeedle"
          class="ctrl-input"
          placeholder="Search all columns…"
          @keydown.enter="runGlobalSearch"
        >
        <button class="pg-btn" @click="runGlobalSearch">Search</button>
      </div>

      <div class="spacer" />

      <button class="pg-btn pg-btn-secondary" @click="runSelectAll">Select Filtered</button>
      <button class="pg-btn pg-btn-ghost" @click="clearAll">Clear All</button>
      <button class="pg-btn pg-btn-ghost" @click="clearHistory">Clear Perf</button>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        v-model:page-index="pageIndex"
        v-model:page-size="pageSize"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="460"
        :row-height="36"
        :overscan="6"
        :show-pagination="true"
        @state-change="syncSelected"
      />
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>&lt;Table
  :rows="rows"
  :columns="columns"
  row-key="id"

  v-model:pageIndex="page"
  v-model:pageSize="size"
  :show-pagination="true"
/&gt;</code></pre>
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
</style>
