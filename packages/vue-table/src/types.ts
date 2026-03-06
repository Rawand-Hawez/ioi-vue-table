import type { ComputedRef, Ref } from 'vue';

export type IoiSemanticEventType =
  | 'data:filter'
  | 'data:sort'
  | 'data:select'
  | 'data:modify'
  | 'data:extract'
  | 'data:explore';

export interface IoiSemanticEvent<TPayload = unknown> {
  type: IoiSemanticEventType;
  schemaVersion: 1;
  payload: TPayload;
  timestamp: string;
}

export interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string;
  field: keyof TRow | string;
  header?: string;
  type?: 'text' | 'number' | 'date';
  headerFilter?: 'text' | 'select';
  validate?: (value: unknown, row: TRow) => true | string;
  comparator?: (
    valueA: unknown,
    valueB: unknown,
    rowA: TRow | undefined,
    rowB: TRow | undefined
  ) => number;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  hidden?: boolean;
  pin?: 'left' | 'right' | 'none';
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith';

export interface TextColumnFilter {
  type: 'text';
  value: string;
  operator?: TextFilterOperator;
  caseSensitive?: boolean;
}

export type NumberFilterOperator = 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between';

export interface NumberValueColumnFilter {
  type: 'number';
  operator: Exclude<NumberFilterOperator, 'between'>;
  value: number | string | null | undefined;
}

export interface NumberBetweenColumnFilter {
  type: 'number';
  operator: 'between';
  min: number | string | null | undefined;
  max: number | string | null | undefined;
}

export type NumberColumnFilter = NumberValueColumnFilter | NumberBetweenColumnFilter;

export type DateFilterOperator = 'before' | 'after' | 'on';

export interface DateColumnFilter {
  type: 'date';
  operator: DateFilterOperator;
  value: Date | string | null | undefined;
}

export type ColumnFilter = TextColumnFilter | NumberColumnFilter | DateColumnFilter;

export interface FilterState {
  field: string;
  filter: ColumnFilter;
}

export interface EditingCellState {
  field: string;
  rowKey?: string | number;
  rowIndex?: number;
}

export interface ViewportState {
  scrollTop: number;
  viewportHeight: number;
}

export interface IoiPaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface IoiPaginationOptions {
  pageIndex?: number;
  pageSize?: number;
}

export interface IoiPaginationChangePayload extends IoiPaginationState {
  pageCount: number;
  rowCount: number;
  reason: 'setPageIndex' | 'setPageSize' | 'autoReset' | 'clamp' | 'resetState' | 'meta';
}

export type SelectionMode = 'single' | 'multi';
export type SelectAllScope = 'visible' | 'filtered' | 'allLoaded';
export type ExportCsvScope = 'visible' | 'filtered' | 'selected' | 'allLoaded';
export type ExportCsvHeaderMode = 'field' | 'header';
export type CsvDelimiter = ',' | ';' | '\t';
export type CsvImportSource = string | Blob;
export type CsvImportMode = 'append' | 'replace';

export interface ParseCsvOptions {
  delimiter?: CsvDelimiter | 'auto';
  hasHeader?: boolean;
  previewRowLimit?: number;
}

export interface CsvImportValidationError {
  columnId: string;
  field: string;
  message: string;
  value: unknown;
}

export interface CsvImportPreviewColumn {
  columnId: string;
  field: string;
  header: string;
  sourceIndex: number | null;
  sourceHeader: string | null;
}

export type CsvImportMapping = Record<string, number | null>;

export interface CsvImportPreviewRow<TRow = Record<string, unknown>> {
  rowNumber: number;
  values: Partial<TRow>;
  errors: CsvImportValidationError[];
}

export interface CsvImportPreview<TRow = Record<string, unknown>> {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  headers: string[];
  totalRows: number;
  previewRowLimit: number;
  truncated: boolean;
  mapping: CsvImportMapping;
  columns: CsvImportPreviewColumn[];
  rows: CsvImportPreviewRow<TRow>[];
  fatalError?: string | null;
}

export interface CommitCsvImportOptions {
  mode?: CsvImportMode;
  skipInvalidRows?: boolean;
}

export interface CsvImportResult<TRow = Record<string, unknown>> {
  importedRowCount: number;
  skippedRowCount: number;
  totalRows: number;
  mode: CsvImportMode;
  errors: CsvImportPreviewRow<TRow>[];
}

export interface ToggleRowOptions {
  shiftKey?: boolean;
}

export interface VirtualRange {
  start: number;
  end: number;
}

export interface IoiTableState {
  sort: SortState[];
  filters: FilterState[];
  globalSearch: string;
  selectedRowKeys: Array<string | number>;
  editingCell: EditingCellState | null;
  viewport: ViewportState;
  expandedRowKeys: Array<string | number>;
  expandedGroupKeys: Array<string>;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface GroupHeader {
  key: string;
  value: unknown;
  count: number;
  aggregations: Record<string, number>;
}

export interface IoiTableOptions<TRow = Record<string, unknown>> {
  rows?: TRow[];
  columns?: ColumnDef<TRow>[];
  /** Row key selector used for selection/editing identity. */
  rowKey?: keyof TRow | ((row: TRow, index: number) => string | number);
  selectionMode?: SelectionMode;
  /** Virtual row height in pixels. */
  rowHeight?: number;
  /** Number of extra rows rendered before/after the viewport. */
  overscan?: number;
  viewportHeight?: number;
  /** Debounce delay (ms) for global search updates. */
  globalSearchDebounceMs?: number;
  /** Debounce delay (ms) for per-column filter updates. */
  filterDebounceMs?: number;
  /** Default CSV preview limit when parse options omit previewRowLimit. */
  defaultCsvPreviewRowLimit?: number;
  pagination?: IoiPaginationOptions;
  /** Enable row expansion feature. */
  expandable?: boolean;
  /** Function to determine if a row is expandable. */
  rowExpandable?: (row: TRow, index: number) => boolean;
  /** Expanded row keys for controlled mode. */
  expandedRowKeys?: Array<string | number>;
  /** Column field(s) to group by. */
  groupBy?: string | string[];
  /** Aggregation functions to apply to groups. */
  groupAggregations?: Record<string, AggregationType[]>;
  /** Expanded group keys for controlled mode. */
  expandedGroupKeys?: Array<string>;
  onPaginationChange?: (payload: IoiPaginationChangePayload) => void;
  onCellCommit?: (payload: IoiCellCommitPayload<TRow>) => void;
  onRowUpdate?: (payload: IoiCellCommitPayload<TRow>) => void;
  /** Callback when row expansion changes. */
  onRowExpand?: (payload: IoiRowExpandPayload<TRow>) => void;
  /** Callback when group expansion changes. */
  onGroupExpand?: (payload: IoiGroupExpandPayload) => void;
}

export interface ExportCsvOptions {
  includeHeader?: boolean;
  delimiter?: ',' | ';' | '\t';
  scope?: ExportCsvScope;
  includeHiddenColumns?: boolean;
  headerMode?: ExportCsvHeaderMode;
  /** Sanitizes formula-like prefixes to mitigate CSV injection in spreadsheet tools. Defaults to true. */
  sanitizeFormulas?: boolean;
  /** Prefix used when formula sanitization is active. Defaults to `'`. */
  formulaEscapePrefix?: "'" | '\t';
}

export interface StartEditOptions {
  field: string;
  rowKey?: string | number;
  rowIndex?: number;
  value?: unknown;
}

export interface IoiCellCommitPayload<TRow = Record<string, unknown>> {
  row: TRow;
  rowIndex: number;
  rowKey: string | number | null;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IoiTableActions<TRow = Record<string, unknown>> {
  /** Replaces table rows. */
  setRows: (rows: TRow[]) => void;
  /** Replaces table columns. */
  setColumns: (columns: ColumnDef<TRow>[]) => void;
  /** Sets multi-column sort state. */
  setSortState: (sortState: SortState[]) => void;
  /** Sets or replaces a filter for a field. */
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  /** Clears a filter for a field. */
  clearColumnFilter: (field: string) => void;
  /** Sets global search text. */
  setGlobalSearch: (text: string) => void;
  /** Clears all column filters and global search text. */
  clearAllFilters: () => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  getColumnFacetOptions: (field: string) => string[];
  toggleRow: (key: string | number, options?: ToggleRowOptions) => void;
  isSelected: (key: string | number) => boolean;
  clearSelection: () => void;
  selectAll: (scope?: SelectAllScope) => void;
  getSelectedKeys: () => Array<string | number>;
  toggleSort: (field: string, multi?: boolean) => void;
  setViewport: (scrollTop: number, viewportHeight?: number) => void;
  scrollToRow: (index: number) => void;
  startEdit: (options: StartEditOptions) => void;
  setEditDraft: (value: unknown) => void;
  commitEdit: () => boolean;
  cancelEdit: () => void;
  /** Exports table data to CSV. */
  exportCSV: (options?: ExportCsvOptions) => string;
  /** Parses CSV text/blob and returns preview metadata/rows. */
  parseCSV: (
    fileOrText: CsvImportSource,
    options?: ParseCsvOptions
  ) => Promise<CsvImportPreview<TRow>>;
  /** Commits the most recent CSV parse session. */
  commitCSVImport: (mapping?: CsvImportMapping, options?: CommitCsvImportOptions) => CsvImportResult<TRow>;
  /** Toggles row expansion state. */
  toggleRowExpansion: (key: string | number) => void;
  /** Expands all rows. */
  expandAllRows: () => void;
  /** Collapses all rows. */
  collapseAllRows: () => void;
  /** Checks if a row is expanded. */
  isRowExpanded: (key: string | number) => boolean;
  resetState: () => void;
  /** Emits a schema-versioned semantic event. */
  emitSemanticEvent: <TPayload>(
    type: IoiSemanticEventType,
    payload: TPayload
  ) => IoiSemanticEvent<TPayload>;
}

export interface IoiTableApi<TRow = Record<string, unknown>> extends IoiTableActions<TRow> {
  schemaVersion: 1;
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  rowHeight: Ref<number>;
  overscan: Ref<number>;
  state: Ref<IoiTableState>;
  editingDraft: Ref<unknown>;
  editingError: Ref<string | null>;
  paginationEnabled: ComputedRef<boolean>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  pageCount: ComputedRef<number>;
  totalRows: ComputedRef<number>;
  totalHeight: ComputedRef<number>;
  baseIndices: ComputedRef<number[]>;
  filteredIndices: ComputedRef<number[]>;
  sortedIndices: ComputedRef<number[]>;
  virtualRange: ComputedRef<VirtualRange>;
  virtualPaddingTop: ComputedRef<number>;
  virtualPaddingBottom: ComputedRef<number>;
  visibleIndices: ComputedRef<number[]>;
  visibleRows: ComputedRef<TRow[]>;
  lastEvent: Ref<IoiSemanticEvent<unknown> | null>;
  actions: IoiTableActions<TRow>;
}

export interface CellSlotProps<TRow = Record<string, unknown>> {
  row: TRow;
  rowIndex: number;
  column: ColumnDef<TRow>;
  columnIndex: number;
  value: unknown;
}

export interface HeaderSlotProps<TRow = Record<string, unknown>> {
  column: ColumnDef<TRow>;
  columnIndex: number;
}

export interface HeaderFilterSlotProps<TRow = Record<string, unknown>> {
  column: ColumnDef<TRow>;
  columnIndex: number;
  mode: 'text' | 'select';
  value: string;
  options?: string[];
  setValue: (value: string) => void;
  clear: () => void;
}

export interface RowClickPayload<TRow = Record<string, unknown>> {
  row: TRow;
  rowIndex: number;
}

export interface IoiRowExpandPayload<TRow = Record<string, unknown>> {
  row: TRow;
  rowIndex: number;
  rowKey: string | number;
  expanded: boolean;
}

export interface IoiGroupExpandPayload {
  groupKey: string;
  groupValue: unknown;
  expanded: boolean;
  rowCount: number;
}
