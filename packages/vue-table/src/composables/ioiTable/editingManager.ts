/**
 * Cell editing management module for IOI Table.
 * Handles cell editing state and operations.
 */

import type { ComputedRef, Ref } from 'vue';
import type {
  ColumnDef,
  IoiCellCommitPayload,
  IoiSemanticEvent,
  IoiSemanticEventType,
  IoiTableOptions,
  IoiTableState,
  StartEditOptions
} from '../../types';
import { get as getNestedPathValue, set as setNestedPathValue } from '../../utils/nestedPath';
import { resolveValidationMessage } from './editing';

/**
 * Editing API returned to the composable.
 */
export interface EditingApi {
  startEdit: (options: StartEditOptions) => void;
  setEditDraft: (value: unknown) => void;
  commitEdit: () => boolean;
  cancelEdit: () => void;
}

/**
 * Editing state exposed to the composable.
 */
export interface EditingState {
  draft: Ref<unknown>;
  error: Ref<string | null>;
}

/**
 * Options for editing module.
 */
export interface EditingOptions<TRow> {
  onCellCommit?: IoiTableOptions<TRow>['onCellCommit'];
  onRowUpdate?: IoiTableOptions<TRow>['onRowUpdate'];
}

/**
 * Dependencies for editing module.
 */
export interface EditingDeps<TRow> {
  state: Ref<IoiTableState>;
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  resolveSelectionKeyByIndex: (index: number) => string | number | null;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Path getter function type.
 */
type PathGetter<TRow> = (row: TRow, path: string) => unknown;

/**
 * Creates editing management functions.
 */
export function createEditing<TRow>(
  deps: EditingDeps<TRow>,
  options: EditingOptions<TRow>,
  emitEvent: EventEmitter,
  getFieldValue: PathGetter<TRow>
): {
  api: EditingApi;
  state: EditingState;
  resolveEditRowIndex: (editingCell: { rowKey?: string | number; rowIndex?: number }) => number;
} {
  const { state, rows, columns, resolveSelectionKeyByIndex } = deps;
  const { onCellCommit, onRowUpdate } = options;

  const editingDraft = ref<unknown>(null);
  const editingError = ref<string | null>(null);

  function resolveEditRowIndex(editingCell: { rowKey?: string | number; rowIndex?: number }): number {
    if (editingCell.rowKey !== undefined && editingCell.rowKey !== null) {
      // Find row by key
      for (let index = 0; index < rows.value.length; index += 1) {
        const rowKey = resolveSelectionKeyByIndex(index);
        if (rowKey === editingCell.rowKey) {
          return index;
        }
      }
    }

    if (
      typeof editingCell.rowIndex === 'number' &&
      editingCell.rowIndex >= 0 &&
      editingCell.rowIndex < rows.value.length
    ) {
      return editingCell.rowIndex;
    }

    return -1;
  }

  function clearEditingState(): void {
    state.value = {
      ...state.value,
      editingCell: null
    };
    editingDraft.value = null;
    editingError.value = null;
  }

  function startEdit(editOptions: StartEditOptions): void {
    const field = String(editOptions.field);
    if (!field) {
      return;
    }

    const rowIndex = resolveEditRowIndex({
      rowKey: editOptions.rowKey,
      rowIndex: editOptions.rowIndex
    });

    if (rowIndex === -1) {
      return;
    }

    const row = rows.value[rowIndex];
    if (row === undefined) {
      return;
    }

    const rowKey = resolveSelectionKeyByIndex(rowIndex);
    state.value = {
      ...state.value,
      editingCell: {
        field,
        rowIndex,
        rowKey: rowKey ?? undefined
      }
    };
    editingDraft.value =
      editOptions.value !== undefined ? editOptions.value : getFieldValue(row, field);
    editingError.value = null;
  }

  function setEditDraft(value: unknown): void {
    if (!state.value.editingCell) {
      return;
    }

    editingDraft.value = value;
    editingError.value = null;
  }

  function commitEdit(): boolean {
    const editingCell = state.value.editingCell;
    if (!editingCell) {
      return false;
    }

    const rowIndex = resolveEditRowIndex(editingCell);
    if (rowIndex === -1) {
      editingError.value = 'Row not found';
      return false;
    }

    const row = rows.value[rowIndex];
    if (!row) {
      editingError.value = 'Row not found';
      return false;
    }

    const field = editingCell.field;
    const column = columns.value.find((entry) => String(entry.field) === field);
    const draftValue = editingDraft.value;

    if (column?.validate) {
      const validationResult = column.validate(draftValue, row);
      if (validationResult !== true) {
        editingError.value = resolveValidationMessage(validationResult);
        return false;
      }
    }

    const oldValue = getFieldValue(row, field);
    const updatedRow = (typeof structuredClone === 'function'
      ? structuredClone(row)
      : JSON.parse(JSON.stringify(row))) as TRow;
    setNestedPathValue(updatedRow, field, draftValue);
    const nextRows = [...rows.value];
    nextRows[rowIndex] = updatedRow;
    rows.value = nextRows;

    const payload: IoiCellCommitPayload<TRow> = {
      row: updatedRow,
      rowIndex,
      rowKey: resolveSelectionKeyByIndex(rowIndex),
      field,
      oldValue,
      newValue: draftValue
    };

    onCellCommit?.(payload);
    onRowUpdate?.(payload);
    emitEvent('data:modify', {
      reason: 'commitEdit',
      ...payload
    });
    clearEditingState();

    return true;
  }

  function cancelEdit(): void {
    if (!state.value.editingCell) {
      return;
    }

    clearEditingState();
  }

  return {
    api: {
      startEdit,
      setEditDraft,
      commitEdit,
      cancelEdit
    },
    state: {
      draft: editingDraft,
      error: editingError
    },
    resolveEditRowIndex
  };
}

// Import ref at the top level
import { ref } from 'vue';
