import { computed, ref, shallowRef, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';
import type {
  ColumnFilter,
  ColumnDef,
  ExportCsvHeaderMode,
  ExportCsvOptions,
  ExportCsvScope,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  SelectAllScope,
  SelectionMode,
  SortState,
  ToggleRowOptions,
  VirtualRange
} from '../types';
import { applyFilters } from '../utils/filter';
import { get as getNestedPathValue } from '../utils/nestedPath';
import { applySort, toggleSortState } from '../utils/sort';

const SCHEMA_VERSION = 1 as const;
const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_VIEWPORT_HEIGHT = 320;
const SELECTION_ROW_KEY_WARNING =
  '[IOI Table] Selection is disabled because `rowKey` is not configured.';

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  return !(value instanceof Date);
}

function collectNestedObjectLeafPaths(
  value: Record<string, unknown>,
  prefix: string,
  leafPaths: string[]
): void {
  const keys = Object.keys(value);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const nestedPath = prefix.length > 0 ? `${prefix}.${key}` : key;
    const nestedValue = value[key];

    if (isPlainObject(nestedValue)) {
      collectNestedObjectLeafPaths(nestedValue, nestedPath, leafPaths);
      continue;
    }

    leafPaths.push(nestedPath);
  }
}

function stringifyCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? '';
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function encodeCsvField(value: unknown, delimiter: ',' | ';' | '\t'): string {
  const text = stringifyCsvValue(value);
  const escaped = text.replace(/"/g, '""');
  const shouldQuote =
    text.includes(',') ||
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r');

  return shouldQuote ? `"${escaped}"` : escaped;
}

function resolveHeaderLabel(
  fieldPath: string,
  header: string | undefined,
  headerMode: ExportCsvHeaderMode,
  suffix?: string
): string {
  const baseLabel =
    headerMode === 'header' && typeof header === 'string' && header.trim().length > 0
      ? header
      : fieldPath;

  if (!suffix) {
    return baseLabel;
  }

  return `${baseLabel}.${suffix}`;
}

function getFieldValue<TRow>(row: TRow, field: string): unknown {
  return getNestedPathValue(row, field);
}

interface ExportColumn {
  fieldPath: string;
  header: string;
}

function resolveExportColumns<TRow>(
  rows: readonly TRow[],
  rowIndices: readonly number[],
  columns: readonly ColumnDef<TRow>[],
  headerMode: ExportCsvHeaderMode
): ExportColumn[] {
  const exportColumns: ExportColumn[] = [];

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const column = columns[columnIndex];
    const fieldPath = String(column.field);
    const nestedSubpaths: string[] = [];
    const seenNestedSubpaths = new Set<string>();
    let hasScalarValue = false;

    for (let index = 0; index < rowIndices.length; index += 1) {
      const rowIndex = rowIndices[index];
      const row = rows[rowIndex];

      if (row === undefined) {
        continue;
      }

      const value = getFieldValue(row, fieldPath);

      if (isPlainObject(value)) {
        const leafPaths: string[] = [];
        collectNestedObjectLeafPaths(value, '', leafPaths);

        for (let leafIndex = 0; leafIndex < leafPaths.length; leafIndex += 1) {
          const leafPath = leafPaths[leafIndex];
          if (seenNestedSubpaths.has(leafPath)) {
            continue;
          }

          seenNestedSubpaths.add(leafPath);
          nestedSubpaths.push(leafPath);
        }
        continue;
      }

      if (value !== null && value !== undefined) {
        hasScalarValue = true;
      }
    }

    if (hasScalarValue || nestedSubpaths.length === 0) {
      exportColumns.push({
        fieldPath,
        header: resolveHeaderLabel(fieldPath, column.header, headerMode)
      });
    }

    for (let nestedIndex = 0; nestedIndex < nestedSubpaths.length; nestedIndex += 1) {
      const nestedPath = nestedSubpaths[nestedIndex];
      exportColumns.push({
        fieldPath: `${fieldPath}.${nestedPath}`,
        header: resolveHeaderLabel(fieldPath, column.header, headerMode, nestedPath)
      });
    }
  }

  return exportColumns;
}

function normalizeSelectedKeys(keys: Array<string | number>): Array<string | number> {
  const seen = new Set<string | number>();
  const normalized: Array<string | number> = [];

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(key);
  }

  return normalized;
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
  const hasWarnedSelectionDisabled = ref(false);
  const lastSelectedKey = ref<string | number | null>(null);

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
  const selectionMode = computed<SelectionMode>(() =>
    resolvedOptions.value.selectionMode === 'single' ? 'single' : 'multi'
  );
  const selectionEnabled = computed(
    () => resolvedOptions.value.rowKey !== undefined && resolvedOptions.value.rowKey !== null
  );

  function warnSelectionDisabled(): void {
    if (hasWarnedSelectionDisabled.value) {
      return;
    }

    hasWarnedSelectionDisabled.value = true;
    console.warn(SELECTION_ROW_KEY_WARNING);
  }

  function resolveRowSelectionKey(row: TRow, index: number): string | number | null {
    const { rowKey } = resolvedOptions.value;
    if (!rowKey) {
      return null;
    }

    if (typeof rowKey === 'function') {
      const resolvedKey = rowKey(row, index);
      return typeof resolvedKey === 'string' || typeof resolvedKey === 'number' ? resolvedKey : null;
    }

    const value = getNestedPathValue(row, String(rowKey));
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  function resolveSelectionKeyByIndex(index: number): string | number | null {
    const row = normalizedRows.value[index];
    if (row === undefined) {
      return null;
    }

    return resolveRowSelectionKey(row, index);
  }

  function collectSelectionKeys(indices: readonly number[]): Array<string | number> {
    const keys: Array<string | number> = [];

    for (let index = 0; index < indices.length; index += 1) {
      const key = resolveSelectionKeyByIndex(indices[index]);
      if (key !== null) {
        keys.push(key);
      }
    }

    return normalizeSelectedKeys(keys);
  }

  function getSortedSelectionKeys(): Array<string | number> {
    return collectSelectionKeys(sortedIndices.value);
  }

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

  watch(
    selectionEnabled,
    (enabled) => {
      if (enabled || state.value.selectedRowKeys.length === 0) {
        return;
      }

      state.value = {
        ...state.value,
        selectedRowKeys: []
      };
      lastSelectedKey.value = null;
    },
    { flush: 'sync' }
  );

  watch(
    [() => normalizedRows.value, () => resolvedOptions.value.rowKey],
    () => {
      if (!selectionEnabled.value || state.value.selectedRowKeys.length === 0) {
        return;
      }

      const availableKeys = new Set(collectSelectionKeys(baseIndices.value));
      const nextSelectedKeys = state.value.selectedRowKeys.filter((key) => availableKeys.has(key));

      if (nextSelectedKeys.length !== state.value.selectedRowKeys.length) {
        state.value = {
          ...state.value,
          selectedRowKeys: nextSelectedKeys
        };
      }
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

  function setSelectedKeys(nextKeys: Array<string | number>, reason: string): void {
    const normalizedKeys = normalizeSelectedKeys(nextKeys);
    const currentKeys = state.value.selectedRowKeys;

    if (
      normalizedKeys.length === currentKeys.length &&
      normalizedKeys.every((key, index) => key === currentKeys[index])
    ) {
      return;
    }

    state.value = {
      ...state.value,
      selectedRowKeys: normalizedKeys
    };

    emitSemanticEvent('data:select', {
      reason,
      selectedRowKeys: normalizedKeys
    });
  }

  function toggleRow(key: string | number, options: ToggleRowOptions = {}): void {
    if (!selectionEnabled.value) {
      warnSelectionDisabled();
      return;
    }

    const currentKeys = state.value.selectedRowKeys;
    const isAlreadySelected = currentKeys.includes(key);
    const isSingleSelection = selectionMode.value === 'single';

    if (isSingleSelection) {
      const nextKeys = isAlreadySelected && currentKeys.length === 1 ? [] : [key];
      lastSelectedKey.value = nextKeys.length > 0 ? key : null;
      setSelectedKeys(nextKeys, 'toggleRow');
      return;
    }

    if (options.shiftKey && lastSelectedKey.value !== null) {
      const orderedKeys = getSortedSelectionKeys();
      const anchorIndex = orderedKeys.indexOf(lastSelectedKey.value);
      const targetIndex = orderedKeys.indexOf(key);

      if (anchorIndex !== -1 && targetIndex !== -1) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeKeys = orderedKeys.slice(start, end + 1);
        setSelectedKeys([...currentKeys, ...rangeKeys], 'shiftRange');
        lastSelectedKey.value = key;
        return;
      }
    }

    const nextKeys = isAlreadySelected
      ? currentKeys.filter((selectedKey) => selectedKey !== key)
      : [...currentKeys, key];

    lastSelectedKey.value = isAlreadySelected ? null : key;
    setSelectedKeys(nextKeys, 'toggleRow');
  }

  function isSelected(key: string | number): boolean {
    return state.value.selectedRowKeys.includes(key);
  }

  function clearSelection(): void {
    lastSelectedKey.value = null;
    setSelectedKeys([], 'clearSelection');
  }

  function selectAll(scope: SelectAllScope = 'filtered'): void {
    if (!selectionEnabled.value) {
      warnSelectionDisabled();
      return;
    }

    const indices =
      scope === 'visible'
        ? visibleIndices.value
        : scope === 'allLoaded'
          ? baseIndices.value
          : sortedIndices.value;

    const nextKeys = collectSelectionKeys(indices);

    if (selectionMode.value === 'single') {
      const singleKey = nextKeys[0];
      setSelectedKeys(singleKey !== undefined ? [singleKey] : [], `selectAll:${scope}`);
      lastSelectedKey.value = singleKey ?? null;
      return;
    }

    setSelectedKeys(nextKeys, `selectAll:${scope}`);
    lastSelectedKey.value = nextKeys.length > 0 ? nextKeys[nextKeys.length - 1] : null;
  }

  function getSelectedKeys(): Array<string | number> {
    return [...state.value.selectedRowKeys];
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

  function resolveExportRowIndices(scope: ExportCsvScope): number[] {
    if (scope === 'visible') {
      return [...visibleIndices.value];
    }

    if (scope === 'allLoaded') {
      return [...baseIndices.value];
    }

    if (scope === 'selected') {
      if (!selectionEnabled.value || state.value.selectedRowKeys.length === 0) {
        return [];
      }

      const selectedKeySet = new Set(state.value.selectedRowKeys);
      return baseIndices.value.filter((rowIndex) => {
        const rowKey = resolveSelectionKeyByIndex(rowIndex);
        return rowKey !== null && selectedKeySet.has(rowKey);
      });
    }

    return [...sortedIndices.value];
  }

  function exportCSV(csvOptions: ExportCsvOptions = {}): string {
    const delimiter = csvOptions.delimiter ?? ',';
    const includeHeader = csvOptions.includeHeader ?? true;
    const headerMode = csvOptions.headerMode ?? 'field';
    const scope = csvOptions.scope ?? 'filtered';
    const includeHiddenColumns = csvOptions.includeHiddenColumns ?? false;
    const exportIndices = resolveExportRowIndices(scope);
    const exportColumns = resolveExportColumns(
      normalizedRows.value,
      exportIndices,
      normalizedColumns.value.filter((column) => includeHiddenColumns || !column.hidden),
      headerMode
    );

    if (exportColumns.length === 0) {
      emitSemanticEvent('data:extract', {
        reason: 'exportCSV',
        scope,
        rowCount: exportIndices.length,
        columnCount: 0,
        includeHiddenColumns,
        delimiter
      });
      return '';
    }

    const lines: string[] = [];

    if (includeHeader && exportColumns.length > 0) {
      lines.push(exportColumns.map((column) => encodeCsvField(column.header, delimiter)).join(delimiter));
    }

    for (let index = 0; index < exportIndices.length; index += 1) {
      const rowIndex = exportIndices[index];
      const row = normalizedRows.value[rowIndex];

      if (row === undefined) {
        continue;
      }

      const csvRow = exportColumns
        .map((column) => encodeCsvField(getFieldValue(row, column.fieldPath), delimiter))
        .join(delimiter);
      lines.push(csvRow);
    }

    const csv = lines.join('\n');

    emitSemanticEvent('data:extract', {
      reason: 'exportCSV',
      scope,
      rowCount: exportIndices.length,
      columnCount: exportColumns.length,
      includeHiddenColumns,
      delimiter
    });

    return csv;
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
    toggleRow,
    isSelected,
    clearSelection,
    selectAll,
    getSelectedKeys,
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
