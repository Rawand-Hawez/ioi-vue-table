<script setup lang="ts" generic="TRow extends Record<string, unknown>">
import { computed, onMounted, ref, watch } from 'vue';
import { useIoiTable } from '../composables/useIoiTable';
import type {
  CellSlotProps,
  ColumnDef,
  HeaderSlotProps,
  IoiSemanticEvent,
  IoiTableOptions,
  RowClickPayload
} from '../types';
import { get as getNestedPathValue } from '../utils/nestedPath';

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

const table = useIoiTable<TRow>(
  computed(() => ({
    rows: props.rows,
    columns: props.columns,
    rowKey: props.rowKey,
    rowHeight: props.rowHeight,
    overscan: props.overscan,
    viewportHeight: props.height
  }))
);

const viewportRef = ref<HTMLDivElement | null>(null);

const visibleColumns = computed(() => table.columns.value.filter((column) => !column.hidden));
const visibleRowEntries = computed(() =>
  table.visibleIndices.value
    .map((rowIndex) => ({
      row: table.rows.value[rowIndex],
      rowIndex
    }))
    .filter((entry): entry is { row: TRow; rowIndex: number } => entry.row !== undefined)
);

watch(
  table.lastEvent,
  (event) => {
    if (event) {
      emit('state-change', event);
    }
  },
  { flush: 'post' }
);

watch(
  () => props.height,
  (nextHeight) => {
    table.setViewport(table.state.value.viewport.scrollTop, nextHeight);
  }
);

onMounted(() => {
  if (!viewportRef.value) {
    return;
  }

  table.setViewport(viewportRef.value.scrollTop, viewportRef.value.clientHeight || props.height);
});

function normalizeColumnWidth(width: number | string | undefined): string | undefined {
  if (typeof width === 'number') {
    return `${width}px`;
  }

  if (typeof width === 'string') {
    return width;
  }

  return undefined;
}

function getColumnStyle(column: ColumnDef<TRow>): Record<string, string> {
  const width = normalizeColumnWidth(column.width);

  return {
    width: width ?? '',
    minWidth: column.minWidth ? `${column.minWidth}px` : '',
    maxWidth: column.maxWidth ? `${column.maxWidth}px` : ''
  };
}

function getCellValue(row: TRow, field: string): unknown {
  return getNestedPathValue(row, field);
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

function onScroll(event: Event): void {
  const target = event.target as HTMLDivElement;
  table.setViewport(target.scrollTop, target.clientHeight || props.height);
}

defineExpose({
  scrollToRow: table.scrollToRow,
  exportCSV: table.exportCSV,
  resetState: table.resetState
});
</script>

<template>
  <div class="ioi-table" :style="{ '--ioi-table-height': `${height}px` }">
    <div
      ref="viewportRef"
      class="ioi-table__viewport"
      role="region"
      aria-label="IOI Table viewport"
      @scroll="onScroll"
    >
      <table class="ioi-table__table" role="grid">
        <thead>
          <tr>
            <th
              v-for="(column, columnIndex) in visibleColumns"
              :key="column.id ?? String(column.field)"
              :style="getColumnStyle(column)"
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
            v-if="table.virtualPaddingTop.value > 0"
            class="ioi-table__spacer"
            aria-hidden="true"
          >
            <td
              :colspan="Math.max(visibleColumns.length, 1)"
              :style="{ height: `${table.virtualPaddingTop.value}px` }"
            />
          </tr>
          <tr
            v-for="entry in visibleRowEntries"
            :key="resolveRowKey(entry.row, entry.rowIndex)"
            class="ioi-table__row"
            :style="{ height: `${rowHeight}px` }"
            @click="onRowClick(entry.row, entry.rowIndex)"
          >
            <td
              v-for="(column, columnIndex) in visibleColumns"
              :key="column.id ?? String(column.field)"
              :style="getColumnStyle(column)"
            >
              <slot
                name="cell"
                :row="entry.row"
                :row-index="entry.rowIndex"
                :column="column"
                :column-index="columnIndex"
                :value="getCellValue(entry.row, String(column.field))"
              >
                {{ getCellValue(entry.row, String(column.field)) }}
              </slot>
            </td>
          </tr>
          <tr
            v-if="table.virtualPaddingBottom.value > 0"
            class="ioi-table__spacer"
            aria-hidden="true"
          >
            <td
              :colspan="Math.max(visibleColumns.length, 1)"
              :style="{ height: `${table.virtualPaddingBottom.value}px` }"
            />
          </tr>
          <tr v-if="!table.totalRows.value">
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

.ioi-table__spacer td {
  padding: 0;
  border: 0;
}

.ioi-table__row {
  box-sizing: border-box;
}

.ioi-table__empty {
  color: #7a8598;
  text-align: center;
}
</style>
