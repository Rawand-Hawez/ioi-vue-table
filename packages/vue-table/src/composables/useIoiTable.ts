import { computed, ref, shallowRef, unref, watch } from 'vue';
import type {
  ColumnDef,
  ExportCsvOptions,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState
} from '../types';

const SCHEMA_VERSION = 1 as const;
const DEFAULT_ROW_HEIGHT = 36;
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
  options: IoiTableOptions<TRow> = {}
): IoiTableApi<TRow> {
  const normalizedRows = shallowRef(options.rows ?? []);
  const normalizedColumns = shallowRef(options.columns ?? []);

  const rowHeight = ref(options.rowHeight ?? DEFAULT_ROW_HEIGHT);
  const state = ref<IoiTableState>(createInitialState(options.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT));
  const lastEvent = ref<IoiSemanticEvent<unknown> | null>(null);

  watch(
    () => unref(options.rows),
    (rows) => {
      normalizedRows.value = rows ?? [];
    }
  );

  watch(
    () => unref(options.columns),
    (columns) => {
      normalizedColumns.value = columns ?? [];
    }
  );

  const visibleIndices = computed<number[]>(() => normalizedRows.value.map((_, rowIndex) => rowIndex));

  const visibleRows = computed<TRow[]>(() =>
    visibleIndices.value.map((rowIndex) => normalizedRows.value[rowIndex])
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
    normalizedRows.value = rows;
    emitSemanticEvent('data:explore', {
      reason: 'setRows',
      rowCount: rows.length
    });
  }

  function setColumns(columns: ColumnDef<TRow>[]): void {
    normalizedColumns.value = columns;
    emitSemanticEvent('data:explore', {
      reason: 'setColumns',
      columnCount: columns.length
    });
  }

  function setViewport(scrollTop: number, viewportHeight = state.value.viewport.viewportHeight): void {
    state.value = {
      ...state.value,
      viewport: {
        scrollTop,
        viewportHeight
      }
    };
  }

  function scrollToRow(index: number): void {
    const clamped = Math.max(0, index);
    setViewport(clamped * rowHeight.value, state.value.viewport.viewportHeight);
  }

  function exportCSV(csvOptions: ExportCsvOptions = {}): string {
    const delimiter = csvOptions.delimiter ?? ',';
    const includeHeader = csvOptions.includeHeader ?? true;
    const visibleColumns = normalizedColumns.value.filter((column) => !column.hidden);

    const header = includeHeader
      ? `${visibleColumns.map((column) => column.header ?? String(column.field)).join(delimiter)}\n`
      : '';

    const rows = visibleRows.value
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
    state,
    visibleIndices,
    visibleRows,
    lastEvent,
    actions,
    ...actions
  };
}

export type { IoiTableApi, IoiTableOptions } from '../types';
