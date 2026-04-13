import { computed, type ComputedRef, type Ref, ref } from 'vue';
import type { IoiTableState, IoiTableApi, ColumnDef } from '../../types';

export interface KeyboardOptions<TRow = Record<string, unknown>> {
  state: Ref<IoiTableState>;
  api: IoiTableApi<TRow>;
  columns: Ref<ColumnDef<TRow>[]>;
  rowCount: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  paginationEnabled: ComputedRef<boolean>;
  /** Whether Ctrl+C copy of selection is enabled. Defaults to true. */
  copyable?: ComputedRef<boolean>;
  onFocusChange?: (rowIndex: number, columnIndex?: number) => void;
  onAnnounce?: (message: string) => void;
}

export interface KeyboardApi {
  handleKeyDown: (event: KeyboardEvent) => boolean;
  focusedRowIndex: Ref<number>;
  focusedColumnIndex: Ref<number>;
  isCellNavigationMode: Ref<boolean>;
  setFocusedRow: (index: number) => void;
  setFocusedCell: (rowIndex: number, columnIndex: number) => void;
  enterCellNavigation: () => void;
  exitCellNavigation: () => void;
  getFocusedElementSelector: () => string | null;
}

export function createKeyboardNavigation<TRow = Record<string, unknown>>(
  options: KeyboardOptions<TRow>
): KeyboardApi {
  const {
    state,
    api,
    columns,
    rowCount,
    pageSize,
    copyable,
    onFocusChange,
    onAnnounce
  } = options;

  const focusedRowIndex = ref(0);
  const focusedColumnIndex = ref(0);
  const isCellNavigationMode = ref(false);

  const visibleColumnCount = computed(() => {
    return columns.value.filter((col) => !col.hidden).length;
  });

  function clampRowIndex(index: number): number {
    return Math.max(0, Math.min(index, rowCount.value - 1));
  }

  function clampColumnIndex(index: number): number {
    return Math.max(0, Math.min(index, visibleColumnCount.value - 1));
  }

  function announce(message: string): void {
    onAnnounce?.(message);
  }

  function setFocusedRow(index: number): void {
    focusedRowIndex.value = clampRowIndex(index);
    isCellNavigationMode.value = false;
    onFocusChange?.(focusedRowIndex.value);
  }

  function setFocusedCell(rowIndex: number, columnIndex: number): void {
    focusedRowIndex.value = clampRowIndex(rowIndex);
    focusedColumnIndex.value = clampColumnIndex(columnIndex);
    isCellNavigationMode.value = true;
    onFocusChange?.(focusedRowIndex.value, focusedColumnIndex.value);
  }

  function enterCellNavigation(): void {
    isCellNavigationMode.value = true;
    focusedColumnIndex.value = 0;
    onFocusChange?.(focusedRowIndex.value, focusedColumnIndex.value);
  }

  function exitCellNavigation(): void {
    isCellNavigationMode.value = false;
    onFocusChange?.(focusedRowIndex.value);
  }

  function getFocusedElementSelector(): string | null {
    if (isCellNavigationMode.value) {
      return `[data-row-index="${focusedRowIndex.value}"] [data-col-index="${focusedColumnIndex.value}"]`;
    }
    return `[data-row-index="${focusedRowIndex.value}"]`;
  }

  function handleKeyDown(event: KeyboardEvent): boolean {
    const { key, shiftKey, ctrlKey, metaKey } = event;

    if (state.value.editingCell) {
      switch (key) {
        case 'Escape':
          api.cancelEdit();
          event.preventDefault();
          return true;
        case 'Enter':
          if (api.commitEdit()) {
            event.preventDefault();
            return true;
          }
          return false;
        case 'Tab': {
          event.preventDefault();
          const direction = shiftKey ? -1 : 1;
          const nextColumnIndex = clampColumnIndex(focusedColumnIndex.value + direction);
          if (nextColumnIndex !== focusedColumnIndex.value) {
            focusedColumnIndex.value = nextColumnIndex;
            api.cancelEdit();
          }
          return true;
        }
      }
      return false;
    }

    switch (key) {
      case 'ArrowRight':
        if (!isCellNavigationMode.value) {
          enterCellNavigation();
          event.preventDefault();
          return true;
        }
        event.preventDefault();
        focusedColumnIndex.value = clampColumnIndex(focusedColumnIndex.value + 1);
        onFocusChange?.(focusedRowIndex.value, focusedColumnIndex.value);
        return true;

      case 'ArrowLeft':
        if (isCellNavigationMode.value) {
          event.preventDefault();
          if (focusedColumnIndex.value === 0) {
            exitCellNavigation();
          } else {
            focusedColumnIndex.value = clampColumnIndex(focusedColumnIndex.value - 1);
            onFocusChange?.(focusedRowIndex.value, focusedColumnIndex.value);
          }
          return true;
        }
        return false;

      case 'Home':
        event.preventDefault();
        if (ctrlKey || metaKey) {
          focusedRowIndex.value = 0;
          focusedColumnIndex.value = 0;
          isCellNavigationMode.value = false;
          announce('First row');
        } else {
          focusedRowIndex.value = 0;
          if (isCellNavigationMode.value) {
            focusedColumnIndex.value = 0;
          }
          announce('First row');
        }
        onFocusChange?.(focusedRowIndex.value, isCellNavigationMode.value ? focusedColumnIndex.value : undefined);
        return true;

      case 'End':
        event.preventDefault();
        if (ctrlKey || metaKey) {
          focusedRowIndex.value = Math.max(0, rowCount.value - 1);
          focusedColumnIndex.value = Math.max(0, visibleColumnCount.value - 1);
          isCellNavigationMode.value = false;
          announce('Last row');
        } else {
          focusedRowIndex.value = Math.max(0, rowCount.value - 1);
          if (isCellNavigationMode.value) {
            focusedColumnIndex.value = Math.max(0, visibleColumnCount.value - 1);
          }
          announce('Last row');
        }
        onFocusChange?.(focusedRowIndex.value, isCellNavigationMode.value ? focusedColumnIndex.value : undefined);
        return true;

      case 'PageDown': {
        event.preventDefault();
        const pageDownSize = pageSize.value > 0 ? pageSize.value : 10;
        focusedRowIndex.value = clampRowIndex(focusedRowIndex.value + pageDownSize);
        onFocusChange?.(focusedRowIndex.value, isCellNavigationMode.value ? focusedColumnIndex.value : undefined);
        announce(`Row ${focusedRowIndex.value + 1}`);
        return true;
      }

      case 'PageUp': {
        event.preventDefault();
        const pageUpSize = pageSize.value > 0 ? pageSize.value : 10;
        focusedRowIndex.value = clampRowIndex(focusedRowIndex.value - pageUpSize);
        onFocusChange?.(focusedRowIndex.value, isCellNavigationMode.value ? focusedColumnIndex.value : undefined);
        announce(`Row ${focusedRowIndex.value + 1}`);
        return true;
      }

      case 'F2':
        event.preventDefault();
        if (isCellNavigationMode.value) {
          const column = columns.value[focusedColumnIndex.value];
          if (column && !column.hidden && column.editable !== false) {
            api.startEdit({
              field: String(column.field),
              rowIndex: focusedRowIndex.value
            });
            return true;
          }
        }
        return false;

      case 'a':
        if (ctrlKey || metaKey) {
          const target = event.target as HTMLElement | null;
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return false;
          }
          event.preventDefault();
          api.selectAll('filtered');
          const selectedCount = api.state.value.selectedRowKeys.length;
          announce(`${selectedCount} rows selected`);
          return true;
        }
        return false;

      case 'c':
        if ((ctrlKey || metaKey) && !shiftKey) {
          const target = event.target as HTMLElement | null;
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return false;
          }
          const copyEnabled = copyable ? copyable.value : true;
          if (!copyEnabled) {
            return false;
          }
          if (state.value.selectedRowKeys.length === 0) {
            return false;
          }
          event.preventDefault();
          void api.copySelectionToClipboard();
          announce(`${state.value.selectedRowKeys.length} rows copied to clipboard`);
          return true;
        }
        return false;

      case 'Escape':
        if (isCellNavigationMode.value) {
          exitCellNavigation();
          event.preventDefault();
          return true;
        }
        return false;
    }

    return false;
  }

  return {
    handleKeyDown,
    focusedRowIndex,
    focusedColumnIndex,
    isCellNavigationMode,
    setFocusedRow,
    setFocusedCell,
    enterCellNavigation,
    exitCellNavigation,
    getFocusedElementSelector
  };
}
