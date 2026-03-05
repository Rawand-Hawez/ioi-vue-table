<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, ColumnFilter, SelectAllScope, SortState } from '@ioi-dev/vue-table';
import { createOpsColumns, createOpsRows, type OpsRow } from '../utils/demoData';
import { usePerfBaseline } from '../utils/perf';

const columns = ref<ColumnDef<OpsRow>[]>(createOpsColumns());
const rows = ref<OpsRow[]>(createOpsRows());
const cityFilter = ref('Erbil');
const globalNeedle = ref('orion');
const selectedCount = ref(0);

const { samples, measure, clear } = usePerfBaseline(14);

interface OpsTableExpose {
  setSortState: (sortState: SortState[]) => void;
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  clearColumnFilter: (field: string) => void;
  setGlobalSearch: (text: string) => void;
  clearAllFilters: () => void;
  selectAll: (scope?: SelectAllScope) => void;
  clearSelection: () => void;
  getSelectedKeys: () => Array<string | number>;
}

const tableRef = ref<OpsTableExpose | null>(null);

function syncSelectedCount(): void {
  selectedCount.value = tableRef.value?.getSelectedKeys().length ?? 0;
}

function measureSort(direction: 'asc' | 'desc'): void {
  measure(`sort score ${direction}`, () => {
    tableRef.value?.setSortState([{ field: 'score', direction }]);
  });
}

function measureCityFilter(): void {
  measure(`filter city=${cityFilter.value}`, () => {
    tableRef.value?.setColumnFilter('city', {
      type: 'text',
      operator: 'equals',
      value: cityFilter.value
    });
  });
}

function measureScoreFilter(): void {
  measure('filter score >= 700', () => {
    tableRef.value?.setColumnFilter('score', {
      type: 'number',
      operator: 'gte',
      value: 700
    });
  });
}

function measureGlobalSearch(): void {
  measure(`global search="${globalNeedle.value}"`, () => {
    tableRef.value?.setGlobalSearch(globalNeedle.value);
  });
}

function measureSelectAllFiltered(): void {
  measure('selectAll filtered', () => {
    tableRef.value?.selectAll('filtered');
  });
  syncSelectedCount();
}

function clearScenario(): void {
  measure('clear filters + sort + selection', () => {
    tableRef.value?.setSortState([]);
    tableRef.value?.clearColumnFilter('city');
    tableRef.value?.clearColumnFilter('score');
    tableRef.value?.clearAllFilters();
    tableRef.value?.clearSelection();
  });
  syncSelectedCount();
}
</script>

<template>
  <section class="demo">
    <header class="demo__header">
      <div>
        <h2>Ops Demo</h2>
        <p>
          Sort + filter + global search + selection with lightweight performance timings.
          Selected keys: <strong>{{ selectedCount }}</strong>
        </p>
      </div>
      <div class="demo__inputs">
        <label>
          City filter
          <input v-model="cityFilter" type="text">
        </label>
        <label>
          Global needle
          <input v-model="globalNeedle" type="text">
        </label>
      </div>
    </header>

    <div class="demo__actions">
      <button type="button" @click="measureSort('desc')">Sort Score Desc</button>
      <button type="button" @click="measureSort('asc')">Sort Score Asc</button>
      <button type="button" @click="measureCityFilter">Apply City Filter</button>
      <button type="button" @click="measureScoreFilter">Apply Score Filter</button>
      <button type="button" @click="measureGlobalSearch">Run Global Search</button>
      <button type="button" @click="measureSelectAllFiltered">Select Filtered</button>
      <button type="button" @click="clearScenario">Clear Scenario</button>
      <button type="button" @click="clear">Clear Perf Panel</button>
    </div>

    <div class="demo__layout">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="520"
        :row-height="34"
        :overscan="6"
      />

      <aside class="perf-panel">
        <h3>Perf Baseline (ms)</h3>
        <p class="perf-panel__hint">Measured with <code>performance.now()</code> around table actions.</p>
        <ul v-if="samples.length" class="perf-panel__list">
          <li v-for="sample in samples" :key="sample.id">
            <span>{{ sample.label }}</span>
            <strong>{{ sample.durationMs.toFixed(2) }}ms</strong>
            <small>{{ sample.capturedAt }}</small>
          </li>
        </ul>
        <p v-else class="perf-panel__empty">Run an action to capture timings.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 1rem;
}

.demo__header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.demo__header h2 {
  margin: 0;
  font-size: 1.35rem;
}

.demo__header p {
  margin: 0.35rem 0 0;
  color: #516074;
}

.demo__inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.demo__inputs label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #3e4d60;
}

.demo__inputs input {
  min-width: 120px;
  border: 1px solid #b6c3d2;
  border-radius: 10px;
  padding: 0.42rem 0.55rem;
  font: inherit;
}

.demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.demo__actions button {
  border: 0;
  border-radius: 10px;
  padding: 0.5rem 0.82rem;
  font-weight: 600;
  background: #0f5bd4;
  color: #ffffff;
  cursor: pointer;
}

.demo__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 0.85rem;
}

.perf-panel {
  border: 1px solid #d6deea;
  border-radius: 12px;
  background: #f8fbff;
  padding: 0.8rem;
}

.perf-panel h3 {
  margin: 0;
  font-size: 0.95rem;
}

.perf-panel__hint {
  margin: 0.35rem 0 0.7rem;
  font-size: 0.76rem;
  color: #5f6c7e;
}

.perf-panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.perf-panel__list li {
  display: grid;
  gap: 0.12rem;
  padding-bottom: 0.42rem;
  border-bottom: 1px solid #e4eaf3;
}

.perf-panel__list li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.perf-panel__list span {
  font-size: 0.8rem;
  color: #2d3a4c;
}

.perf-panel__list strong {
  font-size: 0.85rem;
}

.perf-panel__list small {
  font-size: 0.72rem;
  color: #738399;
}

.perf-panel__empty {
  margin: 0;
  font-size: 0.82rem;
  color: #5f6c7e;
}

@media (max-width: 980px) {
  .demo__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
