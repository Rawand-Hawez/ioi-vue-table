/**
 * Internal types for IOI Table composable modules.
 * These types are not part of the public API.
 */

import type {
  ColumnDef,
  CsvDelimiter,
  CsvImportMapping
} from '../../types';

/**
 * Column definition for CSV export.
 */
export interface ExportColumn {
  fieldPath: string;
  header: string;
}

/**
 * Binding between a column and CSV import source.
 */
export interface ImportColumnBinding<TRow> {
  columnId: string;
  field: string;
  header: string;
  column: Pick<ColumnDef<TRow>, 'type' | 'validate'>;
}

/**
 * Parsed CSV import session state.
 */
export interface ParsedCsvImportSession<TRow> {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  headers: string[];
  dataRows: string[][];
  previewRowLimit: number;
  maxColumnCount: number;
  columns: ImportColumnBinding<TRow>[];
  mapping: CsvImportMapping;
}

/**
 * Debounce timer management.
 */
export interface FilterDebounceTimers {
  column: Map<string, ReturnType<typeof setTimeout>>;
  globalSearch: ReturnType<typeof setTimeout> | null;
}

/**
 * Event emitter function type.
 */
export type EventEmitter<TPayload = unknown> = (
  type: import('../../types').IoiSemanticEventType,
  payload: TPayload
) => import('../../types').IoiSemanticEvent<TPayload>;
