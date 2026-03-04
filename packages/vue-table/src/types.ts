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
  rowIndex: number;
  field: string;
}

export interface ViewportState {
  scrollTop: number;
  viewportHeight: number;
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
}

export interface IoiTableOptions<TRow = Record<string, unknown>> {
  rows?: TRow[];
  columns?: ColumnDef<TRow>[];
  rowKey?: keyof TRow | ((row: TRow, index: number) => string | number);
  rowHeight?: number;
  overscan?: number;
  viewportHeight?: number;
}

export interface ExportCsvOptions {
  includeHeader?: boolean;
  delimiter?: ',' | ';' | '\t';
}

export interface IoiTableActions<TRow = Record<string, unknown>> {
  setRows: (rows: TRow[]) => void;
  setColumns: (columns: ColumnDef<TRow>[]) => void;
  setSortState: (sortState: SortState[]) => void;
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  clearColumnFilter: (field: string) => void;
  setGlobalSearch: (text: string) => void;
  clearAllFilters: () => void;
  toggleSort: (field: string, multi?: boolean) => void;
  setViewport: (scrollTop: number, viewportHeight?: number) => void;
  scrollToRow: (index: number) => void;
  exportCSV: (options?: ExportCsvOptions) => string;
  resetState: () => void;
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

export interface RowClickPayload<TRow = Record<string, unknown>> {
  row: TRow;
  rowIndex: number;
}
