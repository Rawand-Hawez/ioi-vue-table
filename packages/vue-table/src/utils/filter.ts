import type { ColumnDef, ColumnFilter, FilterState, NumberColumnFilter, TextColumnFilter } from '../types';

type PathGetter<TRow> = (row: TRow, path: string) => unknown;

const MILLISECONDS_PER_DAY = 86_400_000;

function parseNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseDateValue(value: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const timestamp = Date.parse(trimmed);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return null;
}

function toUtcDayKey(timestamp: number): number {
  return Math.floor(timestamp / MILLISECONDS_PER_DAY);
}

function stringifyForSearch(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? value.toISOString() : '';
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized ?? '';
  } catch {
    return String(value);
  }
}

function normalizeText(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLocaleLowerCase();
}

function getTextCandidates(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => stringifyForSearch(entry));
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [stringifyForSearch(value)];
}

function matchesTextOperator(candidate: string, query: string, operator: NonNullable<TextColumnFilter['operator']>): boolean {
  if (operator === 'equals') {
    return candidate === query;
  }

  if (operator === 'startsWith') {
    return candidate.startsWith(query);
  }

  return candidate.includes(query);
}

function matchesTextFilter(value: unknown, filter: TextColumnFilter): boolean {
  const operator = filter.operator ?? 'contains';
  const caseSensitive = filter.caseSensitive ?? false;
  const query = normalizeText(filter.value, caseSensitive);

  if (query.length === 0) {
    return true;
  }

  const candidates = getTextCandidates(value);
  if (candidates.length === 0) {
    return false;
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const normalizedCandidate = normalizeText(candidates[index], caseSensitive);
    if (matchesTextOperator(normalizedCandidate, query, operator)) {
      return true;
    }
  }

  return false;
}

function matchesNumberFilter(value: unknown, filter: NumberColumnFilter): boolean {
  const numericValue = parseNumberValue(value);
  if (numericValue === null) {
    return false;
  }

  if (filter.operator === 'between') {
    const min = parseNumberValue(filter.min);
    const max = parseNumberValue(filter.max);
    if (min === null && max === null) {
      return true;
    }

    if (min === null) {
      return numericValue <= (max as number);
    }

    if (max === null) {
      return numericValue >= min;
    }

    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return numericValue >= lower && numericValue <= upper;
  }

  const target = parseNumberValue(filter.value);
  if (target === null) {
    return true;
  }

  if (filter.operator === 'eq') {
    return numericValue === target;
  }

  if (filter.operator === 'lt') {
    return numericValue < target;
  }

  if (filter.operator === 'lte') {
    return numericValue <= target;
  }

  if (filter.operator === 'gt') {
    return numericValue > target;
  }

  return numericValue >= target;
}

function matchesDateFilter(value: unknown, filter: Extract<ColumnFilter, { type: 'date' }>): boolean {
  const timestamp = parseDateValue(value);
  const targetTimestamp = parseDateValue(filter.value);

  if (timestamp === null || targetTimestamp === null) {
    return false;
  }

  if (filter.operator === 'before') {
    return timestamp < targetTimestamp;
  }

  if (filter.operator === 'after') {
    return timestamp > targetTimestamp;
  }

  return toUtcDayKey(timestamp) === toUtcDayKey(targetTimestamp);
}

function matchesColumnFilter(value: unknown, filter: ColumnFilter): boolean {
  if (filter.type === 'text') {
    return matchesTextFilter(value, filter);
  }

  if (filter.type === 'number') {
    return matchesNumberFilter(value, filter);
  }

  return matchesDateFilter(value, filter);
}

function isActiveFilter(filter: ColumnFilter): boolean {
  if (filter.type === 'text') {
    return filter.value.trim().length > 0;
  }

  if (filter.type === 'number') {
    if (filter.operator === 'between') {
      return parseNumberValue(filter.min) !== null || parseNumberValue(filter.max) !== null;
    }

    return parseNumberValue(filter.value) !== null;
  }

  return parseDateValue(filter.value) !== null;
}

function buildColumnMap<TRow>(columns: readonly ColumnDef<TRow>[]): Map<string, ColumnDef<TRow>> {
  const map = new Map<string, ColumnDef<TRow>>();

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    map.set(String(column.field), column);

    if (column.id) {
      map.set(column.id, column);
    }
  }

  return map;
}

function matchesGlobalSearch<TRow>(
  row: TRow,
  searchText: string,
  searchableColumns: readonly ColumnDef<TRow>[],
  pathGet: PathGetter<TRow>
): boolean {
  for (let index = 0; index < searchableColumns.length; index += 1) {
    const column = searchableColumns[index];
    const value = pathGet(row, String(column.field));
    const candidates = getTextCandidates(value);

    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      if (candidates[candidateIndex].toLocaleLowerCase().includes(searchText)) {
        return true;
      }
    }
  }

  return false;
}

export function applyFilters<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  filters: readonly FilterState[],
  globalSearch: string,
  columns: readonly ColumnDef<TRow>[],
  pathGet: PathGetter<TRow>
): number[] {
  const normalizedSearch = globalSearch.trim().toLocaleLowerCase();
  const activeFilters = filters.filter((entry) => entry.field && isActiveFilter(entry.filter));

  if (activeFilters.length === 0 && normalizedSearch.length === 0) {
    return [...indices];
  }

  const columnMap = buildColumnMap(columns);
  const searchableColumns = columns.filter((column) => !column.hidden);
  const nextIndices: number[] = [];

  for (let index = 0; index < indices.length; index += 1) {
    const rowIndex = indices[index];
    const row = rows[rowIndex];

    if (row === undefined) {
      continue;
    }

    let matchesAllColumnFilters = true;

    for (let filterIndex = 0; filterIndex < activeFilters.length; filterIndex += 1) {
      const filterState = activeFilters[filterIndex];
      const column = columnMap.get(filterState.field);
      const fieldPath = column ? String(column.field) : filterState.field;
      const value = pathGet(row, fieldPath);

      if (!matchesColumnFilter(value, filterState.filter)) {
        matchesAllColumnFilters = false;
        break;
      }
    }

    if (!matchesAllColumnFilters) {
      continue;
    }

    if (normalizedSearch.length > 0 && !matchesGlobalSearch(row, normalizedSearch, searchableColumns, pathGet)) {
      continue;
    }

    nextIndices.push(rowIndex);
  }

  return nextIndices;
}
