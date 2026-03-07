import type { AggregationType as AggregationTypeEnum } from '../../types';
import { get as getNestedPathValue } from '../../utils/nestedPath';

export interface GroupInfo {
  key: string;
  value: unknown;
  indices: number[];
  count: number;
  aggregations: Record<string, number>;
}

const GROUP_KEY_DELIMITER = '\x00';
const GROUP_KEY_ESCAPE = '\x01';

function encodeGroupValue(v: unknown): string {
  if (v === null) {
    return `${GROUP_KEY_ESCAPE}n`;
  }
  if (v === undefined) {
    return `${GROUP_KEY_ESCAPE}u`;
  }

  const str = String(v);
  let result = `${GROUP_KEY_ESCAPE}s`;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === GROUP_KEY_DELIMITER || char === GROUP_KEY_ESCAPE) {
      result += `${GROUP_KEY_ESCAPE}${char}`;
    } else {
      result += char;
    }
  }
  return result;
}

export function calculateGroups<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  groupBy: string | string[],
  groupAggregations?: Record<string, AggregationTypeEnum[]>
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
    const groupKey = groupValues.map(encodeGroupValue).join(GROUP_KEY_DELIMITER);

    const existing = groups.get(groupKey);
    if (existing) {
      existing.indices.push(rowIndex);
      existing.count = existing.indices.length;
    } else {
      groups.set(groupKey, {
        key: groupKey,
        value: groupValues.length === 1 ? groupValues[0] : groupValues,
        indices: [rowIndex],
        count: 1,
        aggregations: {}
      });
    }
  }

  if (groupAggregations && Object.keys(groupAggregations).length > 0) {
    for (const group of groups.values()) {
      group.aggregations = calculateGroupAggregations(
        group.indices,
        rows,
        groupAggregations
      );
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

export function calculateAggregation<TRow>(
  indices: readonly number[],
  rows: readonly TRow[],
  field: string,
  type: AggregationTypeEnum
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
  aggregations: Record<string, AggregationTypeEnum[]>
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
