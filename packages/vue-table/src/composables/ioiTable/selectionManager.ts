/**
 * Selection management module for IOI Table.
 * Handles row selection state and operations.
 */

import type { ComputedRef, Ref } from 'vue';
import type {
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableOptions,
  IoiTableState,
  SelectAllScope,
  SelectionMode
} from '../../types';
import { normalizeSelectedKeys } from './selection';
import { SELECTION_ROW_KEY_WARNING } from './constants';
import { get as getNestedPathValue } from '../../utils/nestedPath';

/**
 * Selection API returned to the composable.
 */
export interface SelectionApi {
  toggleRow: (key: string | number, options?: { shiftKey?: boolean }) => void;
  isSelected: (key: string | number) => boolean;
  clearSelection: () => void;
  selectAll: (scope?: SelectAllScope) => void;
  getSelectedKeys: () => Array<string | number>;
}

/**
 * Options for selection module.
 */
export interface SelectionOptions<TRow> {
  rowKey: IoiTableOptions<TRow>['rowKey'];
  selectionMode: ComputedRef<SelectionMode>;
  selectionEnabled: ComputedRef<boolean>;
}

/**
 * Dependencies for selection module.
 */
export interface SelectionDeps<TRow> {
  state: Ref<IoiTableState>;
  rows: Ref<TRow[]>;
  sortedIndices: ComputedRef<number[]>;
  baseIndices: ComputedRef<number[]>;
  visibleIndices: ComputedRef<number[]>;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates selection management functions.
 */
export function createSelection<TRow>(
  deps: SelectionDeps<TRow>,
  options: SelectionOptions<TRow>,
  emitEvent: EventEmitter
): {
  api: SelectionApi;
  lastSelectedKey: Ref<string | number | null>;
  resolveRowSelectionKey: (row: TRow, index: number) => string | number | null;
  resolveSelectionKeyByIndex: (index: number) => string | number | null;
  collectSelectionKeys: (indices: readonly number[]) => Array<string | number>;
  hasWarnedSelectionDisabled: Ref<boolean>;
} {
  const { state, rows, sortedIndices, baseIndices, visibleIndices } = deps;
  const { rowKey, selectionMode, selectionEnabled } = options;

  const lastSelectedKey = ref<string | number | null>(null);
  const hasWarnedSelectionDisabled = ref(false);

  function warnSelectionDisabled(): void {
    if (hasWarnedSelectionDisabled.value) {
      return;
    }

    hasWarnedSelectionDisabled.value = true;
    console.warn(SELECTION_ROW_KEY_WARNING);
  }

  function resolveRowSelectionKey(row: TRow, index: number): string | number | null {
    if (!rowKey) {
      return null;
    }

    if (typeof rowKey === 'function') {
      const resolvedKey = rowKey(row, index);
      return typeof resolvedKey === 'string' || typeof resolvedKey === 'number' ? resolvedKey : null;
    }

    const value = getNestedPathValue(row, String(rowKey));
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  function resolveSelectionKeyByIndex(index: number): string | number | null {
    const row = rows.value[index];
    if (row === undefined) {
      return null;
    }

    return resolveRowSelectionKey(row, index);
  }

  function collectSelectionKeys(indices: readonly number[]): Array<string | number> {
    const keys: Array<string | number> = [];

    for (let index = 0; index < indices.length; index += 1) {
      const key = resolveSelectionKeyByIndex(indices[index]);
      if (key !== null) {
        keys.push(key);
      }
    }

    return normalizeSelectedKeys(keys);
  }

  function getSortedSelectionKeys(): Array<string | number> {
    return collectSelectionKeys(sortedIndices.value);
  }

  function setSelectedKeys(nextKeys: Array<string | number>, reason: string): void {
    const normalizedKeys = normalizeSelectedKeys(nextKeys);
    const currentKeys = state.value.selectedRowKeys;

    if (
      normalizedKeys.length === currentKeys.length &&
      normalizedKeys.every((key, index) => key === currentKeys[index])
    ) {
      return;
    }

    state.value = {
      ...state.value,
      selectedRowKeys: normalizedKeys
    };

    emitEvent('data:select', {
      reason,
      selectedRowKeys: normalizedKeys
    });
  }

  function toggleRow(key: string | number, options?: { shiftKey?: boolean }): void {
    if (!selectionEnabled.value) {
      warnSelectionDisabled();
      return;
    }

    const currentKeys = state.value.selectedRowKeys;
    const isAlreadySelected = currentKeys.includes(key);
    const isSingleSelection = selectionMode.value === 'single';

    if (isSingleSelection) {
      const nextKeys = isAlreadySelected && currentKeys.length === 1 ? [] : [key];
      lastSelectedKey.value = nextKeys.length > 0 ? key : null;
      setSelectedKeys(nextKeys, 'toggleRow');
      return;
    }

    if (options?.shiftKey && lastSelectedKey.value !== null) {
      const orderedKeys = getSortedSelectionKeys();
      const anchorIndex = orderedKeys.indexOf(lastSelectedKey.value);
      const targetIndex = orderedKeys.indexOf(key);

      if (anchorIndex !== -1 && targetIndex !== -1) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeKeys = orderedKeys.slice(start, end + 1);
        setSelectedKeys([...currentKeys, ...rangeKeys], 'shiftRange');
        lastSelectedKey.value = key;
        return;
      }
    }

    const nextKeys = isAlreadySelected
      ? currentKeys.filter((selectedKey) => selectedKey !== key)
      : [...currentKeys, key];

    lastSelectedKey.value = isAlreadySelected ? null : key;
    setSelectedKeys(nextKeys, 'toggleRow');
  }

  function isSelected(key: string | number): boolean {
    return state.value.selectedRowKeys.includes(key);
  }

  function clearSelection(): void {
    lastSelectedKey.value = null;
    setSelectedKeys([], 'clearSelection');
  }

  function selectAll(scope: SelectAllScope = 'filtered'): void {
    if (!selectionEnabled.value) {
      warnSelectionDisabled();
      return;
    }

    const indices =
      scope === 'visible'
        ? visibleIndices.value
        : scope === 'allLoaded'
          ? baseIndices.value
          : sortedIndices.value;

    const nextKeys = collectSelectionKeys(indices);

    if (selectionMode.value === 'single') {
      const singleKey = nextKeys[0];
      setSelectedKeys(singleKey !== undefined ? [singleKey] : [], `selectAll:${scope}`);
      lastSelectedKey.value = singleKey ?? null;
      return;
    }

    setSelectedKeys(nextKeys, `selectAll:${scope}`);
    lastSelectedKey.value = nextKeys.length > 0 ? nextKeys[nextKeys.length - 1] : null;
  }

  function getSelectedKeys(): Array<string | number> {
    return [...state.value.selectedRowKeys];
  }

  return {
    api: {
      toggleRow,
      isSelected,
      clearSelection,
      selectAll,
      getSelectedKeys
    },
    lastSelectedKey,
    resolveRowSelectionKey,
    resolveSelectionKeyByIndex,
    collectSelectionKeys,
    hasWarnedSelectionDisabled
  };
}

// Import ref at the top level
import { ref } from 'vue';
