/**
 * Sorting management module for IOI Table.
 * Handles sort state and operations.
 */

import type { Ref } from 'vue';
import type { IoiSemanticEvent, IoiSemanticEventType, IoiTableState, SortState } from '../../types';
import { toggleSortState } from '../../utils/sort';

/**
 * Sorting API returned to the composable.
 */
export interface SortingApi {
  setSortState: (sortState: SortState[]) => void;
  toggleSort: (field: string, multi?: boolean) => void;
}

/**
 * Options for sorting module.
 */
export interface SortingOptions {
  onSortChange?: (sortState: SortState[]) => void;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates sorting management functions.
 */
export function createSorting(
  state: Ref<IoiTableState>,
  options: SortingOptions,
  emitEvent: EventEmitter
): SortingApi {
  function setSortState(sortState: SortState[]): void {
    const nextSortState = sortState
      .filter((entry) => entry.field && (entry.direction === 'asc' || entry.direction === 'desc'))
      .map((entry) => ({
        field: entry.field,
        direction: entry.direction
      })) as SortState[];

    if (
      nextSortState.length === state.value.sort.length &&
      nextSortState.every(
        (entry, index) =>
          entry.field === state.value.sort[index]?.field &&
          entry.direction === state.value.sort[index]?.direction
      )
    ) {
      return;
    }

    state.value = {
      ...state.value,
      sort: nextSortState
    };

    emitEvent('data:sort', {
      sort: nextSortState
    });

    options.onSortChange?.(nextSortState);
  }

  function toggleSort(field: string, multi = false): void {
    const nextSortState = toggleSortState(state.value.sort, field, multi);
    setSortState(nextSortState);
  }

  return {
    setSortState,
    toggleSort
  };
}

// Re-export toggleSortState for backward compatibility
export { toggleSortState } from '../../utils/sort';
