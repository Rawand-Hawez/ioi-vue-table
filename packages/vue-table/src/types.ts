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

export interface ColumnGroup {
  /** Unique identifier for the group. */
  id: string;
  /** Display label for the spanning header cell. */
  header: string;
  /** Column ids (or field names) that belong to this group. */
  columnIds: string[];
}

export interface ColumnGroupHeaderSlotProps {
  group: ColumnGroup;
  colspan: number;
}

export interface IoiRowReorderPayload<TRow = Record<string, unknown>> {
  /** Source index in the original data array (normalizedRows). */
  fromIndex: number;
  /** Destination index in the original data array (normalizedRows). */
  toIndex: number;
  /** The row object at the source index. */
  row: TRow;
}

export interface IoiClipboardCopyPayload {
  format: 'tsv';
  rowCount: number;
  columnCount: number;
  includesHeader: boolean;
}

export interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string;
  field: keyof TRow | string;
  header?: string;
  type?: 'text' | 'number' | 'date';
  headerFilter?: 'text' | 'select';
  editable?: boolean;
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
  /** Maximum number of imported data rows allowed for this parse. */
  maxRows?: number;
  /** Maximum CSV input size allowed for this parse, in bytes. */
  maxSizeBytes?: number;
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
  /** Loading state for server-side mode */
  loading: boolean;
  /** Error message for server-side mode */
  error: string | null;
  /** Total rows from server (for server-side pagination) */
  serverTotalRows: number | null;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface GroupHeader {
  key: string;
  value: unknown;
  count: number;
  aggregations: Record<string, number>;
}

export interface IoiGroupRenderEntry {
  type: 'group';
  renderKey: string;
  group: GroupHeader;
}

export interface IoiRowRenderEntry<TRow = Record<string, unknown>> {
  type: 'row';
  renderKey: string;
  row: TRow;
  rowIndex: number;
}

export type IoiRenderEntry<TRow = Record<string, unknown>> =
  | IoiGroupRenderEntry
  | IoiRowRenderEntry<TRow>;

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
  /** Maximum number of CSV data rows allowed during import parsing. */
  csvMaxRows?: number;
  /** Maximum CSV input size allowed during import parsing, in bytes. */
  csvMaxSizeBytes?: number;
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
  /** Data mode: 'client' (default) for local data, 'server' for server-side fetching */
  dataMode?: 'client' | 'server';
  /** Server-side data options (required when dataMode is 'server') */
  serverOptions?: ServerDataOptions<TRow>;
  /** Expanded group keys for controlled mode. */
  expandedGroupKeys?: Array<string>;
  /** Enable Ctrl+C copy of selected rows as TSV. Defaults to true when selection is enabled. */
  copyable?: boolean;
  /** Enable row drag-and-drop reorder. Adds a drag handle cell to each row. */
  rowDraggable?: boolean;
  /** Column groups (spanning headers) — single-level only in v0.2.5. */
  columnGroups?: ColumnGroup[];
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
  /** Toggles group expansion state. */
  toggleGroupExpansion: (groupKey: string) => void;
  /** Expands all groups. */
  expandAllGroups: () => void;
  /** Collapses all groups. */
  collapseAllGroups: () => void;
  /** Checks if a group is expanded. */
  isGroupExpanded: (groupKey: string) => boolean;
  /** Gets the row key for a given row index. Returns null if rowKey is not configured. */
  getRowKey: (rowIndex: number) => string | number | null;
  resetState: () => void;
  /** Copies currently selected rows to the clipboard as tab-separated values. */
  copySelectionToClipboard: () => Promise<void>;
  /** Refreshes server-side data (only applicable in server mode). */
  refresh: () => void;
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
  renderEntries: ComputedRef<IoiRenderEntry<TRow>[]>;
  groups: ComputedRef<Array<{ key: string; value: unknown; indices: number[]; count: number; aggregations: Record<string, number> }>>;
  lastEvent: Ref<IoiSemanticEvent<unknown> | null>;
  /** Loading state (for server-side mode) */
  loading: ComputedRef<boolean>;
  /** Error state (for server-side mode) */
  error: ComputedRef<string | null>;
  /** Fetch more rows for infinite scroll (server mode only) */
  fetchMore: () => Promise<void>;
  /** Whether more rows are available (server mode only) */
  hasMore: ComputedRef<boolean>;
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

export interface GroupHeaderSlotProps {
  group: GroupHeader;
  expanded: boolean;
  toggle: () => void;
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

// ============================================================================
// Server-Side Mode Types
// ============================================================================

/** Parameters sent to server fetch function */
export interface ServerFetchParams {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Current page size */
  pageSize: number;
  /** Current sort state */
  sort: SortState[];
  /** Current column filters */
  filters: FilterState[];
  /** Current global search text */
  globalSearch: string;
  /** Cursor for cursor-based pagination (optional) */
  cursor?: string | null;
}

/** Result returned from server fetch function */
export interface ServerFetchResult<TRow = Record<string, unknown>> {
  /** Rows for current page */
  rows: TRow[];
  /** Total row count (for page-based pagination) */
  totalRows: number;
  /** Total page count (optional, calculated from totalRows if omitted) */
  pageCount?: number;
  /** Next cursor for cursor-based pagination (optional) */
  nextCursor?: string | null;
  /** Whether there are more rows to fetch (for infinite scroll) */
  hasMore?: boolean;
}

/** Options for server-side data mode */
export interface ServerDataOptions<TRow = Record<string, unknown>> {
  /** Fetch function called when data needs to be loaded */
  fetch: (params: ServerFetchParams) => Promise<ServerFetchResult<TRow>>;
  /** Debounce delay in ms for fetch calls (default: 300) */
  debounceMs?: number;
  /** Initial page size (default: 50) */
  initialPageSize?: number;
  /** Enable cursor-based pagination instead of page-based */
  cursorMode?: boolean;
  /** Callback when fetch starts */
  onFetchStart?: () => void;
  /** Callback when fetch succeeds */
  onFetchSuccess?: (result: ServerFetchResult<TRow>) => void;
  /** Callback when fetch fails */
  onFetchError?: (error: Error) => void;
}

/** Options for the autoSizeColumns method */
export interface AutoSizeOptions {
  /** Include header cell widths in the calculation (default: true) */
  includeHeaders?: boolean;
  /** Extra padding added to each measured cell in pixels (default: 16) */
  padding?: number;
  /** Minimum column width in pixels (default: 50) */
  minWidth?: number;
  /** Maximum column width in pixels (default: 500) */
  maxWidth?: number;
}

