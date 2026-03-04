import IoiTable from './components/IoiTable.vue';

export { IoiTable };
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
  CellSlotProps,
  ColumnDef,
  DateColumnFilter,
  DateFilterOperator,
  ExportCsvOptions,
  FilterState,
  HeaderSlotProps,
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
  RowClickPayload,
  SelectAllScope,
  SelectionMode,
  SortState,
  TextColumnFilter,
  TextFilterOperator,
  ToggleRowOptions
} from './types';

import './styles.css';
