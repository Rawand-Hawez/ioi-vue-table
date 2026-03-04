<script setup lang="ts" generic="TRow extends Record<string, unknown>">
import { computed, watch } from 'vue';
import { useIoiTable } from '../composables/useIoiTable';
import type {
  CellSlotProps,
  ColumnDef,
  HeaderSlotProps,
  IoiSemanticEvent,
  IoiTableOptions,
  RowClickPayload
} from '../types';

const props = withDefaults(
  defineProps<{
    rows?: TRow[];
    columns?: ColumnDef<TRow>[];
    rowKey?: IoiTableOptions<TRow>['rowKey'];
    rowHeight?: number;
    overscan?: number;
    height?: number;
  }>(),
  {
    rows: () => [],
    columns: () => [],
    rowHeight: 36,
    overscan: 5,
    height: 320
  }
);

const emit = defineEmits<{
  'row-click': [payload: RowClickPayload<TRow>];
  'state-change': [event: IoiSemanticEvent<unknown>];
}>();

defineSlots<{
  header?: (slotProps: HeaderSlotProps<TRow>) => unknown;
  cell?: (slotProps: CellSlotProps<TRow>) => unknown;
  empty?: () => unknown;
}>();

const table = useIoiTable<TRow>({
  rows: props.rows,
  columns: props.columns,
  rowKey: props.rowKey,
  rowHeight: props.rowHeight,
  overscan: props.overscan,
  viewportHeight: props.height
});

const visibleColumns = computed(() => table.columns.value.filter((column) => !column.hidden));

watch(
  table.lastEvent,
  (event) => {
    if (event) {
      emit('state-change', event);
    }
  },
  { flush: 'post' }
);

function getCellValue(row: TRow, field: string): unknown {
  return (row as Record<string, unknown>)[field];
}

function resolveRowKey(row: TRow, index: number): string | number {
  const { rowKey } = props;

  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }

  if (rowKey && row && typeof row === 'object') {
    return String((row as Record<string, unknown>)[rowKey as string] ?? index);
  }

  return index;
}

function onRowClick(row: TRow, rowIndex: number): void {
  emit('row-click', { row, rowIndex });
}

defineExpose({
  scrollToRow: table.scrollToRow,
  exportCSV: table.exportCSV,
  resetState: table.resetState
});
</script>

<template>
  <div class="ioi-table" :style="{ '--ioi-table-height': `${height}px` }">
    <div class="ioi-table__viewport" role="region" aria-label="IOI Table viewport">
      <table class="ioi-table__table" role="grid">
        <thead>
          <tr>
            <th
              v-for="(column, columnIndex) in visibleColumns"
              :key="column.id ?? String(column.field)"
              scope="col"
            >
              <slot name="header" :column="column" :column-index="columnIndex">
                {{ column.header ?? column.field }}
              </slot>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in table.visibleRows.value"
            :key="resolveRowKey(row, rowIndex)"
            @click="onRowClick(row, rowIndex)"
          >
            <td
              v-for="(column, columnIndex) in visibleColumns"
              :key="column.id ?? String(column.field)"
            >
              <slot
                name="cell"
                :row="row"
                :row-index="rowIndex"
                :column="column"
                :column-index="columnIndex"
                :value="getCellValue(row, String(column.field))"
              >
                {{ getCellValue(row, String(column.field)) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!table.visibleRows.value.length">
            <td :colspan="Math.max(visibleColumns.length, 1)" class="ioi-table__empty">
              <slot name="empty">No data</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.ioi-table {
  --ioi-table-height: 320px;
  border: 1px solid #d7dbe2;
  border-radius: 8px;
  background: #ffffff;
}

.ioi-table__viewport {
  max-height: var(--ioi-table-height);
  overflow: auto;
}

.ioi-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.4;
}

.ioi-table__table th,
.ioi-table__table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eceff4;
  text-align: left;
}

.ioi-table__table th {
  background: #f7f9fc;
  font-weight: 600;
}

.ioi-table__empty {
  color: #7a8598;
  text-align: center;
}
</style>
