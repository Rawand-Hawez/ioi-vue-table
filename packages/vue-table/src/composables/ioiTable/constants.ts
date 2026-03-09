import type { CsvDelimiter } from '../../types';

export const SCHEMA_VERSION = 1 as const;
export const DEFAULT_ROW_HEIGHT = 36;
export const DEFAULT_OVERSCAN = 5;
export const DEFAULT_VIEWPORT_HEIGHT = 320;
export const DEFAULT_CSV_PREVIEW_ROW_LIMIT = 200;
export const DEFAULT_CSV_MAX_ROWS = 100_000;
export const DEFAULT_CSV_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CSV_DELIMITER_SAMPLE_ROWS = 30;
export const CSV_DELIMITERS: CsvDelimiter[] = [',', ';', '\t'];
// eslint-disable-next-line no-control-regex -- intentionally matches leading control chars and spaces
export const CSV_FORMULA_PREFIX_PATTERN = /^[\u0000-\u0020]*[=+\-@]/;
export const SELECTION_ROW_KEY_WARNING =
  '[IOI Table] Selection is disabled because `rowKey` is not configured.';
