/**
 * Filtering management module for IOI Table.
 * Handles filter state, debouncing, and filter operations.
 */

import type { Ref } from 'vue';
import type {
  ColumnFilter,
  FilterState,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableState
} from '../../types';

/**
 * Filtering API returned to the composable.
 */
export interface FilteringApi {
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  clearColumnFilter: (field: string) => void;
  setGlobalSearch: (text: string) => void;
  clearAllFilters: () => void;
}

/**
 * Options for filtering module.
 */
export interface FilteringOptions {
  filterDebounceMs: Ref<number>;
  globalSearchDebounceMs: Ref<number>;
}

/**
 * Dependencies for filtering module.
 */
export interface FilteringDeps {
  state: Ref<IoiTableState>;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates filtering management functions.
 */
export function createFiltering(
  deps: FilteringDeps,
  options: FilteringOptions,
  emitEvent: EventEmitter
): {
  api: FilteringApi;
  clearAllDebounceTimers: () => void;
} {
  const { state } = deps;
  const { filterDebounceMs, globalSearchDebounceMs } = options;

  const filterDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let globalSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearFilterDebounceTimer(field: string): void {
    const timer = filterDebounceTimers.get(field);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    filterDebounceTimers.delete(field);
  }

  function clearAllDebounceTimers(): void {
    for (const [field, timer] of filterDebounceTimers.entries()) {
      clearTimeout(timer);
      filterDebounceTimers.delete(field);
    }

    if (globalSearchDebounceTimer) {
      clearTimeout(globalSearchDebounceTimer);
      globalSearchDebounceTimer = null;
    }
  }

  function areFiltersEqual(filterA: ColumnFilter, filterB: ColumnFilter): boolean {
    if (filterA.type !== filterB.type) {
      return false;
    }

    if (filterA.type === 'text' && filterB.type === 'text') {
      return (
        filterA.value === filterB.value &&
        (filterA.operator ?? 'contains') === (filterB.operator ?? 'contains') &&
        (filterA.caseSensitive ?? false) === (filterB.caseSensitive ?? false)
      );
    }

    if (filterA.type === 'number' && filterB.type === 'number') {
      if (filterA.operator === 'between' && filterB.operator === 'between') {
        return filterA.min === filterB.min && filterA.max === filterB.max;
      }
      if (filterA.operator !== 'between' && filterB.operator !== 'between') {
        return filterA.value === filterB.value && filterA.operator === filterB.operator;
      }
      return false;
    }

    if (filterA.type === 'date' && filterB.type === 'date') {
      return filterA.value === filterB.value && filterA.operator === filterB.operator;
    }

    return false;
  }

  function applyColumnFilter(field: string, filter: ColumnFilter): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const existingIndex = state.value.filters.findIndex((entry) => entry.field === normalizedField);
    const nextFilters = [...state.value.filters];
    const nextFilterState: FilterState = {
      field: normalizedField,
      filter
    };

    if (existingIndex === -1) {
      nextFilters.push(nextFilterState);
    } else {
      const existing = nextFilters[existingIndex];
      if (existing && existing.field === normalizedField) {
        if (areFiltersEqual(existing.filter, filter)) {
          return;
        }
      }

      nextFilters[existingIndex] = nextFilterState;
    }

    state.value = {
      ...state.value,
      filters: nextFilters
    };

    emitEvent('data:filter', {
      filters: nextFilters,
      globalSearch: state.value.globalSearch
    });
  }

  function setColumnFilter(field: string, filter: ColumnFilter): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const debounceMs = filterDebounceMs.value;
    if (debounceMs <= 0) {
      applyColumnFilter(normalizedField, filter);
      return;
    }

    clearFilterDebounceTimer(normalizedField);
    const timer = setTimeout(() => {
      filterDebounceTimers.delete(normalizedField);
      applyColumnFilter(normalizedField, filter);
    }, debounceMs);
    filterDebounceTimers.set(normalizedField, timer);
  }

  function applyClearColumnFilter(field: string): void {
    const normalizedField = String(field);
    const nextFilters = state.value.filters.filter((entry) => entry.field !== normalizedField);

    if (nextFilters.length === state.value.filters.length) {
      return;
    }

    state.value = {
      ...state.value,
      filters: nextFilters
    };

    emitEvent('data:filter', {
      filters: nextFilters,
      globalSearch: state.value.globalSearch
    });
  }

  function clearColumnFilter(field: string): void {
    const normalizedField = String(field);
    if (!normalizedField) {
      return;
    }

    const debounceMs = filterDebounceMs.value;
    if (debounceMs <= 0) {
      applyClearColumnFilter(normalizedField);
      return;
    }

    clearFilterDebounceTimer(normalizedField);
    const timer = setTimeout(() => {
      filterDebounceTimers.delete(normalizedField);
      applyClearColumnFilter(normalizedField);
    }, debounceMs);
    filterDebounceTimers.set(normalizedField, timer);
  }

  function applyGlobalSearch(text: string): void {
    const nextGlobalSearch = text;
    if (nextGlobalSearch === state.value.globalSearch) {
      return;
    }

    state.value = {
      ...state.value,
      globalSearch: nextGlobalSearch
    };

    emitEvent('data:filter', {
      filters: state.value.filters,
      globalSearch: nextGlobalSearch
    });
  }

  function setGlobalSearch(text: string): void {
    const debounceMs = globalSearchDebounceMs.value;
    if (debounceMs <= 0) {
      applyGlobalSearch(text);
      return;
    }

    if (globalSearchDebounceTimer) {
      clearTimeout(globalSearchDebounceTimer);
    }

    globalSearchDebounceTimer = setTimeout(() => {
      globalSearchDebounceTimer = null;
      applyGlobalSearch(text);
    }, debounceMs);
  }

  function clearAllFilters(): void {
    clearAllDebounceTimers();

    if (state.value.filters.length === 0 && state.value.globalSearch.length === 0) {
      return;
    }

    state.value = {
      ...state.value,
      filters: [],
      globalSearch: ''
    };

    emitEvent('data:filter', {
      filters: [],
      globalSearch: ''
    });
  }

  return {
    api: {
      setColumnFilter,
      clearColumnFilter,
      setGlobalSearch,
      clearAllFilters
    },
    clearAllDebounceTimers
  };
}
