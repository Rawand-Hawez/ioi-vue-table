import IoiTable from './components/IoiTable.vue';

export { IoiTable };
export const DataTable = IoiTable;

export { useIoiTable } from './composables/useIoiTable';

export type {
  CellSlotProps,
  ColumnDef,
  ExportCsvOptions,
  HeaderSlotProps,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableActions,
  IoiTableApi,
  IoiTableOptions,
  IoiTableState,
  RowClickPayload
} from './types';

import './styles.css';
