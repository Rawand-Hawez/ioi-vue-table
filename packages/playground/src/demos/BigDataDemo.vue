<script setup lang="ts">
import { computed, ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';
import type { ColumnDef } from '@ioi-dev/vue-table';
import { createBigDataColumns, createBigDataRows, type PrimitiveRow } from '../utils/demoData';

const ROW_COUNT = 100_000;
const COLUMN_COUNT = 50;

const columns = ref<ColumnDef<PrimitiveRow>[]>(createBigDataColumns(COLUMN_COUNT));
const rows = ref<PrimitiveRow[]>(createBigDataRows(ROW_COUNT, COLUMN_COUNT));
const targetRow = ref(50_000);

interface BigDataTableExpose {
  scrollToRow: (index: number) => void;
}

const tableRef = ref<BigDataTableExpose | null>(null);

const tableStats = computed(() => ({
  rows: rows.value.length,
  columns: columns.value.length
}));

function jumpToRow(): void {
  const clampedRow = Math.max(1, Math.min(rows.value.length, Math.floor(targetRow.value)));
  targetRow.value = clampedRow;
  tableRef.value?.scrollToRow(clampedRow - 1);
}
</script>

<template>
  <section class="demo">
    <header class="demo__header">
      <div>
        <h2>Big Data</h2>
        <p>
          Deterministic dataset with {{ tableStats.rows.toLocaleString() }} rows and
          {{ tableStats.columns }} primitive columns.
        </p>
      </div>
      <form class="demo__controls" @submit.prevent="jumpToRow">
        <label>
          Jump to row
          <input v-model.number="targetRow" type="number" min="1" :max="tableStats.rows">
        </label>
        <button type="submit">Scroll</button>
      </form>
    </header>

    <IoiTable
      ref="tableRef"
      :rows="rows"
      :columns="columns"
      row-key="c01"
      :height="560"
      :row-height="30"
      :overscan="8"
    />
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

.demo__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.6rem;
}

.demo__controls label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #3e4d60;
}

.demo__controls input {
  width: 130px;
  border: 1px solid #b6c3d2;
  border-radius: 10px;
  padding: 0.45rem 0.55rem;
  font: inherit;
}

.demo__controls button {
  border: 0;
  border-radius: 10px;
  padding: 0.55rem 0.95rem;
  font-weight: 600;
  background: #0f5bd4;
  color: #ffffff;
  cursor: pointer;
}
</style>
