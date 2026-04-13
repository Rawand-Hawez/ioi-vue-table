import IoiTable from './components/IoiTable.vue';

export { IoiTable };
export const Table = IoiTable;
export const DataTable = IoiTable;

export { useIoiTable } from './composables/useIoiTable';
export { createInMemoryColumnStateAdapter, useColumnState } from './composables/useColumnState';
export type {
  ColumnPinState,
  ColumnSizingUpdate,
  ColumnStateColumn,
  ColumnStatePersistenceAdapter,
  ColumnStateSnapshot
} from './composables/useColumnState';

export type {
  AggregationType,
  ColumnFilter,
  ColumnGroup,
  ColumnGroupHeaderSlotProps,
  CommitCsvImportOptions,
  CellSlotProps,
  ColumnDef,
  CsvDelimiter,
  CsvImportMapping,
  CsvImportMode,
  CsvImportPreview,
  CsvImportPreviewColumn,
  CsvImportPreviewRow,
  CsvImportResult,
  CsvImportSource,
  CsvImportValidationError,
  DateColumnFilter,
  DateFilterOperator,
  ExportCsvHeaderMode,
  ExportCsvOptions,
  ExportCsvScope,
  FilterState,
  GroupHeader,
  GroupHeaderSlotProps,
  HeaderFilterSlotProps,
  HeaderSlotProps,
  IoiCellCommitPayload,
  IoiClipboardCopyPayload,
  IoiGroupExpandPayload,
  IoiGroupRenderEntry,
  IoiPaginationChangePayload,
  IoiPaginationOptions,
  IoiPaginationState,
  IoiRenderEntry,
  IoiRowExpandPayload,
  IoiRowRenderEntry,
  IoiRowReorderPayload,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableActions,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  NumberBetweenColumnFilter,
  NumberColumnFilter,
  NumberFilterOperator,
  NumberValueColumnFilter,
  ParseCsvOptions,
  RowClickPayload,
  SelectAllScope,
  SelectionMode,
  ServerDataOptions,
  ServerFetchParams,
  ServerFetchResult,
  SortState,
  StartEditOptions,
  TextColumnFilter,
  TextFilterOperator,
  AutoSizeOptions,
  ToggleRowOptions
} from './types';

import './styles.css';
