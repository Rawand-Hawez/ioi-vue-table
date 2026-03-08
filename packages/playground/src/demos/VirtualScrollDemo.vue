<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, ColumnFilter, SortState } from '@ioi-dev/vue-table';
import { usePerf } from '../composables/usePerf';
import { useTheme } from '../composables/useTheme';
import { createBigDataColumns, createBigDataRows, type BigDataRow } from '../utils/demoData';

const { activeTheme } = useTheme();
const { perfHistory, measure, clearHistory } = usePerf();

const ROW_COUNT = 100_000;
const COL_COUNT = 12;

const rows = ref<BigDataRow[]>([]);
const columns = ref<ColumnDef<BigDataRow>[]>([]);
const targetRow = ref(50_000);
const genMs = ref<number | null>(null);

interface TableRef {
  scrollToRow: (i: number) => void;
  setSortState: (s: SortState[]) => void;
  setColumnFilter: (f: string, filter: ColumnFilter) => void;
  clearAllFilters: () => void;
}
const tableRef = ref<TableRef | null>(null);

onMounted(() => {
  const start = performance.now();
  columns.value = createBigDataColumns(COL_COUNT);
  rows.value = createBigDataRows(ROW_COUNT, COL_COUNT);
  genMs.value = Math.round((performance.now() - start) * 10) / 10;
});

function jumpToRow(): void {
  const clamped = Math.max(1, Math.min(ROW_COUNT, Math.floor(targetRow.value)));
  targetRow.value = clamped;
  tableRef.value?.scrollToRow(clamped - 1);
}

function runBenchmark(): void {
  measure('sort c01 asc', () => { tableRef.value?.setSortState([{ field: 'c01', direction: 'asc' }]); });
  measure('sort c01 desc', () => { tableRef.value?.setSortState([{ field: 'c01', direction: 'desc' }]); });
  measure('filter c02 contains R1', () => {
    tableRef.value?.setColumnFilter('c02', { type: 'text', operator: 'contains', value: 'R1' });
  });
  measure('clear all', () => {
    tableRef.value?.setSortState([]);
    tableRef.value?.clearAllFilters();
  });
}

function msColor(ms: number): string {
  if (ms < 10) return '#16a34a';
  if (ms < 100) return '#d97706';
  return '#dc2626';
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Virtual Scroll</h2>
        <p class="demo-desc">
          {{ ROW_COUNT.toLocaleString() }} rows × {{ COL_COUNT }} columns rendered with windowed virtualization.
          Only visible rows are in the DOM at any time.
        </p>
      </div>

      <div class="controls">
        <div v-if="genMs !== null" class="stat-chip">
          Data generated in <strong>{{ genMs }}ms</strong>
        </div>
        <form class="jump-form" @submit.prevent="jumpToRow">
          <label class="ctrl-label">Jump to row</label>
          <input
            v-model.number="targetRow"
            type="number"
            class="ctrl-input"
            min="1"
            :max="ROW_COUNT"
          />
          <button type="submit" class="btn">Scroll</button>
        </form>
        <button class="btn btn-accent" @click="runBenchmark">Run Benchmark</button>
        <button class="btn btn-ghost" @click="clearHistory">Clear Log</button>
      </div>
    </div>

    <div class="layout">
      <div :class="`theme-${activeTheme}`">
        <Table
          ref="tableRef"
          :rows="rows"
          :columns="columns"
          row-key="c01"
          :height="560"
          :row-height="30"
          :overscan="8"
        />
      </div>

      <aside class="perf-panel">
        <div class="perf-panel-header">
          <span class="perf-panel-title">Benchmark log</span>
          <code class="perf-hint">performance.now()</code>
        </div>
        <div class="metric-row" v-if="genMs !== null">
          <span>Data generation</span>
          <strong :style="{ color: msColor(genMs) }">{{ genMs }}ms</strong>
        </div>
        <ul v-if="perfHistory.length" class="perf-list">
          <li v-for="entry in perfHistory" :key="entry.id" class="perf-entry">
            <span class="perf-entry-label">{{ entry.label }}</span>
            <strong class="perf-entry-ms" :style="{ color: msColor(entry.ms) }">{{ entry.ms }}ms</strong>
          </li>
        </ul>
        <p v-if="!perfHistory.length" class="perf-empty">Click "Run Benchmark" to start.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; }

.controls { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }

.stat-chip {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  color: #166534;
}

.jump-form { display: flex; align-items: center; gap: 0.4rem; }
.ctrl-label { font-size: 0.75rem; font-weight: 600; color: #64748b; white-space: nowrap; }
.ctrl-input {
  border: 1px solid #cbd5e1; border-radius: 7px; padding: 0.3rem 0.55rem;
  font-size: 0.8rem; outline: none; width: 100px;
}
.ctrl-input:focus { border-color: #0f5bd4; }

.btn {
  border: none; border-radius: 8px; padding: 0.42rem 0.8rem;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  background: #0f5bd4; color: #fff; transition: background 120ms;
}
.btn:hover { background: #0c4baf; }
.btn-accent { background: #7c3aed; }
.btn-accent:hover { background: #6d28d9; }
.btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f8fafc; }

.layout { display: grid; grid-template-columns: 1fr 260px; gap: 0.85rem; align-items: start; }

.perf-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; }
.perf-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
.perf-panel-title { font-weight: 700; font-size: 0.82rem; color: #0f172a; }
.perf-hint { font-size: 0.7rem; color: #94a3b8; background: #f8fafc; border-radius: 4px; padding: 0.1rem 0.3rem; }

.metric-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.35rem 0; border-bottom: 1px solid #f1f5f9;
  font-size: 0.78rem; color: #475569; margin-bottom: 0.35rem;
}

.perf-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.35rem; max-height: 400px; overflow-y: auto; }
.perf-entry { display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.78rem; }
.perf-entry:last-child { border-bottom: none; }
.perf-entry-label { color: #475569; }
.perf-entry-ms { font-weight: 700; }
.perf-empty { margin: 0; font-size: 0.78rem; color: #94a3b8; }

@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
