import type { ColumnDef, CsvDelimiter, ExportCsvHeaderMode } from '../../types';
import { normalizePositiveInteger } from '../../utils/number';
import {
  CSV_DELIMITERS,
  CSV_FORMULA_PREFIX_PATTERN,
  DEFAULT_CSV_PREVIEW_ROW_LIMIT
} from './constants';

export function stringifyCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? '';
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export function sanitizeCsvText(
  text: string,
  sanitizeFormulas: boolean,
  formulaEscapePrefix: "'" | '\t'
): string {
  if (!sanitizeFormulas || !CSV_FORMULA_PREFIX_PATTERN.test(text)) {
    return text;
  }

  return `${formulaEscapePrefix}${text}`;
}

export function encodeCsvText(text: string, delimiter: CsvDelimiter): string {
  const escaped = text.replace(/"/g, '""');
  const shouldQuote =
    text.includes(',') ||
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r');

  return shouldQuote ? `"${escaped}"` : escaped;
}

export function encodeCsvField(
  value: unknown,
  delimiter: CsvDelimiter,
  sanitizeFormulas: boolean,
  formulaEscapePrefix: "'" | '\t'
): string {
  const text = stringifyCsvValue(value);
  return encodeCsvText(sanitizeCsvText(text, sanitizeFormulas, formulaEscapePrefix), delimiter);
}

export function resolveHeaderLabel(
  fieldPath: string,
  header: string | undefined,
  headerMode: ExportCsvHeaderMode,
  suffix?: string
): string {
  const baseLabel =
    headerMode === 'header' && typeof header === 'string' && header.trim().length > 0
      ? header
      : fieldPath;

  if (!suffix) {
    return baseLabel;
  }

  return `${baseLabel}.${suffix}`;
}

export function normalizeCsvPreviewRowLimit(previewRowLimit: unknown, fallback?: number): number {
  return normalizePositiveInteger(previewRowLimit, fallback ?? DEFAULT_CSV_PREVIEW_ROW_LIMIT);
}

export function normalizeCsvDelimiter(value: CsvDelimiter | 'auto' | undefined): CsvDelimiter | 'auto' {
  if (value === ',' || value === ';' || value === '\t') {
    return value;
  }

  return 'auto';
}

export function detectCsvDelimiter(text: string): CsvDelimiter {
  const delimiterHits = new Map<CsvDelimiter, number>(
    CSV_DELIMITERS.map((delimiter) => [delimiter, 0])
  );
  let inQuotes = false;
  let sampledRows = 0;
  const maxSampledRows = 30;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!char) {
      continue;
    }

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (inQuotes) {
      continue;
    }

    if (char === '\n') {
      sampledRows += 1;
      if (sampledRows >= maxSampledRows) {
        break;
      }
      continue;
    }

    if (char === '\r') {
      continue;
    }

    for (let delimiterIndex = 0; delimiterIndex < CSV_DELIMITERS.length; delimiterIndex += 1) {
      const delimiter = CSV_DELIMITERS[delimiterIndex];
      if (char === delimiter) {
        delimiterHits.set(delimiter, (delimiterHits.get(delimiter) ?? 0) + 1);
      }
    }
  }

  let bestDelimiter: CsvDelimiter = ',';
  let bestScore = -1;

  for (let delimiterIndex = 0; delimiterIndex < CSV_DELIMITERS.length; delimiterIndex += 1) {
    const delimiter = CSV_DELIMITERS[delimiterIndex];
    const score = delimiterHits.get(delimiter) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

export function resolveCsvDelimiter(
  text: string,
  delimiterOption: CsvDelimiter | 'auto' | undefined
): CsvDelimiter {
  const normalizedDelimiter = normalizeCsvDelimiter(delimiterOption);
  return normalizedDelimiter === 'auto' ? detectCsvDelimiter(text) : normalizedDelimiter;
}

export function parseCsvRows(text: string, delimiter: CsvDelimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (!char) {
      continue;
    }

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
          continue;
        }

        inQuotes = false;
        continue;
      }

      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function normalizeCsvHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function tryParseJsonArray(rawCell: string): { parsed: boolean; value: unknown } {
  const trimmed = rawCell.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return {
      parsed: false,
      value: rawCell
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return {
        parsed: true,
        value: parsed
      };
    }
  } catch {
    return {
      parsed: false,
      value: rawCell
    };
  }

  return {
    parsed: false,
    value: rawCell
  };
}

export function coerceCsvImportValue(
  rawCell: string,
  columnType: ColumnDef['type']
): { value: unknown; typeError: string | null } {
  const trimmed = rawCell.trim();
  if (trimmed.length === 0) {
    return {
      value: null,
      typeError: null
    };
  }

  const parsedArray = tryParseJsonArray(rawCell);
  const baseValue = parsedArray.value;

  if (columnType === 'number') {
    if (typeof baseValue === 'number' && Number.isFinite(baseValue)) {
      return {
        value: baseValue,
        typeError: null
      };
    }

    if (typeof baseValue === 'string') {
      const parsedNumber = Number(baseValue.trim());
      if (Number.isFinite(parsedNumber)) {
        return {
          value: parsedNumber,
          typeError: null
        };
      }
    }

    return {
      value: baseValue,
      typeError: 'Expected number value'
    };
  }

  if (columnType === 'date') {
    if (typeof baseValue === 'string') {
      const normalizedDate = baseValue.trim();
      const timestamp = Date.parse(normalizedDate);
      if (!Number.isNaN(timestamp)) {
        return {
          value: normalizedDate,
          typeError: null
        };
      }
    }

    return {
      value: baseValue,
      typeError: 'Expected date value'
    };
  }

  return {
    value: baseValue,
    typeError: null
  };
}
