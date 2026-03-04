import type { ColumnDef, SortState } from '../types';

type PathGetter<TRow> = (row: TRow, path: string) => unknown;

interface ComparableValue {
  isNull: boolean;
  value: number | string | null;
}

interface DefaultCompareResult {
  result: number;
  usedNullOrdering: boolean;
}

const textCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});

function compareNumbers(left: number, right: number): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function compareText(left: string, right: string): number {
  return textCollator.compare(left, right);
}

function prepareNumberValue(value: unknown): ComparableValue {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { isNull: false, value };
  }

  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return { isNull: false, value: parsed };
    }
  }

  return { isNull: true, value: null };
}

function prepareDateValue(value: unknown): ComparableValue {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    if (Number.isFinite(timestamp)) {
      return { isNull: false, value: timestamp };
    }

    return { isNull: true, value: null };
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return { isNull: false, value: timestamp };
    }
  }

  return { isNull: true, value: null };
}

function prepareTextValue(value: unknown): ComparableValue {
  return {
    isNull: false,
    value: String(value)
  };
}

function compareDefaultValues(
  type: ColumnDef['type'],
  leftValue: unknown,
  rightValue: unknown
): DefaultCompareResult {
  const leftComparable =
    type === 'number'
      ? prepareNumberValue(leftValue)
      : type === 'date'
        ? prepareDateValue(leftValue)
        : prepareTextValue(leftValue);
  const rightComparable =
    type === 'number'
      ? prepareNumberValue(rightValue)
      : type === 'date'
        ? prepareDateValue(rightValue)
        : prepareTextValue(rightValue);

  if (leftComparable.isNull && rightComparable.isNull) {
    return { result: 0, usedNullOrdering: true };
  }

  if (leftComparable.isNull) {
    return { result: 1, usedNullOrdering: true };
  }

  if (rightComparable.isNull) {
    return { result: -1, usedNullOrdering: true };
  }

  if (type === 'number' || type === 'date') {
    return {
      result: compareNumbers(leftComparable.value as number, rightComparable.value as number),
      usedNullOrdering: false
    };
  }

  return {
    result: compareText(leftComparable.value as string, rightComparable.value as string),
    usedNullOrdering: false
  };
}

function compareNullishValues(leftValue: unknown, rightValue: unknown): number {
  const leftNullish = leftValue === null || leftValue === undefined;
  const rightNullish = rightValue === null || rightValue === undefined;

  if (leftNullish && rightNullish) {
    return 0;
  }

  if (leftNullish) {
    return 1;
  }

  if (rightNullish) {
    return -1;
  }

  return 0;
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

export function toggleSortState(
  currentSortState: readonly SortState[],
  field: string,
  multi = false
): SortState[] {
  const targetField = String(field);
  const existingIndex = currentSortState.findIndex((entry) => entry.field === targetField);

  if (existingIndex === -1) {
    const nextEntry: SortState = { field: targetField, direction: 'asc' };
    return multi ? [...currentSortState, nextEntry] : [nextEntry];
  }

  const existingEntry = currentSortState[existingIndex];

  if (existingEntry.direction === 'asc') {
    const nextEntry: SortState = { field: targetField, direction: 'desc' };

    if (!multi) {
      return [nextEntry];
    }

    const nextState = [...currentSortState];
    nextState[existingIndex] = nextEntry;
    return nextState;
  }

  if (!multi) {
    return [];
  }

  return currentSortState.filter((_, index) => index !== existingIndex);
}

export function applySort<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  sortState: readonly SortState[],
  columns: readonly ColumnDef<TRow>[],
  pathGet: PathGetter<TRow>
): number[] {
  if (indices.length <= 1 || sortState.length === 0) {
    return [...indices];
  }

  const columnMap = buildColumnMap(columns);
  const sortable = indices.map((rowIndex, order) => ({ rowIndex, order }));

  sortable.sort((leftItem, rightItem) => {
    const leftRow = rows[leftItem.rowIndex];
    const rightRow = rows[rightItem.rowIndex];

    for (let sortIndex = 0; sortIndex < sortState.length; sortIndex += 1) {
      const rule = sortState[sortIndex];
      const column = columnMap.get(rule.field);
      const path = column ? String(column.field) : rule.field;
      const leftValue = leftRow === undefined ? undefined : pathGet(leftRow, path);
      const rightValue = rightRow === undefined ? undefined : pathGet(rightRow, path);

      const nullishCompareResult = compareNullishValues(leftValue, rightValue);
      if (nullishCompareResult !== 0) {
        return nullishCompareResult;
      }

      const compared =
        column?.comparator !== undefined
          ? {
              result: column.comparator(leftValue, rightValue, leftRow, rightRow),
              usedNullOrdering: false
            }
          : compareDefaultValues(column?.type, leftValue, rightValue);

      if (compared.result !== 0) {
        if (compared.usedNullOrdering) {
          return compared.result;
        }

        return rule.direction === 'desc' ? -compared.result : compared.result;
      }
    }

    return leftItem.order - rightItem.order;
  });

  return sortable.map((item) => item.rowIndex);
}
