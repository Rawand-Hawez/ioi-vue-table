<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { AggregationType, ColumnDef, SortState } from '@ioi-dev/vue-table';
import { usePerf } from '../composables/usePerf';
import { useTheme } from '../composables/useTheme';
import { createSalesColumns, createSalesData, type SaleRow } from '../utils/demoData';

const { activeTheme } = useTheme();
const { perfHistory, measure, clearHistory } = usePerf();

const rows = ref<SaleRow[]>(createSalesData(2_000));
const columns = ref<ColumnDef<SaleRow>[]>(createSalesColumns());

const groupByField = ref<'region' | 'category' | 'status'>('region');
const groupByOptions: Array<{ value: 'region' | 'category' | 'status'; label: string }> = [
  { value: 'region', label: 'Region' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
];

const groupAggregations: Record<string, AggregationType[]> = {
  amount: ['sum', 'avg', 'count'],
  units: ['sum', 'avg'],
};

// Controlled group expansion — start with all collapsed
const expandedGroupKeys = ref<string[]>([]);

// Reset expanded groups whenever the groupBy field changes
watch(groupByField, () => { expandedGroupKeys.value = []; });

function changeGroup(value: 'region' | 'category' | 'status'): void {
  measure(`group by ${value}`, () => { groupByField.value = value; });
}

function fmt(n: number, decimals = 0): string {
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function msColor(ms: number): string {
  if (ms < 5) return '#16a34a';
  if (ms < 50) return '#d97706';
  return '#dc2626';
}

const groupCount = computed(() => {
  const unique = new Set(rows.value.map((r) => r[groupByField.value]));
  return unique.size;
});

interface TableRef { setSortState: (s: SortState[]) => void; }
const tableRef = ref<TableRef | null>(null);
const sortStates = ref<SortState[]>([]);
function getSortDir(field: string): 'asc' | 'desc' | '' {
  return sortStates.value.find(s => s.field === field)?.direction ?? '';
}
function headerSort(field: string): void {
  const cur = getSortDir(field);
  const next: SortState[] = !cur ? [{ field, direction: 'asc' }] : cur === 'asc' ? [{ field, direction: 'desc' }] : [];
  sortStates.value = next;
  tableRef.value?.setSortState(next);
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Row Grouping <span class="new-badge">v0.2.1</span></h2>
        <p class="demo-desc">
          Group 2,000 sales rows by any field. Aggregations (sum, avg, count) computed per group.
          Expand/collapse groups individually or all at once.
          {{ groupCount }} groups by <strong>{{ groupByField }}</strong>.
        </p>
      </div>
      <div class="controls">
        <div class="segment" role="group">
          <button
            v-for="opt in groupByOptions"
            :key="opt.value"
            :class="['seg-btn', { 'seg-btn--active': groupByField === opt.value }]"
            @click="changeGroup(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button class="btn btn-ghost" @click="clearHistory">Clear Log</button>
      </div>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="500"
        :row-height="36"
        :overscan="6"
        :group-by="groupByField"
        :group-aggregations="groupAggregations"
        v-model:expandedGroupKeys="expandedGroupKeys"
      >
        <template #header="{ column }">
          <div class="sort-header" @click.stop="headerSort(String(column.field))">
            <span>{{ column.header ?? column.field }}</span>
            <span class="sort-icon">{{ getSortDir(String(column.field)) === 'asc' ? '↑' : getSortDir(String(column.field)) === 'desc' ? '↓' : '' }}</span>
          </div>
        </template>
        <template #group-header="{ group, expanded, toggle }">
          <div class="group-row" @click="toggle()">
            <span class="group-arrow">{{ expanded ? '▼' : '▶' }}</span>
            <span class="group-value">{{ group.value }}</span>
            <span class="group-count">{{ group.count }} rows</span>
            <span class="group-agg">
              Sum: <strong>£{{ fmt(group.aggregations['amount_sum']) }}</strong>
            </span>
            <span class="group-agg">
              Avg: <strong>£{{ fmt(group.aggregations['amount_avg'], 0) }}</strong>
            </span>
            <span class="group-agg">
              Units: <strong>{{ fmt(group.aggregations['units_sum']) }}</strong>
            </span>
          </div>
        </template>
      </Table>
    </div>

    <aside v-if="perfHistory.length" class="perf-panel">
      <div class="perf-panel-header">
        <span class="perf-panel-title">Group timing</span>
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
      <pre v-pre class="code-block"><code>&lt;script setup&gt;
const expandedGroupKeys = ref([])
const sortStates = ref([])
function getSortDir(field) { return sortStates.value.find(s => s.field === field)?.direction ?? '' }
function headerSort(field) {
  const cur = getSortDir(field)
  const next = !cur ? [{ field, direction: 'asc' }] : cur === 'asc' ? [{ field, direction: 'desc' }] : []
  sortStates.value = next
  tableRef.value?.setSortState(next)
}

const groupAggregations = {
  amount: ['sum', 'avg', 'count'],
  units:  ['sum', 'avg'],
}
&lt;/script&gt;

&lt;template&gt;
  &lt;Table
    ref="tableRef"
    :rows="rows"
    :columns="columns"
    group-by="region"
    :group-aggregations="groupAggregations"
    v-model:expandedGroupKeys="expandedGroupKeys"
  &gt;
    &lt;template #header="{ column }"&gt;
      &lt;div class="sort-header" @click.stop="headerSort(String(column.field))"&gt;
        &lt;span&gt;{{ column.header ?? column.field }}&lt;/span&gt;
        &lt;span class="sort-icon"&gt;{{ getSortDir(column.field) === 'asc' ? '↑' : getSortDir(column.field) === 'desc' ? '↓' : '' }}&lt;/span&gt;
      &lt;/div&gt;
    &lt;/template&gt;
    &lt;template #group-header="{ group, expanded, toggle }"&gt;
      &lt;div @click="toggle()"&gt;
        {{ expanded ? '▼' : '▶' }} {{ group.value }}
        ({{ group.count }} rows)
        Sum: {{ group.aggregations['amount_sum'] }}
        Avg: {{ group.aggregations['amount_avg'] }}
      &lt;/div&gt;
    &lt;/template&gt;
  &lt;/Table&gt;
&lt;/template&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 65ch; }

.new-badge {
  font-size: 0.6rem; font-weight: 700;
  background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;
  border-radius: 20px; padding: 0.1rem 0.4rem;
}

.controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }



/* Group header slot styling */
.group-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem; font-weight: 600;
  color: #1e293b; cursor: pointer;
}
.group-row:hover { background: #f8fafc; }
.group-arrow { font-size: 0.6rem; color: #94a3b8; }
.group-value { font-weight: 700; color: #0f172a; min-width: 120px; }
.group-count { background: #f1f5f9; border-radius: 20px; padding: 0.1rem 0.5rem; font-size: 0.72rem; color: #64748b; white-space: nowrap; }
.group-agg { font-size: 0.75rem; color: #475569; white-space: nowrap; }
.group-agg strong { color: #0f172a; }

.perf-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; display: grid; gap: 0.75rem; }
.perf-panel-header { display: flex; align-items: center; justify-content: space-between; }
.perf-panel-title { font-weight: 700; font-size: 0.82rem; color: #0f172a; }
.perf-hint { font-size: 0.7rem; color: #94a3b8; background: #f8fafc; border-radius: 4px; padding: 0.1rem 0.3rem; }

.perf-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.3rem; }
.perf-entry { display: flex; justify-content: space-between; padding: 0.32rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.78rem; }
.perf-entry:last-child { border-bottom: none; }
.perf-entry-label { color: #475569; }
.perf-entry-ms { font-weight: 700; }
.perf-empty { margin: 0; font-size: 0.78rem; color: #94a3b8; }

.agg-legend { border-top: 1px solid #f1f5f9; padding-top: 0.65rem; }
.agg-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; }
.agg-code {
  display: block; font-family: monospace; font-size: 0.72rem;
  background: #f8fafc; border-radius: 6px; padding: 0.5rem 0.65rem;
  color: #334155; white-space: pre; line-height: 1.6;
}

</style>
