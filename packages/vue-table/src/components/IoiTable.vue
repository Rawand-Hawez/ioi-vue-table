<script setup lang="ts" generic="TRow extends Record<string, unknown>">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useColumnState } from '../composables/useColumnState';
import { createKeyboardNavigation } from '../composables/ioiTable/keyboard';
import { useIoiTable } from '../composables/useIoiTable';
import type {
  CellSlotProps,
  ColumnDef,
  HeaderFilterSlotProps,
  HeaderSlotProps,
  IoiPaginationChangePayload,
  IoiSemanticEvent,
  IoiTableOptions,
  RowClickPayload
} from '../types';
import { get as getNestedPathValue } from '../utils/nestedPath';
import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
  normalizePositiveNumber
} from '../utils/number';

const props = withDefaults(
  defineProps<{
    rows?: TRow[];
    columns?: ColumnDef<TRow>[];
    rowKey?: IoiTableOptions<TRow>['rowKey'];
    rowHeight?: number;
    overscan?: number;
    height?: number;
    pageIndex?: number;
    pageSize?: number;
    globalSearchDebounceMs?: number;
    filterDebounceMs?: number;
    csvPreviewRowLimit?: number;
    csvMaxRows?: number;
    csvMaxSizeBytes?: number;
    expandable?: boolean;
    rowExpandable?: IoiTableOptions<TRow>['rowExpandable'];
    expandedRowKeys?: Array<string | number>;
    groupBy?: string | string[];
    groupAggregations?: Record<string, import('../types').AggregationType[]>;
    expandedGroupKeys?: Array<string>;
    ariaLabel?: string;
    dataMode?: 'client' | 'server';
    serverOptions?: IoiTableOptions<TRow>['serverOptions'];
    rowClass?: string | Record<string, boolean> | ((row: TRow, rowIndex: number) => string | Record<string, boolean> | undefined);
  }>(),
  {
    rows: () => [],
    columns: () => [],
    rowHeight: 36,
    overscan: 5,
    height: 320,
    globalSearchDebounceMs: 0,
    filterDebounceMs: 0,
    csvPreviewRowLimit: 200,
    csvMaxRows: undefined,
    csvMaxSizeBytes: undefined,
    expandable: false,
    expandedRowKeys: undefined,
    groupBy: undefined,
    groupAggregations: undefined,
    expandedGroupKeys: undefined,
    ariaLabel: 'Data table',
    dataMode: undefined,
    serverOptions: undefined
  }
);

const emit = defineEmits<{
  'row-click': [payload: RowClickPayload<TRow>];
  'state-change': [event: IoiSemanticEvent<unknown>];
  'update:pageIndex': [value: number];
  'update:pageSize': [value: number];
  'pagination-change': [payload: IoiPaginationChangePayload];
  'update:expandedRowKeys': [value: Array<string | number>];
  'row-expand': [payload: { row: TRow; rowIndex: number; rowKey: string | number; expanded: boolean }];
  'update:expandedGroupKeys': [value: Array<string>];
  'group-expand': [payload: { groupKey: string; groupValue: unknown; expanded: boolean; rowCount: number }];
}>();

defineSlots<{
  header?: (slotProps: HeaderSlotProps<TRow>) => unknown;
  'header-filter'?: (slotProps: HeaderFilterSlotProps<TRow>) => unknown;
  cell?: (slotProps: CellSlotProps<TRow>) => unknown;
  'expanded-row'?: (slotProps: { row: TRow; rowIndex: number }) => unknown;
  'group-header'?: (slotProps: import('../types').GroupHeaderSlotProps) => unknown;
  empty?: () => unknown;
  loading?: () => unknown;
  error?: (slotProps: { error: string | null }) => unknown;
}>();

const DEFAULT_HEIGHT = 320;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_OVERSCAN = 5;

function buildPaginationEventKey(
  pageIndex: number,
  pageSize: number,
  pageCount: number,
  rowCount: number
): string {
  return `${pageIndex}:${pageSize}:${pageCount}:${rowCount}`;
}

const normalizedHeight = computed(() => normalizePositiveNumber(props.height, DEFAULT_HEIGHT));
const normalizedRowHeight = computed(() => normalizePositiveNumber(props.rowHeight, DEFAULT_ROW_HEIGHT));
const normalizedOverscan = computed(() =>
  normalizeNonNegativeInteger(props.overscan, DEFAULT_OVERSCAN)
);
const normalizedPageIndex = computed(() => normalizeNonNegativeInteger(props.pageIndex, 0));
const normalizedPageSize = computed(() => Math.floor(normalizePositiveNumber(props.pageSize, 0)));
const normalizedGlobalSearchDebounceMs = computed(() =>
  normalizeNonNegativeInteger(props.globalSearchDebounceMs, 0)
);
const normalizedFilterDebounceMs = computed(() =>
  normalizeNonNegativeInteger(props.filterDebounceMs, 0)
);
const normalizedCsvPreviewRowLimit = computed(() =>
  normalizePositiveInteger(props.csvPreviewRowLimit, 200)
);
const lastPaginationEventKey = ref('');

const table = useIoiTable<TRow>(
  computed(() => ({
    rows: props.rows,
    columns: props.columns,
    rowKey: props.rowKey,
    rowHeight: normalizedRowHeight.value,
    overscan: normalizedOverscan.value,
    viewportHeight: normalizedHeight.value,
    globalSearchDebounceMs: normalizedGlobalSearchDebounceMs.value,
    filterDebounceMs: normalizedFilterDebounceMs.value,
    defaultCsvPreviewRowLimit: normalizedCsvPreviewRowLimit.value,
    csvMaxRows: props.csvMaxRows,
    csvMaxSizeBytes: props.csvMaxSizeBytes,
    expandable: props.expandable,
    rowExpandable: props.rowExpandable,
    expandedRowKeys: props.expandedRowKeys,
    groupBy: props.groupBy,
    groupAggregations: props.groupAggregations,
    expandedGroupKeys: props.expandedGroupKeys,
    dataMode: props.dataMode,
    serverOptions: props.serverOptions,
    pagination:
      normalizedPageSize.value > 0
        ? { pageIndex: normalizedPageIndex.value, pageSize: normalizedPageSize.value }
        : undefined,
    onPaginationChange: (payload) => {
      emit('update:pageIndex', payload.pageIndex);
      emit('update:pageSize', payload.pageSize);
      emit('pagination-change', payload);
      lastPaginationEventKey.value = buildPaginationEventKey(
        payload.pageIndex,
        payload.pageSize,
        payload.pageCount,
        payload.rowCount
      );
    },
    onRowExpand: (payload) => {
      emit('row-expand', payload);
      emit('update:expandedRowKeys', table.state.value.expandedRowKeys);
    },
    onGroupExpand: (payload) => {
      emit('group-expand', payload);
      emit('update:expandedGroupKeys', table.state.value.expandedGroupKeys);
    }
  }))
);

const viewportRef = ref<HTMLDivElement | null>(null);
const tableBodyRef = ref<HTMLTableSectionElement | null>(null);
const viewportStyle = computed<Record<string, string>>(() => {
  if (table.paginationEnabled.value) {
    return {
      overflowX: 'auto',
      overflowY: 'visible',
      maxHeight: 'none'
    };
  }

  return {
    maxHeight: `${normalizedHeight.value}px`,
    overflowX: 'auto',
    overflowY: 'auto'
  };
});
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
const bodyColspan = computed(() => Math.max(renderColumns.value.length + (props.expandable ? 1 : 0), 1));
const renderEntries = computed(() => table.renderEntries.value);

const headerFacetOptionsByField = computed(() => {
  const optionsByField = new Map<string, string[]>();

  for (let index = 0; index < renderColumns.value.length; index += 1) {
    const column = renderColumns.value[index];
    if (!column || column.headerFilter !== 'select') {
      continue;
    }

    const fieldKey = resolveHeaderFilterFieldKey(column);
    if (optionsByField.has(fieldKey)) {
      continue;
    }

    optionsByField.set(fieldKey, table.getColumnFacetOptions(fieldKey));
  }

  return optionsByField;
});
const selectionEnabled = computed(() => props.rowKey !== undefined && props.rowKey !== null);
const hasHeaderFilterRow = computed(() => renderColumns.value.some((column) => column.headerFilter));

function isColumnEditable(column: ColumnDef<TRow>): boolean {
  if (column.editable === false || column.hidden) {
    return false;
  }
  return true;
}

function isLastPinnedLeftColumn(column: ColumnDef<TRow>): boolean {
  if (column.pin !== 'left') {
    return false;
  }
  const leftCols = pinnedLeftColumns.value;
  const columnId = resolveColumnId(column);
  return leftCols.length > 0 && resolveColumnId(leftCols[leftCols.length - 1]!) === columnId;
}

function isFirstPinnedRightColumn(column: ColumnDef<TRow>): boolean {
  if (column.pin !== 'right') {
    return false;
  }
  const rightCols = pinnedRightColumns.value;
  const columnId = resolveColumnId(column);
  return rightCols.length > 0 && resolveColumnId(rightCols[0]!) === columnId;
}

const announcement = ref('');
const liveRegionMessage = computed(() => {
  const event = table.lastEvent.value;
  if (!event && !announcement.value) {
    return '';
  }

  if (announcement.value) {
    return announcement.value;
  }

  if (event?.type === 'data:filter') {
    const payload = event.payload as { filters?: unknown[]; globalSearch?: string };
    const filterCount = payload.filters?.length ?? 0;
    const hasSearch = (payload.globalSearch?.length ?? 0) > 0;
    if (filterCount === 0 && !hasSearch) {
      return 'All filters cleared.';
    }
    return `Filters updated. ${table.sortedIndices.value.length} rows shown.`;
  }

  if (event?.type === 'data:sort') {
    const payload = event.payload as { sort?: Array<{ field: string; direction: string }> };
    const sortEntry = payload.sort?.[0];
    if (sortEntry) {
      return `Sorted by ${sortEntry.field}, ${sortEntry.direction === 'asc' ? 'ascending' : 'descending'}.`;
    }
    return 'Sorting cleared.';
  }

  if (event?.type === 'data:select') {
    const payload = event.payload as { selectedRowKeys?: unknown[] };
    const count = payload.selectedRowKeys?.length ?? 0;
    if (count === 0) {
      return 'Selection cleared.';
    }
    return `${count} row${count === 1 ? '' : 's'} selected.`;
  }

  if (event?.type === 'data:modify') {
    return 'Data updated.';
  }

  if (event?.type === 'data:extract') {
    const reason = (event.payload as { reason?: string } | undefined)?.reason;
    if (reason === 'parseCSVError') {
      return 'CSV parsing failed.';
    }
    if (reason === 'parseCSV') {
      return 'CSV parsed.';
    }
    if (reason === 'exportCSV') {
      return 'CSV exported.';
    }
  }

  if (table.loading.value) {
    return 'Loading data...';
  }

  if (table.error.value) {
    return `Error loading data: ${table.error.value}`;
  }

  return '';
});

function announce(message: string): void {
  announcement.value = '';
  nextTick(() => {
    announcement.value = message;
  });
}

function moveFocusToRow(rowIndex: number, columnIndex?: number): void {
  nextTick(() => {
    const selector = columnIndex !== undefined
      ? `tr.ioi-table__row[data-row-index="${rowIndex}"] td[data-col-index="${columnIndex}"]`
      : `tr.ioi-table__row[data-row-index="${rowIndex}"]`;
    const element = viewportRef.value?.querySelector(selector as string) as HTMLElement | null;
    element?.focus();
  });
}

const keyboard = createKeyboardNavigation<TRow>({
  state: table.state,
  api: table,
  columns: renderColumns,
  rowCount: table.totalRows,
  pageSize: table.pageSize,
  paginationEnabled: table.paginationEnabled,
  onFocusChange: moveFocusToRow,
  onAnnounce: announce
});

const focusedRowIndex = keyboard.focusedRowIndex;
const focusedColumnIndex = keyboard.focusedColumnIndex;
const isCellNavigationMode = keyboard.isCellNavigationMode;

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
const dragOverDirection = ref<'left' | 'right' | null>(null);

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
  [
    () => table.paginationEnabled.value,
    () => table.pageIndex.value,
    () => table.pageSize.value,
    () => table.pageCount.value,
    () => table.totalRows.value
  ],
  ([enabled, nextPageIndex, nextPageSize, nextPageCount, nextRowCount]) => {
    if (!enabled) {
      lastPaginationEventKey.value = '';
      return;
    }

    const nextKey = buildPaginationEventKey(
      nextPageIndex,
      nextPageSize,
      nextPageCount,
      nextRowCount
    );
    if (nextKey === lastPaginationEventKey.value) {
      return;
    }

    lastPaginationEventKey.value = nextKey;
    emit('pagination-change', {
      pageIndex: nextPageIndex,
      pageSize: nextPageSize,
      pageCount: nextPageCount,
      rowCount: nextRowCount,
      reason: 'meta'
    });
  },
  { immediate: true }
);

watch(
  normalizedHeight,
  (nextHeight) => {
    table.setViewport(table.state.value.viewport.scrollTop, nextHeight);
  }
);

onMounted(() => {
  if (!viewportRef.value) {
    return;
  }

  table.setViewport(
    viewportRef.value.scrollTop,
    viewportRef.value.clientHeight || normalizedHeight.value
  );
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
    dragOverDirection.value = null;
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  dragTargetColumnId.value = resolveColumnId(column);

  const targetElement = event.currentTarget as HTMLElement | null;
  if (targetElement && typeof event.clientX === 'number') {
    const rect = targetElement.getBoundingClientRect();
    if (rect.width > 0) {
      const midX = rect.left + rect.width / 2;
      dragOverDirection.value = event.clientX < midX ? 'left' : 'right';
    }
  }
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

  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = dragOverDirection.value === 'right' ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  nextOrder.splice(insertIndex, 0, sourceEntry);
  columnState.setColumnOrder(nextOrder);
}

function onHeaderDragEnd(): void {
  draggingColumnId.value = null;
  draggingPinGroup.value = null;
  dragTargetColumnId.value = null;
  dragOverDirection.value = null;
}

function getColumnStyle(
  column: ColumnDef<TRow>,
  section: 'header' | 'body' = 'body',
  isFilterCell = false
): Record<string, string> {
  const width = normalizeColumnWidth(column.width);
  const columnId = column.id ?? String(column.field);
  const style: Record<string, string> = {
    width: width ?? '',
    minWidth: column.minWidth ? `${column.minWidth}px` : '',
    maxWidth: column.maxWidth ? `${column.maxWidth}px` : ''
  };

  if (section === 'header' && !isFilterCell) {
    style.position = 'sticky';
    style.top = '0';
    style.zIndex = '3';
  }

  if (column.pin === 'left') {
    style.position = 'sticky';
    style.left = `${leftStickyOffsets.value.get(columnId) ?? 0}px`;
    style.zIndex = section === 'header' ? '4' : '2';
  } else if (column.pin === 'right') {
    style.position = 'sticky';
    style.right = `${rightStickyOffsets.value.get(columnId) ?? 0}px`;
    style.zIndex = section === 'header' ? '4' : '2';
  }

  return style;
}

function getResizeHandleStyle(column: ColumnDef<TRow>): Record<string, string> {
  const disabled = !isColumnResizable(column);

  return {
    position: 'absolute',
    top: '0',
    right: '-2px',
    width: '8px',
    height: '100%',
    padding: '0',
    border: '0',
    background: 'transparent',
    cursor: disabled ? 'default' : 'col-resize'
  };
}

function getCellValue(row: TRow, field: string): unknown {
  return getNestedPathValue(row, field);
}

function resolveRowSelectionKey(row: TRow, index: number): string | number | null {
  const { rowKey } = props;

  if (typeof rowKey === 'function') {
    const value = rowKey(row, index);
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  if (rowKey !== undefined && rowKey !== null) {
    const value = getNestedPathValue(row, String(rowKey));
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  return null;
}

function isRowSelected(row: TRow, rowIndex: number): boolean {
  if (!selectionEnabled.value) {
    return false;
  }

  const rowKey = resolveRowSelectionKey(row, rowIndex);
  if (rowKey === null) {
    return false;
  }

  return table.isSelected(rowKey);
}

function isRowEditing(row: TRow, rowIndex: number): boolean {
  const editingCell = table.state.value.editingCell;
  if (!editingCell) {
    return false;
  }

  if (editingCell.rowIndex !== undefined && editingCell.rowIndex !== null) {
    return editingCell.rowIndex === rowIndex;
  }

  if (editingCell.rowKey !== undefined && editingCell.rowKey !== null) {
    const rowKey = resolveRowSelectionKey(row, rowIndex);
    return rowKey !== null && rowKey === editingCell.rowKey;
  }

  return false;
}

function isEditingCell(row: TRow, rowIndex: number, column: ColumnDef<TRow>): boolean {
  const editingCell = table.state.value.editingCell;
  if (!editingCell || editingCell.field !== String(column.field)) {
    return false;
  }

  return isRowEditing(row, rowIndex);
}

function isRowExpandable(row: TRow, rowIndex: number): boolean {
  if (!props.expandable) {
    return false;
  }

  if (props.rowExpandable) {
    return props.rowExpandable(row, rowIndex);
  }

  return true;
}

function isRowExpanded(row: TRow, rowIndex: number): boolean {
  if (!props.expandable) {
    return false;
  }

  const rowKey = resolveRowSelectionKey(row, rowIndex);
  const expansionKey = rowKey ?? rowIndex;

  return table.isRowExpanded(expansionKey);
}

function toggleRowExpansion(row: TRow, rowIndex: number): void {
  const rowKey = resolveRowSelectionKey(row, rowIndex);
  const expansionKey = rowKey ?? rowIndex;

  table.toggleRowExpansion(expansionKey);
}

function isGroupExpanded(groupKey: string): boolean {
  return table.isGroupExpanded(groupKey);
}

function toggleGroupExpansion(groupKey: string): void {
  table.toggleGroupExpansion(groupKey);
}

function getRowClass(row: TRow, rowIndex: number): string | Record<string, boolean> | undefined {
  if (!props.rowClass) {
    return undefined;
  }

  if (typeof props.rowClass === 'function') {
    return props.rowClass(row, rowIndex);
  }

  return props.rowClass;
}

function getRenderEntryKey(entry: (typeof renderEntries.value)[number]): string {
  return entry.renderKey;
}

function getSortDirection(column: ColumnDef<TRow>): 'asc' | 'desc' | null {
  const field = String(column.field);
  const columnId = String(column.id ?? '');
  const activeSort = table.state.value.sort.find(
    (entry) => entry.field === field || (columnId.length > 0 && entry.field === columnId)
  );

  if (!activeSort) {
    return null;
  }

  return activeSort.direction;
}

function getHeaderAriaSort(column: ColumnDef<TRow>): 'ascending' | 'descending' | 'none' {
  const direction = getSortDirection(column);
  if (direction === 'asc') {
    return 'ascending';
  }
  if (direction === 'desc') {
    return 'descending';
  }

  return 'none';
}

function onRowClick(row: TRow, rowIndex: number): void {
  emit('row-click', { row, rowIndex });
}

function onRowKeydown(event: KeyboardEvent, row: TRow, rowIndex: number): void {
  const handled = keyboard.handleKeyDown(event);
  if (handled) {
    return;
  }

  const key = event.key;
  
  if (key === 'Enter' || key === ' ') {
    if (props.expandable && isRowExpandable(row, rowIndex)) {
      event.preventDefault();
      toggleRowExpansion(row, rowIndex);
      announce(isRowExpanded(row, rowIndex) ? 'Row expanded' : 'Row collapsed');
      return;
    }

    const rowKey = resolveRowSelectionKey(row, rowIndex);
    if (rowKey === null) {
      return;
    }

    if (selectionEnabled.value) {
      event.preventDefault();
      table.toggleRow(rowKey, { shiftKey: event.shiftKey });
      return;
    }
  }

  if (key !== 'ArrowDown' && key !== 'ArrowUp') {
    return;
  }

  event.preventDefault();

  const currentRowElement = event.currentTarget as HTMLTableRowElement;
  const renderedRows = Array.from(
    currentRowElement.parentElement?.querySelectorAll<HTMLTableRowElement>('tr.ioi-table__row') ?? []
  );
  const currentIndex = renderedRows.indexOf(currentRowElement);
  if (currentIndex === -1) {
    return;
  }

  const offset = key === 'ArrowDown' ? 1 : -1;
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), renderedRows.length - 1);
  const nextRow = renderedRows[nextIndex];
  if (nextRow) {
    nextRow.focus();
    const entry = renderEntries.value[nextIndex];
    if (entry?.type === 'row' && entry.rowIndex !== undefined) {
      keyboard.setFocusedRow(entry.rowIndex);
    }
  }
}

function focusRow(rowIndex: number): void {
  nextTick(() => {
    const rowElement = viewportRef.value?.querySelector(
      `tr.ioi-table__row[data-row-index="${rowIndex}"]`
    ) as HTMLTableRowElement | null;
    rowElement?.focus();
    keyboard.setFocusedRow(rowIndex);
  });
}

function isRowFocused(rowIndex: number): boolean {
  return focusedRowIndex.value === rowIndex;
}

function isCellFocused(rowIndex: number, columnIndex: number): boolean {
  return isCellNavigationMode.value && focusedRowIndex.value === rowIndex && focusedColumnIndex.value === columnIndex;
}

function getAriaRowIndex(entry: { type: string; rowIndex?: number }, offset: number = 0): number {
  if (entry.type === 'row' && entry.rowIndex !== undefined) {
    return entry.rowIndex + 1 + offset;
  }
  return 1;
}

function onScroll(event: Event): void {
  const target = event.target as HTMLDivElement;
  table.setViewport(target.scrollTop, target.clientHeight || normalizedHeight.value);
}

function resolveHeaderFilterFieldKey(column: ColumnDef<TRow>): string {
  return String(column.field);
}

function getHeaderFilterValue(column: ColumnDef<TRow>): string {
  const fieldKey = resolveHeaderFilterFieldKey(column);
  const filterState =
    table.state.value.filters.find((entry) => entry.field === fieldKey) ??
    table.state.value.filters.find((entry) => entry.field === String(column.id));

  if (!filterState) {
    return '';
  }

  const filter = filterState.filter;
  if (filter.type !== 'text') {
    return '';
  }

  return filter.value;
}

function clearHeaderFilter(column: ColumnDef<TRow>): void {
  const fieldKey = resolveHeaderFilterFieldKey(column);
  table.clearColumnFilter(fieldKey);

  const columnId = String(column.id);
  if (columnId !== fieldKey) {
    table.clearColumnFilter(columnId);
  }
}

function getHeaderFacetOptions(column: ColumnDef<TRow>): string[] {
  const fieldKey = resolveHeaderFilterFieldKey(column);
  return headerFacetOptionsByField.value.get(fieldKey) ?? [];
}

function setHeaderFilterValue(column: ColumnDef<TRow>, nextValue: string): void {
  const fieldKey = resolveHeaderFilterFieldKey(column);
  const value = nextValue ?? '';

  if (value.trim().length === 0) {
    clearHeaderFilter(column);
    return;
  }

  const columnId = String(column.id);
  if (columnId !== fieldKey) {
    table.clearColumnFilter(columnId);
  }

  if (column.headerFilter === 'select') {
    table.setColumnFilter(fieldKey, {
      type: 'text',
      operator: 'equals',
      value,
      caseSensitive: false
    });
    return;
  }

  table.setColumnFilter(fieldKey, {
    type: 'text',
    operator: 'contains',
    value,
    caseSensitive: false
  });
}

interface AutoSizeOptions {
  includeHeaders?: boolean;
  padding?: number;
  minWidth?: number;
  maxWidth?: number;
}

function autoSizeColumns(columnIds?: string[], options: AutoSizeOptions = {}): void {
  const {
    includeHeaders = true,
    padding = 16,
    minWidth = 50,
    maxWidth = 500
  } = options;

  if (!tableBodyRef.value) {
    return;
  }

  const targetColumnIds = columnIds ?? renderColumns.value.map((col) => col.id);
  const columnWidths = new Map<string, number>();

  for (const colId of targetColumnIds) {
    columnWidths.set(colId, minWidth);
  }

  if (includeHeaders) {
    const headerCells = viewportRef.value?.querySelectorAll('.ioi-table__header');
    if (headerCells) {
      headerCells.forEach((headerCell) => {
        const columnId = headerCell.getAttribute('data-column-id');
        if (columnId && columnWidths.has(columnId)) {
          const currentWidth = columnWidths.get(columnId) ?? minWidth;
          const measuredWidth = (headerCell as HTMLElement).scrollWidth + padding;
          columnWidths.set(columnId, Math.max(currentWidth, measuredWidth));
        }
      });
    }
  }

  const bodyRows = tableBodyRef.value.querySelectorAll('tr[data-row-index]');
  bodyRows.forEach((row) => {
    const cells = row.querySelectorAll('td[data-col-index]');
    cells.forEach((cell) => {
      const colIndex = cell.getAttribute('data-col-index');
      if (colIndex === null) {
        return;
      }
      const column = renderColumns.value[parseInt(colIndex, 10)];
      if (!column || !columnWidths.has(column.id)) {
        return;
      }
      const currentWidth = columnWidths.get(column.id) ?? minWidth;
      const measuredWidth = (cell as HTMLElement).scrollWidth + padding;
      columnWidths.set(column.id, Math.max(currentWidth, measuredWidth));
    });
  });

  for (const [colId, width] of columnWidths) {
    const column = renderColumns.value.find((col) => col.id === colId);
    if (!column) {
      continue;
    }

    const columnMinWidth = column.minWidth ?? minWidth;
    const columnMaxWidth = column.maxWidth ?? maxWidth;
    const finalWidth = Math.max(columnMinWidth, Math.min(columnMaxWidth, width));

    columnState.setColumnSizing(colId, { width: finalWidth });
  }
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
  setPageIndex: table.setPageIndex,
  setPageSize: table.setPageSize,
  getColumnFacetOptions: table.getColumnFacetOptions,
  setSortState: table.setSortState,
  toggleSort: table.toggleSort,
  toggleRow: table.toggleRow,
  isSelected: table.isSelected,
  clearSelection: table.clearSelection,
  selectAll: table.selectAll,
  getSelectedKeys: table.getSelectedKeys,
  toggleRowExpansion: table.toggleRowExpansion,
  expandAllRows: table.expandAllRows,
  collapseAllRows: table.collapseAllRows,
  isRowExpanded: table.isRowExpanded,
  toggleGroupExpansion: table.toggleGroupExpansion,
  expandAllGroups: table.expandAllGroups,
  collapseAllGroups: table.collapseAllGroups,
  isGroupExpanded: table.isGroupExpanded,
  startEdit: table.startEdit,
  setEditDraft: table.setEditDraft,
  commitEdit: table.commitEdit,
  cancelEdit: table.cancelEdit,
  setColumnOrder: columnState.setColumnOrder,
  setColumnVisibility: columnState.setColumnVisibility,
  setColumnPin: columnState.setColumnPin,
  setColumnSizing: columnState.setColumnSizing,
  getColumnStateSnapshot: columnState.getSnapshot,
  autoSizeColumns,
  focusRow,
  focusedRowIndex,
  focusedColumnIndex,
  isCellNavigationMode,
  refresh: table.refresh,
  fetchMore: table.fetchMore,
  loading: table.loading,
  error: table.error,
  hasMore: table.hasMore,
});
</script>

<template>
  <div 
    class="ioi-table" 
    role="grid"
    :aria-label="ariaLabel"
    :aria-rowcount="table.totalRows.value"
    :aria-colcount="renderColumns.length + (expandable ? 1 : 0)"
    @keydown="keyboard.handleKeyDown"
  >
    <div class="ioi-table__sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveRegionMessage }}</div>
    <div
      ref="viewportRef"
      class="ioi-table__viewport"
      role="region"
      :aria-label="ariaLabel + ' viewport'"
      :style="viewportStyle"
      @scroll="onScroll"
    >
      <table class="ioi-table__table">
        <thead role="rowgroup">
          <tr role="row">
            <th
              v-for="(column, columnIndex) in renderColumns"
              :key="column.id"
              role="columnheader"
              :class="{
                'ioi-table__header--dragging': draggingColumnId === column.id,
                'ioi-table__header--drag-target': dragTargetColumnId === column.id,
                'ioi-table__header--drag-over-left': dragTargetColumnId === column.id && dragOverDirection === 'left',
                'ioi-table__header--drag-over-right': dragTargetColumnId === column.id && dragOverDirection === 'right',
                'ioi-table__header--sorted-asc': getSortDirection(column) === 'asc',
                'ioi-table__header--sorted-desc': getSortDirection(column) === 'desc',
                'ioi-table__header--pinned-left-edge': isLastPinnedLeftColumn(column),
                'ioi-table__header--pinned-right-edge': isFirstPinnedRightColumn(column)
              }"
              :data-column-id="column.id"
              :aria-colindex="columnIndex + 1 + (expandable ? 1 : 0)"
              :draggable="true"
              :style="getColumnStyle(column, 'header')"
              :aria-sort="getHeaderAriaSort(column)"
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
                :style="getResizeHandleStyle(column)"
                @mousedown="onResizeHandleMouseDown($event, column)"
              />
            </th>
          </tr>
          <tr v-if="hasHeaderFilterRow" role="row" class="ioi-table__filter-row">
            <th
              v-for="(column, columnIndex) in renderColumns"
              :key="`filter-${column.id}`"
              role="columnheader"
              class="ioi-table__filter-cell"
              :class="{
                'ioi-table__filter-cell--pinned-left-edge': isLastPinnedLeftColumn(column),
                'ioi-table__filter-cell--pinned-right-edge': isFirstPinnedRightColumn(column)
              }"
              :aria-colindex="columnIndex + 1 + (expandable ? 1 : 0)"
              :style="getColumnStyle(column, 'header', true)"
            >
              <div v-if="column.headerFilter" class="ioi-table__header-filter">
                <slot
                  name="header-filter"
                  :column="column"
                  :column-index="columnIndex"
                  :mode="column.headerFilter"
                  :value="getHeaderFilterValue(column)"
                  :options="column.headerFilter === 'select' ? getHeaderFacetOptions(column) : undefined"
                  :set-value="(value) => setHeaderFilterValue(column, value)"
                  :clear="() => clearHeaderFilter(column)"
                >
                  <input
                    v-if="column.headerFilter === 'text'"
                    class="ioi-table__filter-input"
                    draggable="false"
                    type="text"
                    :value="getHeaderFilterValue(column)"
                    @mousedown.stop
                    @click.stop
                    @input="setHeaderFilterValue(column, ($event.target as HTMLInputElement).value)"
                  >
                  <select
                    v-else
                    class="ioi-table__filter-select"
                    draggable="false"
                    :value="getHeaderFilterValue(column)"
                    @mousedown.stop
                    @click.stop
                    @change="setHeaderFilterValue(column, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">All</option>
                    <option
                      v-for="option in getHeaderFacetOptions(column)"
                      :key="option"
                      :value="option"
                    >
                      {{ option }}
                    </option>
                  </select>
                </slot>
              </div>
            </th>
          </tr>
        </thead>
        <tbody ref="tableBodyRef" role="rowgroup">
          <tr
            v-if="table.virtualPaddingTop.value > 0"
            class="ioi-table__spacer"
            role="presentation"
            aria-hidden="true"
          >
            <td
              :colspan="bodyColspan"
              :style="{ height: `${table.virtualPaddingTop.value}px`, padding: '0', border: '0' }"
            />
          </tr>
          <template v-for="(entry, entryIndex) in renderEntries" :key="getRenderEntryKey(entry)">
            <tr
              v-if="entry.type === 'group'"
              role="row"
              class="ioi-table__group-header"
              :aria-rowindex="entryIndex + 1"
            >
              <td role="gridcell" :colspan="bodyColspan">
                <slot
                  name="group-header"
                  :group="entry.group"
                  :expanded="isGroupExpanded(entry.group.key)"
                  :toggle="() => toggleGroupExpansion(entry.group.key)"
                >
                  <button
                    type="button"
                    class="ioi-table__group-toggle"
                    :aria-label="isGroupExpanded(entry.group.key) ? 'Collapse group' : 'Expand group'"
                    :aria-expanded="isGroupExpanded(entry.group.key)"
                    @click.stop="toggleGroupExpansion(entry.group.key)"
                  >
                    {{ isGroupExpanded(entry.group.key) ? '▼' : '▶' }}
                  </button>
                  <span class="ioi-table__group-value">{{ entry.group.value }}</span>
                  <span class="ioi-table__group-count">({{ entry.group.count }})</span>
                </slot>
              </td>
            </tr>
            <tr
              v-else
              role="row"
              :class="[
                {
                  'ioi-table__row': true,
                  'ioi-table__row--selected': isRowSelected(entry.row, entry.rowIndex),
                  'ioi-table__row--editing': isRowEditing(entry.row, entry.rowIndex),
                  'ioi-table__row--expanded': isRowExpanded(entry.row, entry.rowIndex),
                  'ioi-table__row--focused': isRowFocused(entry.rowIndex)
                },
                getRowClass(entry.row, entry.rowIndex)
              ]"
              :data-row-index="entry.rowIndex"
              :aria-rowindex="getAriaRowIndex(entry)"
              :style="{ height: `${normalizedRowHeight}px` }"
              :aria-selected="selectionEnabled ? isRowSelected(entry.row, entry.rowIndex) : undefined"
              :aria-expanded="expandable && isRowExpandable(entry.row, entry.rowIndex) ? isRowExpanded(entry.row, entry.rowIndex) : undefined"
              tabindex="0"
              @click="onRowClick(entry.row, entry.rowIndex)"
              @keydown="onRowKeydown($event, entry.row, entry.rowIndex)"
            >
              <td
                v-if="expandable"
                role="gridcell"
                class="ioi-table__cell ioi-table__cell--expand"
                :aria-colindex="1"
                :style="{ width: '40px', textAlign: 'center' }"
              >
                <button
                  v-if="isRowExpandable(entry.row, entry.rowIndex)"
                  type="button"
                  class="ioi-table__expand-icon"
                  :aria-label="isRowExpanded(entry.row, entry.rowIndex) ? 'Collapse row' : 'Expand row'"
                  :aria-expanded="isRowExpanded(entry.row, entry.rowIndex)"
                  @click.stop="toggleRowExpansion(entry.row, entry.rowIndex)"
                >
                  {{ isRowExpanded(entry.row, entry.rowIndex) ? '▼' : '▶' }}
                </button>
              </td>
              <td
                v-for="(column, columnIndex) in renderColumns"
                :key="column.id"
                role="gridcell"
                :aria-colindex="columnIndex + 1 + (expandable ? 1 : 0)"
                :class="{
                  'ioi-table__cell': true,
                  'ioi-table__cell--editing': isEditingCell(entry.row, entry.rowIndex, column),
                  'ioi-table__cell--focused': isCellFocused(entry.rowIndex, columnIndex),
                  'ioi-table__cell--editable': isColumnEditable(column),
                  'ioi-table__cell--pinned-left-edge': isLastPinnedLeftColumn(column),
                  'ioi-table__cell--pinned-right-edge': isFirstPinnedRightColumn(column)
                }"
                :data-col-index="columnIndex"
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
              v-if="entry.type === 'row' && isRowExpanded(entry.row, entry.rowIndex)"
              :key="`expanded-${entry.renderKey}`"
              role="row"
              class="ioi-table__expanded-row"
              :data-row-index="entry.rowIndex"
              :aria-rowindex="getAriaRowIndex(entry, 1)"
            >
              <td
                role="gridcell"
                :colspan="bodyColspan"
                class="ioi-table__expanded-content"
              >
                <slot
                  name="expanded-row"
                  :row="entry.row"
                  :row-index="entry.rowIndex"
                />
              </td>
            </tr>
          </template>
          <tr
            v-if="table.virtualPaddingBottom.value > 0"
            class="ioi-table__spacer"
            role="presentation"
            aria-hidden="true"
          >
            <td
              :colspan="bodyColspan"
              :style="{ height: `${table.virtualPaddingBottom.value}px`, padding: '0', border: '0' }"
            />
          </tr>
          <tr v-if="!table.totalRows.value" role="row">
            <td role="gridcell" :colspan="bodyColspan" class="ioi-table__empty">
              <slot name="empty">No data</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="table.loading.value" class="ioi-table__loading-overlay">
      <slot name="loading">Loading...</slot>
    </div>
    <div v-if="table.error.value" class="ioi-table__error-overlay">
      <slot name="error" :error="table.error.value">
        {{ table.error.value }}
      </slot>
    </div>
  </div>
</template>
