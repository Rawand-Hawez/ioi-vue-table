import { computed, ref, shallowRef, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';
import type {
  ColumnDef,
  ExportCsvOptions,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  VirtualRange
} from '../types';

const SCHEMA_VERSION = 1 as const;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_VIEWPORT_HEIGHT = 320;

function createInitialState(viewportHeight: number): IoiTableState {
  return {
    sort: [],
    filters: [],
    selectedRowKeys: [],
    editingCell: null,
    viewport: {
      scrollTop: 0,
      viewportHeight
    }
  };
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toIndexArray(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start) }, (_, offset) => start + offset);
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function getFieldValue<TRow>(row: TRow, field: string): unknown {
  if (!row || typeof row !== 'object') {
    return undefined;
  }

  return (row as Record<string, unknown>)[field];
}

export function useIoiTable<TRow = Record<string, unknown>>(
  options: MaybeRef<IoiTableOptions<TRow>> = {}
): IoiTableApi<TRow> {
  const resolvedOptions = computed(() => unref(options));
  const normalizedRows = shallowRef<TRow[]>([]);
  const normalizedColumns = shallowRef<ColumnDef<TRow>[]>([]);

  const rowHeight = ref(DEFAULT_ROW_HEIGHT);
  const overscan = ref(DEFAULT_OVERSCAN);
  const state = ref<IoiTableState>(createInitialState(DEFAULT_VIEWPORT_HEIGHT));
  const lastEvent = ref<IoiSemanticEvent<unknown> | null>(null);

  const totalRows = computed(() => normalizedRows.value.length);
  const totalHeight = computed(() => totalRows.value * rowHeight.value);

  const virtualRange = computed<VirtualRange>(() => {
    if (totalRows.value === 0) {
      return { start: 0, end: 0 };
    }

    const viewportHeight = state.value.viewport.viewportHeight;
    const visibleCount = Math.max(1, Math.ceil(viewportHeight / rowHeight.value));
    const start = clamp(
      Math.floor(state.value.viewport.scrollTop / rowHeight.value) - overscan.value,
      0,
      totalRows.value
    );
    const end = clamp(start + visibleCount + overscan.value * 2, start, totalRows.value);

    return { start, end };
  });

  const visibleIndices = computed<number[]>(() =>
    toIndexArray(virtualRange.value.start, virtualRange.value.end)
  );

  const visibleRows = computed<TRow[]>(() =>
    visibleIndices.value
      .map((rowIndex) => normalizedRows.value[rowIndex])
      .filter((row): row is TRow => row !== undefined)
  );

  const virtualPaddingTop = computed(() => virtualRange.value.start * rowHeight.value);
  const virtualPaddingBottom = computed(() => {
    const renderedHeight = visibleIndices.value.length * rowHeight.value;
    return Math.max(0, totalHeight.value - virtualPaddingTop.value - renderedHeight);
  });

  watch(
    () => resolvedOptions.value.rows,
    (rows) => {
      normalizedRows.value = rows ? [...rows] : [];
    },
    { immediate: true }
  );

  watch(
    () => resolvedOptions.value.columns,
    (columns) => {
      normalizedColumns.value = columns ? [...columns] : [];
    },
    { immediate: true }
  );

  watch(
    () => resolvedOptions.value.rowHeight,
    (nextRowHeight) => {
      rowHeight.value = normalizePositiveNumber(nextRowHeight, DEFAULT_ROW_HEIGHT);
    },
    { immediate: true }
  );

  watch(
    () => resolvedOptions.value.overscan,
    (nextOverscan) => {
      if (typeof nextOverscan !== 'number' || Number.isNaN(nextOverscan) || nextOverscan < 0) {
        overscan.value = DEFAULT_OVERSCAN;
        return;
      }

      overscan.value = Math.floor(nextOverscan);
    },
    { immediate: true }
  );

  watch(
    () => resolvedOptions.value.viewportHeight,
    (nextViewportHeight) => {
      setViewport(
        state.value.viewport.scrollTop,
        normalizePositiveNumber(nextViewportHeight, DEFAULT_VIEWPORT_HEIGHT)
      );
    },
    { immediate: true }
  );

  watch(
    [totalHeight, () => state.value.viewport.viewportHeight],
    () => {
      setViewport(state.value.viewport.scrollTop, state.value.viewport.viewportHeight);
    },
    { flush: 'sync' }
  );

  function emitSemanticEvent<TPayload>(
    type: IoiSemanticEventType,
    payload: TPayload
  ): IoiSemanticEvent<TPayload> {
    const event: IoiSemanticEvent<TPayload> = {
      type,
      payload,
      schemaVersion: SCHEMA_VERSION,
      timestamp: new Date().toISOString()
    };

    lastEvent.value = event;
    return event;
  }

  function setRows(rows: TRow[]): void {
    normalizedRows.value = [...rows];
    emitSemanticEvent('data:explore', {
      reason: 'setRows',
      rowCount: rows.length
    });
  }

  function setColumns(columns: ColumnDef<TRow>[]): void {
    normalizedColumns.value = [...columns];
    emitSemanticEvent('data:explore', {
      reason: 'setColumns',
      columnCount: columns.length
    });
  }

  function setViewport(scrollTop: number, viewportHeight = state.value.viewport.viewportHeight): void {
    const nextViewportHeight = normalizePositiveNumber(viewportHeight, DEFAULT_VIEWPORT_HEIGHT);
    const maxScrollTop = Math.max(0, totalHeight.value - nextViewportHeight);
    const nextScrollTop = clamp(scrollTop, 0, maxScrollTop);

    if (
      nextScrollTop === state.value.viewport.scrollTop &&
      nextViewportHeight === state.value.viewport.viewportHeight
    ) {
      return;
    }

    state.value = {
      ...state.value,
      viewport: {
        scrollTop: nextScrollTop,
        viewportHeight: nextViewportHeight
      }
    };
  }

  function scrollToRow(index: number): void {
    if (totalRows.value === 0) {
      return;
    }

    const clampedIndex = clamp(index, 0, totalRows.value - 1);
    setViewport(clampedIndex * rowHeight.value, state.value.viewport.viewportHeight);
  }

  function exportCSV(csvOptions: ExportCsvOptions = {}): string {
    const delimiter = csvOptions.delimiter ?? ',';
    const includeHeader = csvOptions.includeHeader ?? true;
    const visibleColumns = normalizedColumns.value.filter((column) => !column.hidden);

    const header = includeHeader
      ? `${visibleColumns.map((column) => column.header ?? String(column.field)).join(delimiter)}\n`
      : '';

    const rows = normalizedRows.value
      .map((row) =>
        visibleColumns
          .map((column) => stringifyCell(getFieldValue(row, String(column.field))))
          .join(delimiter)
      )
      .join('\n');

    return `${header}${rows}`.trimEnd();
  }

  function resetState(): void {
    const viewportHeight = state.value.viewport.viewportHeight;
    state.value = createInitialState(viewportHeight);
    emitSemanticEvent('data:explore', { reason: 'resetState' });
  }

  const actions = {
    setRows,
    setColumns,
    setViewport,
    scrollToRow,
    exportCSV,
    resetState,
    emitSemanticEvent
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    rows: normalizedRows,
    columns: normalizedColumns,
    rowHeight,
    overscan,
    state,
    totalRows,
    totalHeight,
    virtualRange,
    virtualPaddingTop,
    virtualPaddingBottom,
    visibleIndices,
    visibleRows,
    lastEvent,
    actions,
    ...actions
  };
}

export type { IoiTableApi, IoiTableOptions } from '../types';
