import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';
import type {
  CommitCsvImportOptions,
  ColumnFilter,
  ColumnDef,
  CsvDelimiter,
  CsvImportMapping,
  CsvImportPreview,
  CsvImportResult,
  CsvImportSource,
  CsvImportValidationError,
  ExportCsvHeaderMode,
  ExportCsvOptions,
  ExportCsvScope,
  IoiPaginationChangePayload,
  IoiCellCommitPayload,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  ParseCsvOptions,
  SelectAllScope,
  SelectionMode,
  SortState,
  StartEditOptions,
  ToggleRowOptions,
  VirtualRange
} from '../types';
import { applyFilters } from '../utils/filter';
import { get as getNestedPathValue, set as setNestedPathValue } from '../utils/nestedPath';
import {
  normalizeNonNegativeInteger,
  normalizePositiveInteger,
  normalizePositiveNumber
} from '../utils/number';
import { applySort, toggleSortState } from '../utils/sort';
import {
  coerceCsvImportValue,
  encodeCsvField,
  encodeCsvText,
  normalizeCsvDelimiter,
  normalizeCsvHeader,
  normalizeCsvPreviewRowLimit,
  parseCsvRows,
  resolveCsvDelimiter,
  resolveHeaderLabel,
  sanitizeCsvText
} from './ioiTable/csv';
import {
  DEFAULT_CSV_PREVIEW_ROW_LIMIT,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_VIEWPORT_HEIGHT,
  SELECTION_ROW_KEY_WARNING,
  SCHEMA_VERSION
} from './ioiTable/constants';
import { resolveValidationMessage } from './ioiTable/editing';
import { createSemanticEvent } from './ioiTable/events';
import { buildPaginationPayload } from './ioiTable/pagination';
import { normalizeSelectedKeys } from './ioiTable/selection';
import { createInitialState } from './ioiTable/state';
import { clamp, collectNestedObjectLeafPaths, isPlainObject, stringifyFacetValue, toIndexArray } from './ioiTable/utils';

function getFieldValue<TRow>(row: TRow, field: string): unknown {
  return getNestedPathValue(row, field);
}

interface ExportColumn {
  fieldPath: string;
  header: string;
}

interface ImportColumnBinding<TRow> {
  columnId: string;
  field: string;
  header: string;
  column: Pick<ColumnDef<TRow>, 'type' | 'validate'>;
}

interface ParsedCsvImportSession<TRow> {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  headers: string[];
  dataRows: string[][];
  previewRowLimit: number;
  maxColumnCount: number;
  columns: ImportColumnBinding<TRow>[];
  mapping: CsvImportMapping;
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


function resolveImportColumnBindings<TRow>(
  columns: readonly ColumnDef<TRow>[]
): ImportColumnBinding<TRow>[] {
  const usageCount = new Map<string, number>();
  const bindings: ImportColumnBinding<TRow>[] = [];

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    const field = String(column.field);
    const baseId = column.id ? String(column.id) : field;
    const seenCount = usageCount.get(baseId) ?? 0;
    usageCount.set(baseId, seenCount + 1);

    bindings.push({
      columnId: seenCount === 0 ? baseId : `${baseId}#${index}`,
      field,
      header: column.header ?? field,
      column: {
        type: column.type,
        validate: column.validate
      }
    });
  }

  return bindings;
}

function createAutoImportMapping<TRow>(
  hasHeader: boolean,
  headers: readonly string[],
  columns: readonly ImportColumnBinding<TRow>[]
): CsvImportMapping {
  const mapping: CsvImportMapping = {};

  if (hasHeader) {
    const headerIndexByKey = new Map<string, number>();

    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      const key = normalizeCsvHeader(headers[headerIndex]);
      if (key.length === 0 || headerIndexByKey.has(key)) {
        continue;
      }

      headerIndexByKey.set(key, headerIndex);
    }

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      const headerMatch = headerIndexByKey.get(normalizeCsvHeader(column.field));
      mapping[column.columnId] = headerMatch ?? null;
    }
  } else {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      mapping[columns[columnIndex].columnId] = columnIndex < headers.length ? columnIndex : null;
    }
  }

  return mapping;
}

function normalizeImportMapping<TRow>(
  mapping: CsvImportMapping | undefined,
  session: ParsedCsvImportSession<TRow>
): CsvImportMapping {
  const normalized: CsvImportMapping = {};
  const incomingMapping = mapping ?? session.mapping;

  for (let columnIndex = 0; columnIndex < session.columns.length; columnIndex += 1) {
    const columnId = session.columns[columnIndex].columnId;
    const rawIndex = incomingMapping[columnId];
    if (typeof rawIndex !== 'number' || !Number.isFinite(rawIndex)) {
      normalized[columnId] = null;
      continue;
    }

    const normalizedIndex = Math.floor(rawIndex);
    normalized[columnId] =
      normalizedIndex >= 0 && normalizedIndex < session.maxColumnCount ? normalizedIndex : null;
  }

  return normalized;
}

function buildCsvImportRows<TRow>(
  dataRows: readonly string[][],
  hasHeader: boolean,
  columns: readonly ImportColumnBinding<TRow>[],
  mapping: CsvImportMapping
): Array<{
  values: Partial<TRow>;
  errors: CsvImportValidationError[];
  rowNumber: number;
}> {
  const previewRows: Array<{
    values: Partial<TRow>;
    errors: CsvImportValidationError[];
    rowNumber: number;
  }> = [];

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const sourceRow = dataRows[rowIndex];
    const values = {} as Partial<TRow>;
    const errors: CsvImportValidationError[] = [];
    const valueByColumnId = new Map<string, unknown>();
    const typeErrorByColumnId = new Map<string, string>();

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const binding = columns[columnIndex];
      const sourceIndex = mapping[binding.columnId];
      if (sourceIndex === null || sourceIndex === undefined) {
        continue;
      }

      const rawCell = sourceRow[sourceIndex] ?? '';
      const { value, typeError } = coerceCsvImportValue(rawCell, binding.column.type);
      valueByColumnId.set(binding.columnId, value);
      if (typeError) {
        typeErrorByColumnId.set(binding.columnId, typeError);
      }

      setNestedPathValue(values, binding.field, value);
    }

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const binding = columns[columnIndex];
      const sourceIndex = mapping[binding.columnId];
      if (sourceIndex === null || sourceIndex === undefined) {
        continue;
      }

      const value = valueByColumnId.get(binding.columnId);
      const typeError = typeErrorByColumnId.get(binding.columnId);
      if (typeError) {
        errors.push({
          columnId: binding.columnId,
          field: binding.field,
          message: typeError,
          value
        });
        continue;
      }

      if (binding.column.validate) {
        try {
          const validationResult = binding.column.validate(value, values as TRow);
          if (validationResult !== true) {
            errors.push({
              columnId: binding.columnId,
              field: binding.field,
              message: resolveValidationMessage(validationResult),
              value
            });
          }
        } catch (error) {
          errors.push({
            columnId: binding.columnId,
            field: binding.field,
            message:
              error instanceof Error && error.message.length > 0
                ? error.message
                : 'Validation failed',
            value
          });
        }
      }
    }

    previewRows.push({
      rowNumber: hasHeader ? rowIndex + 2 : rowIndex + 1,
      values,
      errors
    });
  }

  return previewRows;
}

async function readCsvImportSource(fileOrText: CsvImportSource): Promise<string> {
  if (typeof fileOrText === 'string') {
    return fileOrText;
  }

  if (fileOrText && typeof fileOrText.text === 'function') {
    return fileOrText.text();
  }

  return '';
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
  
  // Initialize expandedRowKeys from options if provided
  if (resolvedOptions.value.expandedRowKeys) {
    state.value.expandedRowKeys = [...resolvedOptions.value.expandedRowKeys];
  }
  
  const lastEvent = ref<IoiSemanticEvent<unknown> | null>(null);
  const hasWarnedSelectionDisabled = ref(false);
  const lastSelectedKey = ref<string | number | null>(null);
  const editingDraft = ref<unknown>(null);
  const editingError = ref<string | null>(null);
  const csvImportSession = ref<ParsedCsvImportSession<TRow> | null>(null);
  const uncontrolledPageIndex = ref(0);
  const uncontrolledPageSize = ref(0);
  const columnKeyMap = computed(() => {
    const map = new Map<string, ColumnDef<TRow>>();

    for (let index = 0; index < normalizedColumns.value.length; index += 1) {
      const column = normalizedColumns.value[index];
      map.set(String(column.field), column);

      if (column.id) {
        map.set(column.id, column);
      }
    }

    return map;
  });

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

  const paginationConfig = computed(() => resolvedOptions.value.pagination);
  const isPageIndexControlled = computed(() => paginationConfig.value?.pageIndex !== undefined);
  const isPageSizeControlled = computed(() => paginationConfig.value?.pageSize !== undefined);
  const rawPageIndex = computed(() =>
    normalizeNonNegativeInteger(
      isPageIndexControlled.value ? paginationConfig.value?.pageIndex : uncontrolledPageIndex.value,
      0
    )
  );
  const rawPageSize = computed(() =>
    normalizePositiveInteger(
      isPageSizeControlled.value ? paginationConfig.value?.pageSize : uncontrolledPageSize.value,
      0
    )
  );
  const paginationEnabled = computed(() => rawPageSize.value > 0);
  const pageCount = computed(() =>
    paginationEnabled.value
      ? Math.max(1, Math.ceil(processedRowCount.value / rawPageSize.value))
      : 1
  );
  const pageIndex = computed(() =>
    paginationEnabled.value ? clamp(rawPageIndex.value, 0, pageCount.value - 1) : 0
  );
  const pageSize = computed(() => rawPageSize.value);
  const filterDebounceMs = computed(() =>
    normalizeNonNegativeInteger(resolvedOptions.value.filterDebounceMs, 0)
  );
  const globalSearchDebounceMs = computed(() =>
    normalizeNonNegativeInteger(resolvedOptions.value.globalSearchDebounceMs, 0)
  );
  const defaultCsvPreviewRowLimit = computed(() =>
    normalizeCsvPreviewRowLimit(
      resolvedOptions.value.defaultCsvPreviewRowLimit,
      DEFAULT_CSV_PREVIEW_ROW_LIMIT
    )
  );
  const filterDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let globalSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const virtualRange = computed<VirtualRange>(() => {
    if (processedRowCount.value === 0) {
      return { start: 0, end: 0 };
    }

    if (paginationEnabled.value) {
      const start = clamp(pageIndex.value * rawPageSize.value, 0, processedRowCount.value);
      const end = clamp(start + rawPageSize.value, start, processedRowCount.value);
      return { start, end };
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

  const virtualPaddingTop = computed(() =>
    paginationEnabled.value ? 0 : virtualRange.value.start * rowHeight.value
  );
  const virtualPaddingBottom = computed(() => {
    if (paginationEnabled.value) {
      return 0;
    }

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

  function findRowIndexByKey(targetKey: string | number): number {
    for (let index = 0; index < baseIndices.value.length; index += 1) {
      const rowIndex = baseIndices.value[index];
      const rowKey = resolveSelectionKeyByIndex(rowIndex);
      if (rowKey === targetKey) {
        return rowIndex;
      }
    }

    return -1;
  }

  function resolveEditRowIndex(editingCell: { rowKey?: string | number; rowIndex?: number }): number {
    if (editingCell.rowKey !== undefined && editingCell.rowKey !== null) {
      const indexByKey = findRowIndexByKey(editingCell.rowKey);
      if (indexByKey !== -1) {
        return indexByKey;
      }
    }

    if (
      typeof editingCell.rowIndex === 'number' &&
      editingCell.rowIndex >= 0 &&
      editingCell.rowIndex < normalizedRows.value.length
    ) {
      return editingCell.rowIndex;
    }

    return -1;
  }

  function clearEditingState(): void {
    state.value = {
      ...state.value,
      editingCell: null
    };
    editingDraft.value = null;
    editingError.value = null;
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

  watch(
    [() => normalizedRows.value, () => state.value.editingCell],
    () => {
      const editingCell = state.value.editingCell;
      if (!editingCell) {
        return;
      }

      if (resolveEditRowIndex(editingCell) !== -1) {
        return;
      }

      clearEditingState();
    },
    { flush: 'sync' }
  );

  watch(
    [() => normalizedRows.value, () => resolvedOptions.value.rowKey],
    () => {
      if (state.value.expandedRowKeys.length === 0) {
        return;
      }

      const availableKeys = new Set(
        sortedIndices.value
          .map((idx) => resolveSelectionKeyByIndex(idx))
          .filter((key): key is string | number => key !== null)
      );

      const nextExpandedKeys = state.value.expandedRowKeys.filter((key) => 
        availableKeys.has(key)
      );

      if (nextExpandedKeys.length !== state.value.expandedRowKeys.length) {
        state.value = {
          ...state.value,
          expandedRowKeys: nextExpandedKeys
        };
      }
    },
    { flush: 'sync' }
  );

  function emitSemanticEvent<TPayload>(
    type: IoiSemanticEventType,
    payload: TPayload
  ): IoiSemanticEvent<TPayload> {
    const event = createSemanticEvent(type, payload, SCHEMA_VERSION);
    lastEvent.value = event;
    return event;
  }

  function notifyPaginationChange(
    nextPageIndex: number,
    nextPageSize: number,
    reason: IoiPaginationChangePayload['reason']
  ): void {
    const normalizedPageSize = normalizePositiveInteger(nextPageSize, 0);
    const normalizedPageIndex = normalizeNonNegativeInteger(nextPageIndex, 0);
    const payload = buildPaginationPayload(
      normalizedPageIndex,
      normalizedPageSize,
      processedRowCount.value,
      reason
    );

    resolvedOptions.value.onPaginationChange?.(payload);

    emitSemanticEvent('data:explore', {
      reason: 'pagination',
      action: payload.reason,
      pageIndex: payload.pageIndex,
      pageSize: payload.pageSize,
      pageCount: payload.pageCount,
      rowCount: payload.rowCount
    });
  }

  function setPageIndex(nextPageIndex: number, reason: IoiPaginationChangePayload['reason'] = 'setPageIndex'): void {
    if (rawPageSize.value <= 0) {
      return;
    }

    const nextPageSize = rawPageSize.value;
    const normalizedNextPageIndex = normalizeNonNegativeInteger(nextPageIndex, 0);
    const nextPageCount =
      nextPageSize > 0 ? Math.max(1, Math.ceil(processedRowCount.value / nextPageSize)) : 1;
    const clampedNextPageIndex =
      nextPageSize > 0 ? clamp(normalizedNextPageIndex, 0, nextPageCount - 1) : 0;

    if (clampedNextPageIndex === pageIndex.value) {
      return;
    }

    if (!isPageIndexControlled.value) {
      uncontrolledPageIndex.value = clampedNextPageIndex;
    }

    if (!isPageSizeControlled.value) {
      uncontrolledPageSize.value = nextPageSize;
    }

    notifyPaginationChange(clampedNextPageIndex, nextPageSize, reason);
  }

  function setPageSize(nextPageSize: number, reason: IoiPaginationChangePayload['reason'] = 'setPageSize'): void {
    const normalizedNextPageSize = normalizePositiveInteger(nextPageSize, 0);
    const nextPageIndex = 0;

    if (normalizedNextPageSize === pageSize.value && pageIndex.value === nextPageIndex) {
      return;
    }

    if (!isPageSizeControlled.value) {
      uncontrolledPageSize.value = normalizedNextPageSize;
    }

    if (!isPageIndexControlled.value) {
      uncontrolledPageIndex.value = nextPageIndex;
    }

    notifyPaginationChange(nextPageIndex, normalizedNextPageSize, reason);
  }

  function getColumnFacetOptions(field: string): string[] {
    const normalizedKey = String(field);
    if (!normalizedKey) {
      return [];
    }

    const keyMap = columnKeyMap.value;
    const targetColumn = keyMap.get(normalizedKey);
    const targetFieldPath = targetColumn ? String(targetColumn.field) : normalizedKey;
    const excludedKeys = new Set<string>([normalizedKey, targetFieldPath]);

    if (targetColumn?.id) {
      excludedKeys.add(targetColumn.id);
    }

    const otherFilters = state.value.filters.filter((entry) => {
      if (excludedKeys.has(entry.field)) {
        return false;
      }

      const resolvedColumn = keyMap.get(entry.field);
      if (!resolvedColumn) {
        return true;
      }

      if (excludedKeys.has(String(resolvedColumn.field))) {
        return false;
      }

      if (resolvedColumn.id && excludedKeys.has(resolvedColumn.id)) {
        return false;
      }

      return true;
    });

    const facetIndices = applyFilters(
      baseIndices.value,
      normalizedRows.value,
      otherFilters,
      state.value.globalSearch,
      normalizedColumns.value,
      getFieldValue
    );

    const optionSet = new Set<string>();

    for (let index = 0; index < facetIndices.length; index += 1) {
      const rowIndex = facetIndices[index];
      const row = normalizedRows.value[rowIndex];

      if (row === undefined) {
        continue;
      }

      const value = getFieldValue(row, targetFieldPath);

      if (Array.isArray(value)) {
        for (let valueIndex = 0; valueIndex < value.length; valueIndex += 1) {
          const candidate = stringifyFacetValue(value[valueIndex]).trim();
          if (candidate.length > 0) {
            optionSet.add(candidate);
          }
        }
        continue;
      }

      const candidate = stringifyFacetValue(value).trim();
      if (candidate.length > 0) {
        optionSet.add(candidate);
      }
    }

    const options = Array.from(optionSet);
    options.sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
    );
    return options;
  }

  watch(
    [() => state.value.sort, () => state.value.filters, () => state.value.globalSearch],
    () => {
      if (!paginationEnabled.value) {
        return;
      }

      if (rawPageIndex.value === 0) {
        return;
      }

      setPageIndex(0, 'autoReset');
    },
    { flush: 'sync' }
  );

  watch(
    [processedRowCount, rawPageSize, rawPageIndex],
    () => {
      if (!paginationEnabled.value || rawPageSize.value <= 0) {
        return;
      }

      const maxPageIndex = pageCount.value - 1;
      if (rawPageIndex.value <= maxPageIndex) {
        return;
      }

      setPageIndex(maxPageIndex, 'clamp');
    },
    { flush: 'sync' }
  );

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

  function clearFilterDebounceTimer(field: string): void {
    const timer = filterDebounceTimers.get(field);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    filterDebounceTimers.delete(field);
  }

  function clearAllDebounceTimers(): void {
    for (const [field, timer] of filterDebounceTimers.entries()) {
      clearTimeout(timer);
      filterDebounceTimers.delete(field);
    }

    if (globalSearchDebounceTimer) {
      clearTimeout(globalSearchDebounceTimer);
      globalSearchDebounceTimer = null;
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(clearAllDebounceTimers);
  }

  function applyColumnFilter(field: string, filter: ColumnFilter): void {
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
      if (existing && existing.field === normalizedField) {
        const existingFilter = existing.filter;
        const isSameType = existingFilter.type === filter.type;
        
        let isSameFilter = false;
        if (isSameType) {
          if (filter.type === 'text') {
            const tf = filter as import('../types').TextColumnFilter;
            const ef = existingFilter as import('../types').TextColumnFilter;
            isSameFilter = ef.value === tf.value && 
              ef.operator === tf.operator &&
              ef.caseSensitive === tf.caseSensitive;
          } else if (filter.type === 'number') {
            const nf = filter as import('../types').NumberColumnFilter;
            const ef = existingFilter as import('../types').NumberColumnFilter;
            if (nf.operator === 'between' && ef.operator === 'between') {
              isSameFilter = ef.min === nf.min && ef.max === nf.max;
            } else if (nf.operator !== 'between' && ef.operator !== 'between') {
              isSameFilter = ef.value === nf.value && ef.operator === nf.operator;
            }
          } else if (filter.type === 'date') {
            const df = filter as import('../types').DateColumnFilter;
            const ef = existingFilter as import('../types').DateColumnFilter;
            isSameFilter = ef.value === df.value && ef.operator === df.operator;
          }
        }
        
        if (isSameFilter) {
          return;
        }
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

  function setColumnFilter(field: string, filter: ColumnFilter): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const debounceMs = filterDebounceMs.value;
    if (debounceMs <= 0) {
      applyColumnFilter(normalizedField, filter);
      return;
    }

    clearFilterDebounceTimer(normalizedField);
    const timer = setTimeout(() => {
      filterDebounceTimers.delete(normalizedField);
      applyColumnFilter(normalizedField, filter);
    }, debounceMs);
    filterDebounceTimers.set(normalizedField, timer);
  }

  function applyClearColumnFilter(field: string): void {
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

  function clearColumnFilter(field: string): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const debounceMs = filterDebounceMs.value;
    if (debounceMs <= 0) {
      applyClearColumnFilter(normalizedField);
      return;
    }

    clearFilterDebounceTimer(normalizedField);
    const timer = setTimeout(() => {
      filterDebounceTimers.delete(normalizedField);
      applyClearColumnFilter(normalizedField);
    }, debounceMs);
    filterDebounceTimers.set(normalizedField, timer);
  }

  function applyGlobalSearch(text: string): void {
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

  function setGlobalSearch(text: string): void {
    const debounceMs = globalSearchDebounceMs.value;
    if (debounceMs <= 0) {
      applyGlobalSearch(text);
      return;
    }

    if (globalSearchDebounceTimer) {
      clearTimeout(globalSearchDebounceTimer);
    }

    globalSearchDebounceTimer = setTimeout(() => {
      globalSearchDebounceTimer = null;
      applyGlobalSearch(text);
    }, debounceMs);
  }

  function clearAllFilters(): void {
    clearAllDebounceTimers();

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

  function toggleRowExpansion(key: string | number): void {
    const currentKeys = state.value.expandedRowKeys;
    const keySet = new Set(currentKeys);
    const wasExpanded = keySet.has(key);
    
    if (wasExpanded) {
      keySet.delete(key);
    } else {
      keySet.add(key);
    }
    
    const nextKeys = Array.from(keySet);

    state.value = {
      ...state.value,
      expandedRowKeys: nextKeys
    };

    const rowIndex = sortedIndices.value.findIndex((idx) => {
      const rowKey = resolveSelectionKeyByIndex(idx);
      return rowKey === key;
    });

    if (rowIndex !== -1) {
      const row = normalizedRows.value[sortedIndices.value[rowIndex]];
      resolvedOptions.value.onRowExpand?.({
        row,
        rowIndex,
        rowKey: key,
        expanded: !wasExpanded
      });
    }
  }

  function expandAllRows(): void {
    const allKeys = sortedIndices.value
      .filter((idx) => {
        // Check if row is expandable
        if (resolvedOptions.value.rowExpandable) {
          const row = normalizedRows.value[idx];
          return resolvedOptions.value.rowExpandable(row, idx);
        }
        return true;
      })
      .map((idx) => resolveSelectionKeyByIndex(idx))
      .filter((key): key is string | number => key !== null);

    state.value = {
      ...state.value,
      expandedRowKeys: allKeys
    };
  }

  function collapseAllRows(): void {
    state.value = {
      ...state.value,
      expandedRowKeys: []
    };
  }

  function isRowExpanded(key: string | number): boolean {
    return state.value.expandedRowKeys.includes(key);
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

    if (paginationEnabled.value && rawPageSize.value > 0) {
      const nextPageIndex = Math.floor(clampedIndex / rawPageSize.value);
      setPageIndex(nextPageIndex);
      const withinPageIndex = clampedIndex - nextPageIndex * rawPageSize.value;
      setViewport(withinPageIndex * rowHeight.value, state.value.viewport.viewportHeight);
      return;
    }

    setViewport(clampedIndex * rowHeight.value, state.value.viewport.viewportHeight);
  }

  function startEdit(options: StartEditOptions): void {
    const field = String(options.field);
    if (!field) {
      return;
    }

    const rowIndex = resolveEditRowIndex({
      rowKey: options.rowKey,
      rowIndex: options.rowIndex
    });

    if (rowIndex === -1) {
      return;
    }

    const row = normalizedRows.value[rowIndex];
    if (row === undefined) {
      return;
    }

    const rowKey = resolveSelectionKeyByIndex(rowIndex);
    state.value = {
      ...state.value,
      editingCell: {
        field,
        rowIndex,
        rowKey: rowKey ?? undefined
      }
    };
    editingDraft.value =
      options.value !== undefined ? options.value : getFieldValue(row, field);
    editingError.value = null;
  }

  function setEditDraft(value: unknown): void {
    if (!state.value.editingCell) {
      return;
    }

    editingDraft.value = value;
    editingError.value = null;
  }

  function commitEdit(): boolean {
    const editingCell = state.value.editingCell;
    if (!editingCell) {
      return false;
    }

    const rowIndex = resolveEditRowIndex(editingCell);
    if (rowIndex === -1) {
      editingError.value = 'Row not found';
      return false;
    }

    const row = normalizedRows.value[rowIndex];
    if (!row) {
      editingError.value = 'Row not found';
      return false;
    }

    const field = editingCell.field;
    const column = normalizedColumns.value.find((entry) => String(entry.field) === field);
    const draftValue = editingDraft.value;

    if (column?.validate) {
      const validationResult = column.validate(draftValue, row);
      if (validationResult !== true) {
        editingError.value =
          resolveValidationMessage(validationResult);
        return false;
      }
    }

    const oldValue = getFieldValue(row, field);
    const updatedRow = (typeof structuredClone === 'function'
      ? structuredClone(row)
      : JSON.parse(JSON.stringify(row))) as TRow;
    setNestedPathValue(updatedRow, field, draftValue);
    const nextRows = [...normalizedRows.value];
    nextRows[rowIndex] = updatedRow;
    normalizedRows.value = nextRows;

    const payload: IoiCellCommitPayload<TRow> = {
      row: updatedRow,
      rowIndex,
      rowKey: resolveSelectionKeyByIndex(rowIndex),
      field,
      oldValue,
      newValue: draftValue
    };

    resolvedOptions.value.onCellCommit?.(payload);
    resolvedOptions.value.onRowUpdate?.(payload);
    emitSemanticEvent('data:modify', {
      reason: 'commitEdit',
      ...payload
    });
    clearEditingState();

    return true;
  }

  function cancelEdit(): void {
    if (!state.value.editingCell) {
      return;
    }

    clearEditingState();
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
    const sanitizeFormulas = csvOptions.sanitizeFormulas ?? true;
    const formulaEscapePrefix = csvOptions.formulaEscapePrefix ?? "'";
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
      lines.push(
        exportColumns
          .map((column) =>
            encodeCsvText(
              sanitizeCsvText(column.header, sanitizeFormulas, formulaEscapePrefix),
              delimiter
            )
          )
          .join(delimiter)
      );
    }

    for (let index = 0; index < exportIndices.length; index += 1) {
      const rowIndex = exportIndices[index];
      const row = normalizedRows.value[rowIndex];

      if (row === undefined) {
        continue;
      }

      const csvRow = exportColumns
        .map((column) =>
          encodeCsvField(
            getFieldValue(row, column.fieldPath),
            delimiter,
            sanitizeFormulas,
            formulaEscapePrefix
          )
        )
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

  async function parseCSV(
    fileOrText: CsvImportSource,
    options: ParseCsvOptions = {}
  ): Promise<CsvImportPreview<TRow>> {
    const hasHeader = options.hasHeader ?? true;
    const previewRowLimit = normalizeCsvPreviewRowLimit(
      options.previewRowLimit,
      defaultCsvPreviewRowLimit.value
    );

    try {
      const text = await readCsvImportSource(fileOrText);
      const delimiter = resolveCsvDelimiter(text, options.delimiter);
      const parsedRows = parseCsvRows(text, delimiter);
      const maxColumnCount = parsedRows.reduce(
        (maxCount, row) => Math.max(maxCount, row.length),
        0
      );
      const headers =
        hasHeader && parsedRows.length > 0
          ? [...parsedRows[0]]
          : Array.from(
              { length: maxColumnCount },
              (_, index) => `column_${index + 1}`
            );
      const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      const importColumns = resolveImportColumnBindings(normalizedColumns.value);
      const autoMapping = createAutoImportMapping(hasHeader, headers, importColumns);
      const previewRows = buildCsvImportRows(dataRows, hasHeader, importColumns, autoMapping);
      const previewRowsLimited = previewRows.slice(0, previewRowLimit);

      const preview: CsvImportPreview<TRow> = {
        delimiter,
        hasHeader,
        headers,
        totalRows: dataRows.length,
        previewRowLimit,
        truncated: dataRows.length > previewRowLimit,
        mapping: { ...autoMapping },
        columns: importColumns.map((column) => ({
          columnId: column.columnId,
          field: column.field,
          header: column.header,
          sourceIndex: autoMapping[column.columnId] ?? null,
          sourceHeader:
            autoMapping[column.columnId] !== null && autoMapping[column.columnId] !== undefined
              ? headers[autoMapping[column.columnId] ?? 0] ?? null
              : null
        })),
        rows: previewRowsLimited,
        fatalError: null
      };

      csvImportSession.value = {
        delimiter,
        hasHeader,
        headers,
        dataRows,
        previewRowLimit,
        maxColumnCount,
        columns: importColumns,
        mapping: { ...autoMapping }
      };

      emitSemanticEvent('data:extract', {
        reason: 'parseCSV',
        delimiter,
        hasHeader,
        totalRows: dataRows.length,
        previewRowLimit
      });

      return preview;
    } catch (error) {
      const normalizedDelimiter = normalizeCsvDelimiter(options.delimiter);
      const fallbackDelimiter = normalizedDelimiter === 'auto' ? ',' : normalizedDelimiter;
      const importColumns = resolveImportColumnBindings(normalizedColumns.value);
      const emptyMapping: CsvImportMapping = {};

      for (let columnIndex = 0; columnIndex < importColumns.length; columnIndex += 1) {
        emptyMapping[importColumns[columnIndex].columnId] = null;
      }

      const fatalError =
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'Failed to parse CSV input';

      csvImportSession.value = null;

      emitSemanticEvent('data:extract', {
        reason: 'parseCSVError',
        delimiter: fallbackDelimiter,
        hasHeader,
        previewRowLimit,
        message: fatalError
      });

      return {
        delimiter: fallbackDelimiter,
        hasHeader,
        headers: [],
        totalRows: 0,
        previewRowLimit,
        truncated: false,
        mapping: emptyMapping,
        columns: importColumns.map((column) => ({
          columnId: column.columnId,
          field: column.field,
          header: column.header,
          sourceIndex: null,
          sourceHeader: null
        })),
        rows: [],
        fatalError
      };
    }
  }

  function commitCSVImport(
    mapping?: CsvImportMapping,
    options: CommitCsvImportOptions = {}
  ): CsvImportResult<TRow> {
    const mode = options.mode === 'replace' ? 'replace' : 'append';
    const skipInvalidRows = options.skipInvalidRows ?? true;
    const session = csvImportSession.value;

    if (!session) {
      return {
        importedRowCount: 0,
        skippedRowCount: 0,
        totalRows: 0,
        mode,
        errors: []
      };
    }

    const resolvedMapping = normalizeImportMapping(mapping, session);
    const importRows = buildCsvImportRows(
      session.dataRows,
      session.hasHeader,
      session.columns,
      resolvedMapping
    );

    const errorRows = importRows.filter((row) => row.errors.length > 0);
    const validRows = importRows.filter((row) => row.errors.length === 0);
    const rowsToCommit =
      !skipInvalidRows && errorRows.length > 0 ? [] : validRows.map((row) => row.values as TRow);

    if (mode === 'replace') {
      normalizedRows.value = [...rowsToCommit];
    } else if (rowsToCommit.length > 0) {
      normalizedRows.value = [...normalizedRows.value, ...rowsToCommit];
    }

    const result: CsvImportResult<TRow> = {
      importedRowCount: rowsToCommit.length,
      skippedRowCount: importRows.length - rowsToCommit.length,
      totalRows: importRows.length,
      mode,
      errors: errorRows
    };

    emitSemanticEvent('data:modify', {
      reason: 'commitCSVImport',
      mode,
      skipInvalidRows,
      importedRowCount: result.importedRowCount,
      skippedRowCount: result.skippedRowCount,
      totalRows: result.totalRows
    });

    return result;
  }

  function resetState(): void {
    clearAllDebounceTimers();

    const viewportHeight = state.value.viewport.viewportHeight;
    state.value = createInitialState(viewportHeight);
    editingDraft.value = null;
    editingError.value = null;
    csvImportSession.value = null;
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
    setPageIndex,
    setPageSize,
    getColumnFacetOptions,
    toggleRow,
    isSelected,
    clearSelection,
    selectAll,
    getSelectedKeys,
    toggleSort,
    setViewport,
    scrollToRow,
    startEdit,
    setEditDraft,
    commitEdit,
    cancelEdit,
    exportCSV,
    parseCSV,
    commitCSVImport,
    toggleRowExpansion,
    expandAllRows,
    collapseAllRows,
    isRowExpanded,
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
    editingDraft,
    editingError,
    paginationEnabled,
    pageIndex,
    pageSize,
    pageCount,
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
