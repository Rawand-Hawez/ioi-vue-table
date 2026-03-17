<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, ColumnStateSnapshot, SortState } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';
import { createProjectColumns, createProjects, type ProjectRow } from '../utils/demoData';

const { activeTheme } = useTheme();

const rows = ref<ProjectRow[]>(createProjects(1_200));
const columns = ref<ColumnDef<ProjectRow>[]>(createProjectColumns());
const snapshot = ref<ColumnStateSnapshot | null>(null);
const ownerPinned = ref(false);
const riskHidden = ref(false);

interface TableRef {
  setColumnOrder: (order: string[]) => void;
  setColumnPin: (id: string, pin: 'left' | 'right' | 'none') => void;
  setColumnSizing: (id: string, sizing: { width?: number }) => void;
  setColumnVisibility: (id: string, hidden: boolean) => void;
  getColumnStateSnapshot: () => ColumnStateSnapshot;
  setSortState: (s: SortState[]) => void;
}

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

function capture(): void {
  snapshot.value = tableRef.value?.getColumnStateSnapshot() ?? null;
}

function rotateOrder(): void {
  const t = tableRef.value;
  if (!t) return;
  const order = t.getColumnStateSnapshot().order;
  if (order.length < 4) return;
  const [first, second, ...rest] = order;
  t.setColumnOrder([first, ...rest, second]);
  capture();
}

function widenPins(): void {
  const t = tableRef.value;
  if (!t) return;
  t.setColumnSizing('id', { width: 100 });
  t.setColumnSizing('project', { width: 280 });
  t.setColumnSizing('status', { width: 150 });
  t.setColumnSizing('progress', { width: 160 });
  capture();
}

function toggleOwnerPin(): void {
  const t = tableRef.value;
  if (!t) return;
  ownerPinned.value = !ownerPinned.value;
  t.setColumnPin('owner', ownerPinned.value ? 'right' : 'none');
  capture();
}

function toggleRiskVisibility(): void {
  const t = tableRef.value;
  if (!t) return;
  riskHidden.value = !riskHidden.value;
  t.setColumnVisibility('risk', riskHidden.value);
  capture();
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Column Control</h2>
        <p class="demo-desc">
          Pin columns left/right, resize by dragging the edge handle,
          reorder within the same pin group, and toggle visibility — all state-snapshotted.
        </p>
      </div>
      <div class="controls">
        <div class="segment" role="group">
          <button class="seg-btn" @click="rotateOrder">Rotate Order</button>
          <button class="seg-btn" @click="widenPins">Widen Pins</button>
          <button :class="['seg-btn', { 'seg-btn--active': ownerPinned }]" @click="toggleOwnerPin">Pin Owner</button>
          <button :class="['seg-btn', { 'seg-btn--active': riskHidden }]" @click="toggleRiskVisibility">Hide Risk</button>
        </div>
        <button class="btn btn-ghost" @click="capture">Capture Snapshot</button>
      </div>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="520"
        :row-height="34"
        :overscan="6"
      >
        <template #header="{ column }">
          <div class="sort-header" @click.stop="headerSort(String(column.field))">
            <span>{{ column.header ?? column.field }}</span>
            <span class="sort-icon">{{ getSortDir(String(column.field)) === 'asc' ? '↑' : getSortDir(String(column.field)) === 'desc' ? '↓' : '' }}</span>
          </div>
        </template>
      </Table>
    </div>

    <div v-if="snapshot" class="snapshot-panel">
      <div class="snapshot-header">Column State Snapshot</div>
      <pre class="snapshot-body">{{ JSON.stringify(snapshot, null, 2) }}</pre>
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>const tableRef = ref(null)

// Sort — click any header to cycle asc → desc → clear
tableRef.value.setSortState([{ field: 'name', direction: 'asc' }])
tableRef.value.setSortState([])  // clear

// Pin columns
tableRef.value.setColumnPin('name', 'left')
tableRef.value.setColumnPin('actions', 'right')
tableRef.value.setColumnPin('name', 'none')   // unpin

// Resize a column
tableRef.value.setColumnSizing('name', { width: 280 })

// Reorder (by field id, within the same pin group)
tableRef.value.setColumnOrder(['id', 'status', 'name', 'role'])

// Show / hide
tableRef.value.setColumnVisibility('risk', true)   // hidden: true = invisible

// Snapshot current column state
const snap = tableRef.value.getColumnStateSnapshot()
// snap.order   → string[]
// snap.pin     → Record&lt;string, 'left' | 'right' | 'none'&gt;
// snap.sizing  → Record&lt;string, { width: number }&gt;
// snap.hidden  → Record&lt;string, boolean&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 60ch; }

.controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }


.snapshot-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.snapshot-header {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.snapshot-body {
  margin: 0;
  padding: 0.85rem;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.72rem;
  color: #334155;
  background: #ffffff;
  max-height: 220px;
  overflow: auto;
  line-height: 1.55;
}
</style>
