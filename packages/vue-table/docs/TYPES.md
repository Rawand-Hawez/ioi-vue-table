# TypeScript Types Reference

All types are exported from `@ioi-dev/vue-table`:

```typescript
import type { ColumnDef, IoiTableApi, /* ... */ } from '@ioi-dev/vue-table'
```

## Table of Contents

- [Core Types](#core-types)
- [Column Types](#column-types)
- [Filter Types](#filter-types)
- [Sort Types](#sort-types)
- [Pagination Types](#pagination-types)
- [Selection Types](#selection-types)
- [Editing Types](#editing-types)
- [CSV Types](#csv-types)
- [Slot Types](#slot-types)
- [Event Types](#event-types)
- [Virtualization Types](#virtualization-types)
- [Column State Types](#column-state-types)

---

## Core Types

### `ColumnDef<TRow>`

Defines a table column.

```typescript
interface ColumnDef<TRow = Record<string, unknown>> {
  id?: string
  field: keyof TRow | string
  header?: string
  type?: 'text' | 'number' | 'date'
  headerFilter?: 'text' | 'select'
  validate?: (value: unknown, row: TRow) => true | string
  comparator?: (
    valueA: unknown,
    valueB: unknown,
    rowA: TRow | undefined,
    rowB: TRow | undefined
  ) => number
  width?: number | string
  minWidth?: number
  maxWidth?: number
  hidden?: boolean
  pin?: 'left' | 'right' | 'none'
}
```

### `IoiTableOptions<TRow>`

Options passed to `useIoiTable` or component props.

```typescript
interface IoiTableOptions<TRow = Record<string, unknown>> {
  rows?: TRow[]
  columns?: ColumnDef<TRow>[]
  rowKey?: keyof TRow | ((row: TRow, index: number) => string | number)
  selectionMode?: SelectionMode
  rowHeight?: number
  overscan?: number
  viewportHeight?: number
  globalSearchDebounceMs?: number
  filterDebounceMs?: number
  defaultCsvPreviewRowLimit?: number
  pagination?: IoiPaginationOptions
  onPaginationChange?: (payload: IoiPaginationChangePayload) => void
  onCellCommit?: (payload: IoiCellCommitPayload<TRow>) => void
  onRowUpdate?: (payload: IoiCellCommitPayload<TRow>) => void
}
```

### `IoiTableApi<TRow>`

The return type of `useIoiTable`. Contains all reactive state and actions.

```typescript
interface IoiTableApi<TRow = Record<string, unknown>> extends IoiTableActions<TRow> {
  schemaVersion: 1
  rows: Ref<TRow[]>
  columns: Ref<ColumnDef<TRow>[]>
  rowHeight: Ref<number>
  overscan: Ref<number>
  state: Ref<IoiTableState>
  editingDraft: Ref<unknown>
  editingError: Ref<string | null>
  paginationEnabled: ComputedRef<boolean>
  pageIndex: ComputedRef<number>
  pageSize: ComputedRef<number>
  pageCount: ComputedRef<number>
  totalRows: ComputedRef<number>
  totalHeight: ComputedRef<number>
  baseIndices: ComputedRef<number[]>
  filteredIndices: ComputedRef<number[]>
  sortedIndices: ComputedRef<number[]>
  virtualRange: ComputedRef<VirtualRange>
  virtualPaddingTop: ComputedRef<number>
  virtualPaddingBottom: ComputedRef<number>
  visibleIndices: ComputedRef<number[]>
  visibleRows: ComputedRef<TRow[]>
  lastEvent: Ref<IoiSemanticEvent<unknown> | null>
  actions: IoiTableActions<TRow>
}
```

### `IoiTableState`

Current table state.

```typescript
interface IoiTableState {
  sort: SortState[]
  filters: FilterState[]
  globalSearch: string
  selectedRowKeys: Array<string | number>
  editingCell: EditingCellState | null
  viewport: ViewportState
}
```

### `IoiTableActions<TRow>`

All action methods available on the API.

```typescript
interface IoiTableActions<TRow = Record<string, unknown>> {
  setRows: (rows: TRow[]) => void
  setColumns: (columns: ColumnDef<TRow>[]) => void
  setSortState: (sortState: SortState[]) => void
  setColumnFilter: (field: string, filter: ColumnFilter) => void
  clearColumnFilter: (field: string) => void
  setGlobalSearch: (text: string) => void
  clearAllFilters: () => void
  setPageIndex: (pageIndex: number) => void
  setPageSize: (pageSize: number) => void
  getColumnFacetOptions: (field: string) => string[]
  toggleRow: (key: string | number, options?: ToggleRowOptions) => void
  isSelected: (key: string | number) => boolean
  clearSelection: () => void
  selectAll: (scope?: SelectAllScope) => void
  getSelectedKeys: () => Array<string | number>
  toggleSort: (field: string, multi?: boolean) => void
  setViewport: (scrollTop: number, viewportHeight?: number) => void
  scrollToRow: (index: number) => void
  startEdit: (options: StartEditOptions) => void
  setEditDraft: (value: unknown) => void
  commitEdit: () => boolean
  cancelEdit: () => void
  exportCSV: (options?: ExportCsvOptions) => string
  parseCSV: (fileOrText: CsvImportSource, options?: ParseCsvOptions) => Promise<CsvImportPreview<TRow>>
  commitCSVImport: (mapping?: CsvImportMapping, options?: CommitCsvImportOptions) => CsvImportResult<TRow>
  resetState: () => void
  emitSemanticEvent: <TPayload>(type: IoiSemanticEventType, payload: TPayload) => IoiSemanticEvent<TPayload>
}
```

---

## Column Types

### `ColumnDef`

See [Core Types](#columndeftrow).

---

## Filter Types

### `FilterState`

```typescript
interface FilterState {
  field: string
  filter: ColumnFilter
}
```

### `ColumnFilter`

Union type for all column filter types.

```typescript
type ColumnFilter = TextColumnFilter | NumberColumnFilter | DateColumnFilter
```

### `TextColumnFilter`

```typescript
interface TextColumnFilter {
  type: 'text'
  value: string
  operator?: TextFilterOperator
  caseSensitive?: boolean
}
```

### `TextFilterOperator`

```typescript
type TextFilterOperator = 'contains' | 'equals' | 'startsWith'
```

### `NumberColumnFilter`

```typescript
type NumberColumnFilter = NumberValueColumnFilter | NumberBetweenColumnFilter
```

### `NumberValueColumnFilter`

```typescript
interface NumberValueColumnFilter {
  type: 'number'
  operator: Exclude<NumberFilterOperator, 'between'>
  value: number | string | null | undefined
}
```

### `NumberBetweenColumnFilter`

```typescript
interface NumberBetweenColumnFilter {
  type: 'number'
  operator: 'between'
  min: number | string | null | undefined
  max: number | string | null | undefined
}
```

### `NumberFilterOperator`

```typescript
type NumberFilterOperator = 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between'
```

### `DateColumnFilter`

```typescript
interface DateColumnFilter {
  type: 'date'
  operator: DateFilterOperator
  value: Date | string | null | undefined
}
```

### `DateFilterOperator`

```typescript
type DateFilterOperator = 'before' | 'after' | 'on'
```

---

## Sort Types

### `SortState`

```typescript
interface SortState {
  field: string
  direction: 'asc' | 'desc'
}
```

---

## Pagination Types

### `IoiPaginationState`

```typescript
interface IoiPaginationState {
  pageIndex: number
  pageSize: number
}
```

### `IoiPaginationOptions`

```typescript
interface IoiPaginationOptions {
  pageIndex?: number
  pageSize?: number
}
```

### `IoiPaginationChangePayload`

```typescript
interface IoiPaginationChangePayload extends IoiPaginationState {
  pageCount: number
  rowCount: number
  reason: 'setPageIndex' | 'setPageSize' | 'autoReset' | 'clamp' | 'resetState' | 'meta'
}
```

---

## Selection Types

### `SelectionMode`

```typescript
type SelectionMode = 'single' | 'multi'
```

### `SelectAllScope`

```typescript
type SelectAllScope = 'visible' | 'filtered' | 'allLoaded'
```

### `ToggleRowOptions`

```typescript
interface ToggleRowOptions {
  shiftKey?: boolean
}
```

---

## Editing Types

### `EditingCellState`

```typescript
interface EditingCellState {
  field: string
  rowKey?: string | number
  rowIndex?: number
}
```

### `StartEditOptions`

```typescript
interface StartEditOptions {
  field: string
  rowKey?: string | number
  rowIndex?: number
  value?: unknown
}
```

### `IoiCellCommitPayload<TRow>`

```typescript
interface IoiCellCommitPayload<TRow = Record<string, unknown>> {
  row: TRow
  rowIndex: number
  rowKey: string | number | null
  field: string
  oldValue: unknown
  newValue: unknown
}
```

---

## CSV Types

### `ExportCsvOptions`

```typescript
interface ExportCsvOptions {
  includeHeader?: boolean
  delimiter?: ',' | ';' | '\t'
  scope?: ExportCsvScope
  includeHiddenColumns?: boolean
  headerMode?: ExportCsvHeaderMode
  sanitizeFormulas?: boolean
  formulaEscapePrefix?: "'" | '\t'
}
```

### `ExportCsvScope`

```typescript
type ExportCsvScope = 'visible' | 'filtered' | 'selected' | 'allLoaded'
```

### `ExportCsvHeaderMode`

```typescript
type ExportCsvHeaderMode = 'field' | 'header'
```

### `CsvDelimiter`

```typescript
type CsvDelimiter = ',' | ';' | '\t'
```

### `CsvImportSource`

```typescript
type CsvImportSource = string | Blob
```

### `CsvImportMode`

```typescript
type CsvImportMode = 'append' | 'replace'
```

### `ParseCsvOptions`

```typescript
interface ParseCsvOptions {
  delimiter?: CsvDelimiter | 'auto'
  hasHeader?: boolean
  previewRowLimit?: number
}
```

### `CsvImportPreview<TRow>`

```typescript
interface CsvImportPreview<TRow = Record<string, unknown>> {
  delimiter: CsvDelimiter
  hasHeader: boolean
  headers: string[]
  totalRows: number
  previewRowLimit: number
  truncated: boolean
  mapping: CsvImportMapping
  columns: CsvImportPreviewColumn[]
  rows: CsvImportPreviewRow<TRow>[]
  fatalError?: string | null
}
```

### `CsvImportMapping`

```typescript
type CsvImportMapping = Record<string, number | null>
```

### `CsvImportPreviewColumn`

```typescript
interface CsvImportPreviewColumn {
  columnId: string
  field: string
  header: string
  sourceIndex: number | null
  sourceHeader: string | null
}
```

### `CsvImportPreviewRow<TRow>`

```typescript
interface CsvImportPreviewRow<TRow = Record<string, unknown>> {
  rowNumber: number
  values: Partial<TRow>
  errors: CsvImportValidationError[]
}
```

### `CsvImportValidationError`

```typescript
interface CsvImportValidationError {
  columnId: string
  field: string
  message: string
  value: unknown
}
```

### `CommitCsvImportOptions`

```typescript
interface CommitCsvImportOptions {
  mode?: CsvImportMode
  skipInvalidRows?: boolean
}
```

### `CsvImportResult<TRow>`

```typescript
interface CsvImportResult<TRow = Record<string, unknown>> {
  importedRowCount: number
  skippedRowCount: number
  totalRows: number
  mode: CsvImportMode
  errors: CsvImportPreviewRow<TRow>[]
}
```

---

## Slot Types

### `CellSlotProps<TRow>`

```typescript
interface CellSlotProps<TRow = Record<string, unknown>> {
  row: TRow
  rowIndex: number
  column: ColumnDef<TRow>
  columnIndex: number
  value: unknown
}
```

### `HeaderSlotProps<TRow>`

```typescript
interface HeaderSlotProps<TRow = Record<string, unknown>> {
  column: ColumnDef<TRow>
  columnIndex: number
}
```

### `HeaderFilterSlotProps<TRow>`

```typescript
interface HeaderFilterSlotProps<TRow = Record<string, unknown>> {
  column: ColumnDef<TRow>
  columnIndex: number
  mode: 'text' | 'select'
  value: string
  options?: string[]
  setValue: (value: string) => void
  clear: () => void
}
```

---

## Event Types

### `IoiSemanticEvent<TPayload>`

```typescript
interface IoiSemanticEvent<TPayload = unknown> {
  type: IoiSemanticEventType
  schemaVersion: 1
  payload: TPayload
  timestamp: string
}
```

### `IoiSemanticEventType`

```typescript
type IoiSemanticEventType =
  | 'data:filter'
  | 'data:sort'
  | 'data:select'
  | 'data:modify'
  | 'data:extract'
  | 'data:explore'
```

### `RowClickPayload<TRow>`

```typescript
interface RowClickPayload<TRow = Record<string, unknown>> {
  row: TRow
  rowIndex: number
}
```

---

## Virtualization Types

### `ViewportState`

```typescript
interface ViewportState {
  scrollTop: number
  viewportHeight: number
}
```

### `VirtualRange`

```typescript
interface VirtualRange {
  start: number
  end: number
}
```

---

## Column State Types

### `ColumnStateSnapshot`

```typescript
interface ColumnStateSnapshot {
  order: string[]
  visibility: Record<string, boolean>
  pin: Record<string, ColumnPinState>
  sizing: Record<string, ColumnSizingUpdate>
}
```

### `ColumnPinState`

```typescript
type ColumnPinState = 'left' | 'right' | 'none'
```

### `ColumnSizingUpdate`

```typescript
interface ColumnSizingUpdate {
  width?: number
}
```

### `ColumnStateColumn`

```typescript
interface ColumnStateColumn {
  id: string
  field: string
  hidden?: boolean
  pin?: 'left' | 'right' | 'none'
  width?: number | string
}
```

### `ColumnStatePersistenceAdapter`

```typescript
interface ColumnStatePersistenceAdapter {
  load: () => ColumnStateSnapshot | null
  save: (snapshot: ColumnStateSnapshot) => void
}
```
