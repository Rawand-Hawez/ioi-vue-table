import { computed, ref, shallowRef, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';
import type {
  ColumnFilter,
  ColumnDef,
  ExportCsvOptions,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  SortState,
  VirtualRange
} from '../types';
import { applyFilters } from '../utils/filter';
import { get as getNestedPathValue } from '../utils/nestedPath';
import { applySort, toggleSortState } from '../utils/sort';

const SCHEMA_VERSION = 1 as const;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_VIEWPORT_HEIGHT = 320;

function createInitialState(viewportHeight: number): IoiTableState {
  return {
    sort: [],
    filters: [],
    globalSearch: '',
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
  return getNestedPathValue(row, field);
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
  const baseIndices = computed<number[]>(() => toIndexArray(0, totalRows.value));
  const filteredIndices = computed<number[]>(() =>
    applyFilters(
      baseIndices.value,
      normalizedRows.value,
      state.value.filters,
      state.value.globalSearch,
      normalizedColumns.value,
      getFieldValue
    )
  );
  const sortedIndices = computed<number[]>(() =>
    applySort(
      filteredIndices.value,
      normalizedRows.value,
      state.value.sort,
      normalizedColumns.value,
      getFieldValue
    )
  );
  const processedRowCount = computed(() => sortedIndices.value.length);
  const totalHeight = computed(() => processedRowCount.value * rowHeight.value);

  const virtualRange = computed<VirtualRange>(() => {
    if (processedRowCount.value === 0) {
      return { start: 0, end: 0 };
    }

    const viewportHeight = state.value.viewport.viewportHeight;
    const visibleCount = Math.max(1, Math.ceil(viewportHeight / rowHeight.value));
    const start = clamp(
      Math.floor(state.value.viewport.scrollTop / rowHeight.value) - overscan.value,
      0,
      processedRowCount.value
    );
    const end = clamp(start + visibleCount + overscan.value * 2, start, processedRowCount.value);

    return { start, end };
  });

  const visibleIndices = computed<number[]>(() =>
    sortedIndices.value.slice(virtualRange.value.start, virtualRange.value.end)
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

  function setSortState(sortState: SortState[]): void {
    const nextSortState = sortState
      .filter((entry) => entry.field && (entry.direction === 'asc' || entry.direction === 'desc'))
      .map((entry) => ({
        field: entry.field,
        direction: entry.direction
      })) as SortState[];

    if (
      nextSortState.length === state.value.sort.length &&
      nextSortState.every(
        (entry, index) =>
          entry.field === state.value.sort[index]?.field &&
          entry.direction === state.value.sort[index]?.direction
      )
    ) {
      return;
    }

    state.value = {
      ...state.value,
      sort: nextSortState
    };

    emitSemanticEvent('data:sort', {
      sort: nextSortState
    });
  }

  function setColumnFilter(field: string, filter: ColumnFilter): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const existingIndex = state.value.filters.findIndex((entry) => entry.field === normalizedField);
    const nextFilters = [...state.value.filters];
    const nextFilterState = {
      field: normalizedField,
      filter
    };

    if (existingIndex === -1) {
      nextFilters.push(nextFilterState);
    } else {
      const existing = nextFilters[existingIndex];
      if (
        existing &&
        existing.field === normalizedField &&
        JSON.stringify(existing.filter) === JSON.stringify(filter)
      ) {
        return;
      }

      nextFilters[existingIndex] = nextFilterState;
    }

    state.value = {
      ...state.value,
      filters: nextFilters
    };

    emitSemanticEvent('data:filter', {
      filters: nextFilters,
      globalSearch: state.value.globalSearch
    });
  }

  function clearColumnFilter(field: string): void {
    const normalizedField = String(field);
    const nextFilters = state.value.filters.filter((entry) => entry.field !== normalizedField);

    if (nextFilters.length === state.value.filters.length) {
      return;
    }

    state.value = {
      ...state.value,
      filters: nextFilters
    };

    emitSemanticEvent('data:filter', {
      filters: nextFilters,
      globalSearch: state.value.globalSearch
    });
  }

  function setGlobalSearch(text: string): void {
    const nextGlobalSearch = text;
    if (nextGlobalSearch === state.value.globalSearch) {
      return;
    }

    state.value = {
      ...state.value,
      globalSearch: nextGlobalSearch
    };

    emitSemanticEvent('data:filter', {
      filters: state.value.filters,
      globalSearch: nextGlobalSearch
    });
  }

  function clearAllFilters(): void {
    if (state.value.filters.length === 0 && state.value.globalSearch.length === 0) {
      return;
    }

    state.value = {
      ...state.value,
      filters: [],
      globalSearch: ''
    };

    emitSemanticEvent('data:filter', {
      filters: [],
      globalSearch: ''
    });
  }

  function toggleSort(field: string, multi = false): void {
    const nextSortState = toggleSortState(state.value.sort, field, multi);
    setSortState(nextSortState);
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
    if (processedRowCount.value === 0) {
      return;
    }

    const clampedIndex = clamp(index, 0, processedRowCount.value - 1);
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
    setSortState,
    setColumnFilter,
    clearColumnFilter,
    setGlobalSearch,
    clearAllFilters,
    toggleSort,
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
    baseIndices,
    filteredIndices,
    sortedIndices,
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
