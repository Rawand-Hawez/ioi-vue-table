import type { ColumnDef } from '../../types';
import { get as getNestedPathValue } from '../../utils/nestedPath';

export interface GroupInfo {
  key: string;
  value: unknown;
  indices: number[];
}

export function calculateGroups<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  groupBy: string | string[]
): GroupInfo[] {
  const groupByFields = Array.isArray(groupBy) ? groupBy : [groupBy];
  if (groupByFields.length === 0) {
    return [];
  }

  const groups = new Map<string, GroupInfo>();

  for (let i = 0; i < indices.length; i++) {
    const rowIndex = indices[i];
    const row = rows[rowIndex];
    if (row === undefined) {
      continue;
    }

    const groupValues = groupByFields.map((field) => getNestedPathValue(row, field));
    const groupKey = groupValues.map((v) => (v === null || v === undefined ? '' : String(v))).join('|');

    const existing = groups.get(groupKey);
    if (existing) {
      existing.indices.push(rowIndex);
    } else {
      groups.set(groupKey, {
        key: groupKey,
        value: groupValues.length === 1 ? groupValues[0] : groupValues,
        indices: [rowIndex]
      });
    }
  }

  const groupArray = Array.from(groups.values());
  groupArray.sort((a, b) => {
    const aVal = a.value;
    const bVal = b.value;
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    return String(aVal).localeCompare(String(bVal));
  });

  return groupArray;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export function calculateAggregation<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  field: string,
  type: AggregationType
): number {
  const values: number[] = [];

  for (let i = 0; i < indices.length; i++) {
    const rowIndex = indices[i];
    const row = rows[rowIndex];
    if (row === undefined) {
      continue;
    }

    const value = getNestedPathValue(row, field);
    if (typeof value === 'number' && !isNaN(value)) {
      values.push(value);
    }
  }

  if (values.length === 0) {
    return type === 'count' ? 0 : NaN;
  }

  switch (type) {
    case 'sum':
      return values.reduce((acc, val) => acc + val, 0);
    case 'avg':
      return values.reduce((acc, val) => acc + val, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return NaN;
  }
}

export function calculateGroupAggregations<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  columns: readonly ColumnDef<TRow>[],
  aggregations: Record<string, AggregationType[]>
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [field, types] of Object.entries(aggregations)) {
    for (const type of types) {
      const key = `${field}_${type}`;
      result[key] = calculateAggregation(indices, rows, field, type);
    }
  }

  return result;
}
