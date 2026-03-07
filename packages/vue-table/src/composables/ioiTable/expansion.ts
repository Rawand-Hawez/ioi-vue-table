/**
 * Row expansion module for IOI Table.
 * Handles row expand/collapse operations.
 */

import type { ComputedRef, Ref } from 'vue';
import type { IoiRowExpandPayload, IoiSemanticEvent, IoiSemanticEventType, IoiTableState } from '../../types';

/**
 * Row expansion API returned to the composable.
 */
export interface ExpansionApi {
  toggleRowExpansion: (key: string | number) => void;
  expandAllRows: () => void;
  collapseAllRows: () => void;
  isRowExpanded: (key: string | number) => boolean;
}

/**
 * Options for row expansion module.
 */
export interface ExpansionOptions<TRow> {
  expandable: ComputedRef<boolean>;
  rowExpandable?: (row: TRow, index: number) => boolean;
  onRowExpand?: (payload: IoiRowExpandPayload<TRow>) => void;
}

/**
 * Dependencies for row expansion.
 */
export interface ExpansionDeps<TRow> {
  state: Ref<IoiTableState>;
  rows: Ref<TRow[]>;
  sortedIndices: ComputedRef<number[]>;
  resolveRowKey: (row: TRow, index: number) => string | number | null;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates row expansion management functions.
 */
export function createExpansion<TRow>(
  deps: ExpansionDeps<TRow>,
  options: ExpansionOptions<TRow>,
  emitEvent: EventEmitter
): ExpansionApi {
  const { state, rows, sortedIndices, resolveRowKey } = deps;
  const { rowExpandable, onRowExpand } = options;

  function toggleRowExpansion(key: string | number): void {
    const currentKeys = state.value.expandedRowKeys;
    const keySet = new Set(currentKeys);
    const wasExpanded = keySet.has(key);

    if (wasExpanded) {
      keySet.delete(key);
    } else {
      keySet.add(key);
    }

    const nextKeys = Array.from(keySet);

    state.value = {
      ...state.value,
      expandedRowKeys: nextKeys
    };

    const sortedPosition = sortedIndices.value.findIndex((idx) => {
      const rowKey = resolveRowKey(rows.value[idx] as TRow, idx);
      return rowKey === key;
    });

    if (sortedPosition !== -1) {
      const sourceRowIndex = sortedIndices.value[sortedPosition];
      const row = rows.value[sourceRowIndex];
      if (row) {
        const payload: IoiRowExpandPayload<TRow> = {
          row,
          rowIndex: sourceRowIndex,
          rowKey: key,
          expanded: !wasExpanded
        };

        onRowExpand?.(payload);

        emitEvent('data:explore', {
          reason: 'rowExpansion',
          rowKey: key,
          expanded: !wasExpanded
        });
      }
    }
  }

  function expandAllRows(): void {
    const allKeys = sortedIndices.value
      .filter((idx) => {
        // Check if row is expandable
        if (rowExpandable) {
          const row = rows.value[idx];
          return row ? rowExpandable(row, idx) : false;
        }
        return true;
      })
      .map((idx) => resolveRowKey(rows.value[idx] as TRow, idx))
      .filter((key): key is string | number => key !== null);

    state.value = {
      ...state.value,
      expandedRowKeys: allKeys
    };

    emitEvent('data:explore', {
      reason: 'expandAllRows',
      count: allKeys.length
    });
  }

  function collapseAllRows(): void {
    state.value = {
      ...state.value,
      expandedRowKeys: []
    };

    emitEvent('data:explore', {
      reason: 'collapseAllRows',
      count: 0
    });
  }

  function isRowExpanded(key: string | number): boolean {
    return state.value.expandedRowKeys.includes(key);
  }

  return {
    toggleRowExpansion,
    expandAllRows,
    collapseAllRows,
    isRowExpanded
  };
}
