/**
 * Facet options module for IOI Table.
 * Handles calculation of unique values for filter dropdowns.
 */

import type { ComputedRef, Ref } from 'vue';
import type { ColumnDef, FilterState } from '../../types';
import { applyFilters } from '../../utils/filter';
import { stringifyFacetValue } from './utils';

/**
 * Options for facets module.
 */
export interface FacetsOptions<TRow> {
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  filters: Ref<FilterState[]>;
  globalSearch: Ref<string>;
  baseIndices: ComputedRef<number[]>;
  columnKeyMap: ComputedRef<Map<string, ColumnDef<TRow>>>;
}

/**
 * Path getter function type.
 */
type PathGetter<TRow> = (row: TRow, path: string) => unknown;

/**
 * Creates facet options management.
 */
export function createFacets<TRow>(
  options: FacetsOptions<TRow>,
  getFieldValue: PathGetter<TRow>
): {
  getColumnFacetOptions: (field: string) => string[];
} {
  const { rows, columns, filters, globalSearch, baseIndices, columnKeyMap } = options;

  function getColumnFacetOptions(field: string): string[] {
    const normalizedKey = String(field);
    if (!normalizedKey) {
      return [];
    }

    const keyMap = columnKeyMap.value;
    const targetColumn = keyMap.get(normalizedKey);
    const targetFieldPath = targetColumn ? String(targetColumn.field) : normalizedKey;
    const excludedKeys = new Set<string>([normalizedKey, targetFieldPath]);

    if (targetColumn?.id) {
      excludedKeys.add(targetColumn.id);
    }

    const otherFilters = filters.value.filter((entry) => {
      if (excludedKeys.has(entry.field)) {
        return false;
      }

      const resolvedColumn = keyMap.get(entry.field);
      if (!resolvedColumn) {
        return true;
      }

      if (excludedKeys.has(String(resolvedColumn.field))) {
        return false;
      }

      if (resolvedColumn.id && excludedKeys.has(resolvedColumn.id)) {
        return false;
      }

      return true;
    });

    const facetIndices = applyFilters(
      baseIndices.value,
      rows.value,
      otherFilters,
      globalSearch.value,
      columns.value,
      getFieldValue
    );

    const optionSet = new Set<string>();

    for (let index = 0; index < facetIndices.length; index += 1) {
      const rowIndex = facetIndices[index];
      const row = rows.value[rowIndex];

      if (row === undefined) {
        continue;
      }

      const value = getFieldValue(row, targetFieldPath);

      if (Array.isArray(value)) {
        for (let valueIndex = 0; valueIndex < value.length; valueIndex += 1) {
          const candidate = stringifyFacetValue(value[valueIndex]).trim();
          if (candidate.length > 0) {
            optionSet.add(candidate);
          }
        }
        continue;
      }

      const candidate = stringifyFacetValue(value).trim();
      if (candidate.length > 0) {
        optionSet.add(candidate);
      }
    }

    const facetOptions = Array.from(optionSet);
    facetOptions.sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
    );
    return facetOptions;
  }

  return {
    getColumnFacetOptions
  };
}
