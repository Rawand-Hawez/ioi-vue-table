<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi/vue-table';
import type { ColumnDef, ColumnStateSnapshot } from '@ioi/vue-table';
import { createPinnedColumns, createPinnedRows, type PinnedRow } from '../utils/demoData';

const columns = ref<ColumnDef<PinnedRow>[]>(createPinnedColumns());
const rows = ref<PinnedRow[]>(createPinnedRows());
const lastSnapshot = ref<ColumnStateSnapshot | null>(null);

interface PinnedTableExpose {
  setColumnOrder: (nextOrder: string[]) => void;
  setColumnPin: (columnId: string, pin: 'left' | 'right' | 'none') => void;
  setColumnSizing: (
    columnId: string,
    sizing: { width?: number | string; minWidth?: number; maxWidth?: number }
  ) => void;
  getColumnStateSnapshot: () => ColumnStateSnapshot;
}

const tableRef = ref<PinnedTableExpose | null>(null);

function captureSnapshot(): void {
  lastSnapshot.value = tableRef.value?.getColumnStateSnapshot() ?? null;
}

function rotateOrder(): void {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  const currentOrder = table.getColumnStateSnapshot().order;
  if (currentOrder.length < 4) {
    return;
  }

  const [first, second, ...rest] = currentOrder;
  table.setColumnOrder([first, ...rest, second]);
  captureSnapshot();
}

function widenPinnedColumns(): void {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  table.setColumnSizing('id', { width: 110 });
  table.setColumnSizing('project', { width: 260 });
  table.setColumnSizing('status', { width: 150 });
  table.setColumnSizing('progress', { width: 160 });
  captureSnapshot();
}

function toggleOwnerPin(): void {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  const snapshot = table.getColumnStateSnapshot();
  const currentPin = snapshot.pin.owner ?? 'none';
  table.setColumnPin('owner', currentPin === 'right' ? 'none' : 'right');
  captureSnapshot();
}
</script>

<template>
  <section class="demo">
    <header class="demo__header">
      <div>
        <h2>Pinned Columns</h2>
        <p>
          Drag headers to reorder within the same pin group and drag right-edge handles to resize.
          Cross-group reorder (left/center/right) is intentionally blocked in v1.
        </p>
      </div>
      <div class="demo__actions">
        <button type="button" @click="rotateOrder">Rotate Order</button>
        <button type="button" @click="widenPinnedColumns">Widen Pins</button>
        <button type="button" @click="toggleOwnerPin">Toggle Owner Pin</button>
        <button type="button" @click="captureSnapshot">Capture Snapshot</button>
      </div>
    </header>

    <IoiTable
      ref="tableRef"
      :rows="rows"
      :columns="columns"
      row-key="id"
      :height="540"
      :row-height="34"
      :overscan="6"
    />

    <pre v-if="lastSnapshot" class="demo__snapshot">{{ JSON.stringify(lastSnapshot, null, 2) }}</pre>
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

.demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.demo__actions button {
  border: 0;
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  background: #1052bd;
  color: #ffffff;
  cursor: pointer;
}

.demo__snapshot {
  max-height: 190px;
  overflow: auto;
  margin: 0;
  padding: 0.8rem;
  border-radius: 10px;
  border: 1px solid #d6deea;
  background: #f8fafc;
  font-size: 0.73rem;
}
</style>
