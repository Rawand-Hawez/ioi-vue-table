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
  ColumnFilter,
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
  HeaderSlotProps,
  IoiCellCommitPayload,
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
  SortState,
  StartEditOptions,
  TextColumnFilter,
  TextFilterOperator,
  ToggleRowOptions
} from './types';

import './styles.css';
