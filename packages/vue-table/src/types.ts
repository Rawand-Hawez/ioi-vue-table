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
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  hidden?: boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  field: string;
  value: unknown;
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
