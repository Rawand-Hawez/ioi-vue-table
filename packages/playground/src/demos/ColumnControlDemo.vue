<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, ColumnStateSnapshot } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';
import { createProjectColumns, createProjects, type ProjectRow } from '../utils/demoData';

const { activeTheme } = useTheme();

const rows = ref<ProjectRow[]>(createProjects(1_200));
const columns = ref<ColumnDef<ProjectRow>[]>(createProjectColumns());
const snapshot = ref<ColumnStateSnapshot | null>(null);

interface TableRef {
  setColumnOrder: (order: string[]) => void;
  setColumnPin: (id: string, pin: 'left' | 'right' | 'none') => void;
  setColumnSizing: (id: string, sizing: { width?: number }) => void;
  setColumnVisibility: (id: string, hidden: boolean) => void;
  getColumnStateSnapshot: () => ColumnStateSnapshot;
}

const tableRef = ref<TableRef | null>(null);

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
  const pin = t.getColumnStateSnapshot().pin['owner'] ?? 'none';
  t.setColumnPin('owner', pin === 'right' ? 'none' : 'right');
  capture();
}

function toggleRiskVisibility(): void {
  const t = tableRef.value;
  if (!t) return;
  const vis = t.getColumnStateSnapshot().hidden;
  const hidden = vis['risk'] ?? false;
  t.setColumnVisibility('risk', !hidden);
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
      <div class="actions">
        <button class="btn" @click="rotateOrder">Rotate Order</button>
        <button class="btn btn-secondary" @click="widenPins">Widen Pins</button>
        <button class="btn btn-secondary" @click="toggleOwnerPin">Toggle Owner Pin</button>
        <button class="btn btn-secondary" @click="toggleRiskVisibility">Toggle Risk</button>
        <button class="btn btn-secondary" @click="capture">Capture Snapshot</button>
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
      />
    </div>

    <div v-if="snapshot" class="snapshot-panel">
      <div class="snapshot-header">Column State Snapshot</div>
      <pre class="snapshot-body">{{ JSON.stringify(snapshot, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 60ch; }

.actions { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center; }

.btn {
  border: none; border-radius: 8px; padding: 0.42rem 0.8rem;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  background: #0f5bd4; color: #fff; transition: background 120ms;
}
.btn:hover { background: #0c4baf; }
.btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.btn-secondary:hover { background: #e2e8f0; }

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
