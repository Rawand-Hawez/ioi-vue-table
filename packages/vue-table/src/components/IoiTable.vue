<script setup lang="ts" generic="TRow extends Record<string, unknown>">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useColumnState } from '../composables/useColumnState';
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
const columnState = useColumnState<TRow>(
  computed(() => ({
    columns: table.columns.value
  }))
);

const pinnedLeftColumns = computed(() => columnState.pinnedLeftColumns.value);
const centerColumns = computed(() => columnState.centerColumns.value);
const pinnedRightColumns = computed(() => columnState.pinnedRightColumns.value);
const renderColumns = computed(() => [
  ...pinnedLeftColumns.value,
  ...centerColumns.value,
  ...pinnedRightColumns.value
]);
const visibleRowEntries = computed(() =>
  table.visibleIndices.value
    .map((rowIndex) => ({
      row: table.rows.value[rowIndex],
      rowIndex
    }))
    .filter((entry): entry is { row: TRow; rowIndex: number } => entry.row !== undefined)
);

type PinGroup = 'left' | 'center' | 'right';

interface ResizeState {
  columnId: string;
  startX: number;
  startWidth: number;
}

const resizeState = ref<ResizeState | null>(null);
const draggingColumnId = ref<string | null>(null);
const draggingPinGroup = ref<PinGroup | null>(null);
const dragTargetColumnId = ref<string | null>(null);

const leftStickyOffsets = computed(() => {
  let offset = 0;
  const offsets = new Map<string, number>();

  for (let index = 0; index < pinnedLeftColumns.value.length; index += 1) {
    const column = pinnedLeftColumns.value[index];
    offsets.set(column.id, offset);
    offset += getStickyWidth(column);
  }

  return offsets;
});

const rightStickyOffsets = computed(() => {
  let offset = 0;
  const offsets = new Map<string, number>();

  for (let index = pinnedRightColumns.value.length - 1; index >= 0; index -= 1) {
    const column = pinnedRightColumns.value[index];
    offsets.set(column.id, offset);
    offset += getStickyWidth(column);
  }

  return offsets;
});

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

onUnmounted(() => {
  window.removeEventListener('mousemove', onResizeMouseMove);
  window.removeEventListener('mouseup', onResizeMouseUp);
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

function resolveColumnId(column: ColumnDef<TRow>): string {
  return String(column.id ?? column.field);
}

function parseNumericWidth(width: number | string | undefined): number | null {
  if (typeof width === 'number' && Number.isFinite(width)) {
    return width;
  }

  if (typeof width !== 'string') {
    return null;
  }

  const normalized = width.trim();
  if (normalized.endsWith('%')) {
    return null;
  }

  if (normalized.endsWith('px')) {
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPercentWidth(width: number | string | undefined): boolean {
  return typeof width === 'string' && width.trim().endsWith('%');
}

function getStickyWidth(column: ColumnDef<TRow>): number {
  const parsedWidth = parseNumericWidth(column.width);
  if (parsedWidth !== null) {
    return parsedWidth;
  }

  if (typeof column.minWidth === 'number' && Number.isFinite(column.minWidth)) {
    return column.minWidth;
  }

  return 160;
}

function resolvePinGroup(column: ColumnDef<TRow>): PinGroup {
  if (column.pin === 'left') {
    return 'left';
  }

  if (column.pin === 'right') {
    return 'right';
  }

  return 'center';
}

function isColumnResizable(column: ColumnDef<TRow>): boolean {
  return !isPercentWidth(column.width);
}

function resolveResizableWidth(column: ColumnDef<TRow>): number {
  const parsedWidth = parseNumericWidth(column.width);
  if (parsedWidth !== null) {
    return parsedWidth;
  }

  if (typeof column.minWidth === 'number' && Number.isFinite(column.minWidth)) {
    return column.minWidth;
  }

  return 160;
}

function onResizeHandleMouseDown(event: MouseEvent, column: ColumnDef<TRow>): void {
  if (!isColumnResizable(column) || event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  resizeState.value = {
    columnId: resolveColumnId(column),
    startX: event.clientX,
    startWidth: resolveResizableWidth(column)
  };

  window.addEventListener('mousemove', onResizeMouseMove);
  window.addEventListener('mouseup', onResizeMouseUp);
}

function onResizeMouseMove(event: MouseEvent): void {
  const activeResize = resizeState.value;
  if (!activeResize) {
    return;
  }

  const deltaX = event.clientX - activeResize.startX;
  columnState.setColumnSizing(activeResize.columnId, {
    width: activeResize.startWidth + deltaX
  });
}

function onResizeMouseUp(): void {
  if (!resizeState.value) {
    return;
  }

  resizeState.value = null;
  window.removeEventListener('mousemove', onResizeMouseMove);
  window.removeEventListener('mouseup', onResizeMouseUp);
}

function onHeaderDragStart(event: DragEvent, column: ColumnDef<TRow>): void {
  const columnId = resolveColumnId(column);
  draggingColumnId.value = columnId;
  draggingPinGroup.value = resolvePinGroup(column);
  dragTargetColumnId.value = null;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnId);
  }
}

function onHeaderDragOver(event: DragEvent, column: ColumnDef<TRow>): void {
  if (!draggingColumnId.value || !draggingPinGroup.value) {
    return;
  }

  if (resolvePinGroup(column) !== draggingPinGroup.value) {
    dragTargetColumnId.value = null;
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  dragTargetColumnId.value = resolveColumnId(column);
}

function onHeaderDrop(event: DragEvent, targetColumn: ColumnDef<TRow>): void {
  event.preventDefault();
  const sourceColumnId = draggingColumnId.value;
  if (!sourceColumnId) {
    return;
  }

  const sourceColumn = renderColumns.value.find((column) => resolveColumnId(column) === sourceColumnId);
  if (!sourceColumn) {
    return;
  }

  if (resolvePinGroup(sourceColumn) !== resolvePinGroup(targetColumn)) {
    return;
  }

  const targetColumnId = resolveColumnId(targetColumn);
  if (sourceColumnId === targetColumnId) {
    return;
  }

  const snapshot = columnState.getSnapshot();
  const nextOrder = [...snapshot.order];
  const sourceIndex = nextOrder.indexOf(sourceColumnId);
  const targetIndex = nextOrder.indexOf(targetColumnId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }

  const [sourceEntry] = nextOrder.splice(sourceIndex, 1);
  if (!sourceEntry) {
    return;
  }

  const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  nextOrder.splice(insertIndex, 0, sourceEntry);
  columnState.setColumnOrder(nextOrder);
}

function onHeaderDragEnd(): void {
  draggingColumnId.value = null;
  draggingPinGroup.value = null;
  dragTargetColumnId.value = null;
}

function getColumnStyle(
  column: ColumnDef<TRow>,
  section: 'header' | 'body' = 'body'
): Record<string, string> {
  const width = normalizeColumnWidth(column.width);
  const columnId = column.id ?? String(column.field);
  const style: Record<string, string> = {
    width: width ?? '',
    minWidth: column.minWidth ? `${column.minWidth}px` : '',
    maxWidth: column.maxWidth ? `${column.maxWidth}px` : ''
  };

  if (column.pin === 'left') {
    style.position = 'sticky';
    style.left = `${leftStickyOffsets.value.get(columnId) ?? 0}px`;
    style.zIndex = section === 'header' ? '4' : '2';
    style.background = section === 'header' ? '#f7f9fc' : '#ffffff';
    style.boxShadow = '2px 0 0 #eceff4';
  } else if (column.pin === 'right') {
    style.position = 'sticky';
    style.right = `${rightStickyOffsets.value.get(columnId) ?? 0}px`;
    style.zIndex = section === 'header' ? '4' : '2';
    style.background = section === 'header' ? '#f7f9fc' : '#ffffff';
    style.boxShadow = '-2px 0 0 #eceff4';
  }

  return style;
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
  parseCSV: table.parseCSV,
  commitCSVImport: table.commitCSVImport,
  resetState: table.resetState,
  setColumnFilter: table.setColumnFilter,
  clearColumnFilter: table.clearColumnFilter,
  setGlobalSearch: table.setGlobalSearch,
  clearAllFilters: table.clearAllFilters,
  setSortState: table.setSortState,
  toggleSort: table.toggleSort,
  toggleRow: table.toggleRow,
  isSelected: table.isSelected,
  clearSelection: table.clearSelection,
  selectAll: table.selectAll,
  getSelectedKeys: table.getSelectedKeys,
  startEdit: table.startEdit,
  setEditDraft: table.setEditDraft,
  commitEdit: table.commitEdit,
  cancelEdit: table.cancelEdit,
  setColumnOrder: columnState.setColumnOrder,
  setColumnVisibility: columnState.setColumnVisibility,
  setColumnPin: columnState.setColumnPin,
  setColumnSizing: columnState.setColumnSizing,
  getColumnStateSnapshot: columnState.getSnapshot
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
              v-for="(column, columnIndex) in renderColumns"
              :key="column.id"
              :class="{
                'ioi-table__header--dragging': draggingColumnId === column.id,
                'ioi-table__header--drag-target': dragTargetColumnId === column.id
              }"
              :data-column-id="column.id"
              :draggable="true"
              :style="getColumnStyle(column, 'header')"
              scope="col"
              @dragend="onHeaderDragEnd"
              @dragover="onHeaderDragOver($event, column)"
              @dragstart="onHeaderDragStart($event, column)"
              @drop="onHeaderDrop($event, column)"
            >
              <div class="ioi-table__header-content">
                <slot name="header" :column="column" :column-index="columnIndex">
                  <span class="ioi-table__header-label">{{ column.header ?? column.field }}</span>
                </slot>
              </div>
              <button
                type="button"
                class="ioi-table__resize-handle"
                :class="{ 'ioi-table__resize-handle--disabled': !isColumnResizable(column) }"
                :aria-label="`Resize ${column.header ?? String(column.field)}`"
                :disabled="!isColumnResizable(column)"
                @mousedown="onResizeHandleMouseDown($event, column)"
              />
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
              :colspan="Math.max(renderColumns.length, 1)"
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
              v-for="(column, columnIndex) in renderColumns"
              :key="column.id"
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
              :colspan="Math.max(renderColumns.length, 1)"
              :style="{ height: `${table.virtualPaddingBottom.value}px` }"
            />
          </tr>
          <tr v-if="!table.totalRows.value">
            <td :colspan="Math.max(renderColumns.length, 1)" class="ioi-table__empty">
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
  table-layout: fixed;
  font-size: 14px;
  line-height: 1.4;
}

.ioi-table__table th,
.ioi-table__table td {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #eceff4;
  text-align: left;
  background-clip: padding-box;
}

.ioi-table__table th {
  background: #f7f9fc;
  font-weight: 600;
  user-select: none;
}

.ioi-table__header-content {
  display: flex;
  align-items: center;
  min-height: 100%;
  padding-right: 8px;
}

.ioi-table__header-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ioi-table__resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 8px;
  height: 100%;
  border: 0;
  background: transparent;
  cursor: col-resize;
  z-index: 5;
}

.ioi-table__resize-handle::after {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: #c4cfde;
  opacity: 0;
  transition: opacity 120ms ease;
}

.ioi-table__table th:hover .ioi-table__resize-handle::after,
.ioi-table__resize-handle:focus-visible::after {
  opacity: 1;
}

.ioi-table__resize-handle--disabled {
  cursor: default;
}

.ioi-table__resize-handle--disabled::after {
  opacity: 0;
}

.ioi-table__header--dragging {
  opacity: 0.65;
}

.ioi-table__header--drag-target {
  background: #e9f2ff;
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
