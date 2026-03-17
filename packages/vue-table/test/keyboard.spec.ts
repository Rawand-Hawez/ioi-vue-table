import { describe, expect, it, vi } from 'vitest';
import { ref, computed, type Ref } from 'vue';
import { createKeyboardNavigation, type KeyboardOptions } from '../src/composables/ioiTable/keyboard';
import type { IoiTableState, ColumnDef } from '../src/types';

function createMockApi() {
  return {
    startEdit: vi.fn(),
    commitEdit: vi.fn(() => true),
    cancelEdit: vi.fn(),
    selectAll: vi.fn(),
    state: ref<IoiTableState>({
      sort: [],
      filters: [],
      globalSearch: '',
      selectedRowKeys: [],
      editingCell: null,
      viewport: { scrollTop: 0, viewportHeight: 400 },
      expandedRowKeys: [],
      expandedGroupKeys: [],
      loading: false,
      error: null,
      serverTotalRows: null
    })
  } as unknown as KeyboardOptions['api'];
}

function createKeyboardSetup(options: Partial<KeyboardOptions> = {}) {
  const columns = ref<ColumnDef[]>([
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Status' }
  ]);
  const rowCount = computed(() => 100);
  const pageSize = computed(() => 10);
  const paginationEnabled = computed(() => true);
  const state = ref<IoiTableState>({
    sort: [],
    filters: [],
    globalSearch: '',
    selectedRowKeys: [],
    editingCell: null,
    viewport: { scrollTop: 0, viewportHeight: 400 },
    expandedRowKeys: [],
    expandedGroupKeys: [],
    loading: false,
    error: null,
    serverTotalRows: null
  });

  return createKeyboardNavigation({
    state,
    api: createMockApi(),
    columns,
    rowCount,
    pageSize,
    paginationEnabled,
    ...options
  });
}

function createKeyEvent(key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });
}

describe('createKeyboardNavigation', () => {
  describe('initialization', () => {
    it('returns the expected API shape', () => {
      const keyboard = createKeyboardSetup();

      expect(typeof keyboard.handleKeyDown).toBe('function');
      expect(keyboard.focusedRowIndex.value).toBe(0);
      expect(keyboard.focusedColumnIndex.value).toBe(0);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
      expect(typeof keyboard.setFocusedRow).toBe('function');
      expect(typeof keyboard.setFocusedCell).toBe('function');
      expect(typeof keyboard.enterCellNavigation).toBe('function');
      expect(typeof keyboard.exitCellNavigation).toBe('function');
      expect(typeof keyboard.getFocusedElementSelector).toBe('function');
    });

    it('starts with row 0 focused', () => {
      const keyboard = createKeyboardSetup();
      expect(keyboard.focusedRowIndex.value).toBe(0);
    });
  });

  describe('row navigation', () => {
    it('clamps row index to valid range', () => {
      const keyboard = createKeyboardSetup();

      keyboard.setFocusedRow(-5);
      expect(keyboard.focusedRowIndex.value).toBe(0);

      keyboard.setFocusedRow(500);
      expect(keyboard.focusedRowIndex.value).toBe(99);
    });
  });

  describe('cell navigation mode', () => {
    it('enters cell navigation mode with ArrowRight', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      expect(keyboard.isCellNavigationMode.value).toBe(false);

      const event = createKeyEvent('ArrowRight');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.isCellNavigationMode.value).toBe(true);
      expect(keyboard.focusedColumnIndex.value).toBe(0);
      expect(onFocusChange).toHaveBeenCalledWith(0, 0);
    });

    it('exits cell navigation mode with Escape', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.enterCellNavigation();
      expect(keyboard.isCellNavigationMode.value).toBe(true);
      onFocusChange.mockClear();

      const event = createKeyEvent('Escape');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
      expect(onFocusChange).toHaveBeenCalledWith(0);
    });

    it('exits cell navigation when pressing ArrowLeft on first column', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 0);
      onFocusChange.mockClear();

      const event = createKeyEvent('ArrowLeft');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
      expect(onFocusChange).toHaveBeenCalledWith(5);
    });

    it('moves between cells with ArrowLeft and ArrowRight', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 1);

      const rightEvent = createKeyEvent('ArrowRight');
      keyboard.handleKeyDown(rightEvent);
      expect(keyboard.focusedColumnIndex.value).toBe(2);

      const leftEvent = createKeyEvent('ArrowLeft');
      keyboard.handleKeyDown(leftEvent);
      expect(keyboard.focusedColumnIndex.value).toBe(1);
    });

    it('clamps column index to visible columns', () => {
      const keyboard = createKeyboardSetup();

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(0, 100);
      expect(keyboard.focusedColumnIndex.value).toBe(2);

      keyboard.setFocusedCell(0, -5);
      expect(keyboard.focusedColumnIndex.value).toBe(0);
    });

    it('ignores hidden columns when counting visible columns', () => {
      const columns = ref<ColumnDef[]>([
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email', hidden: true },
        { field: 'status', header: 'Status' }
      ]);
      const rowCount = computed(() => 10);
      const pageSize = computed(() => 10);
      const paginationEnabled = computed(() => false);
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: null,
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });

      const keyboard = createKeyboardNavigation({
        state,
        api: createMockApi(),
        columns,
        rowCount,
        pageSize,
        paginationEnabled
      });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(0, 100);
      expect(keyboard.focusedColumnIndex.value).toBe(1);
    });
  });

  describe('Home and End keys', () => {
    it('moves to first row with Home', () => {
      const onFocusChange = vi.fn();
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange, onAnnounce });

      keyboard.setFocusedRow(50);

      const event = createKeyEvent('Home');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedRowIndex.value).toBe(0);
      expect(onAnnounce).toHaveBeenCalledWith('First row');
    });

    it('moves to last row with End', () => {
      const onFocusChange = vi.fn();
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange, onAnnounce });

      const event = createKeyEvent('End');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedRowIndex.value).toBe(99);
      expect(onAnnounce).toHaveBeenCalledWith('Last row');
    });

    it('Ctrl+Home moves to first row and first column in cell mode', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.setFocusedRow(50);
      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(50, 2);

      const event = createKeyEvent('Home', { ctrlKey: true });
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(0);
      expect(keyboard.focusedColumnIndex.value).toBe(0);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
    });

    it('Ctrl+End moves to last row and last column in cell mode', () => {
      const keyboard = createKeyboardSetup();

      keyboard.enterCellNavigation();

      const event = createKeyEvent('End', { ctrlKey: true });
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(99);
      expect(keyboard.focusedColumnIndex.value).toBe(2);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
    });

    it('Home in cell mode also resets column to first', () => {
      const keyboard = createKeyboardSetup();

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(50, 2);

      const event = createKeyEvent('Home');
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(0);
      expect(keyboard.focusedColumnIndex.value).toBe(0);
    });
  });

  describe('PageUp and PageDown', () => {
    it('moves by page size with PageDown', () => {
      const onFocusChange = vi.fn();
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange, onAnnounce });

      const event = createKeyEvent('PageDown');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedRowIndex.value).toBe(10);
      expect(onAnnounce).toHaveBeenCalledWith('Row 11');
    });

    it('moves by page size with PageUp', () => {
      const onFocusChange = vi.fn();
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange, onAnnounce });

      keyboard.setFocusedRow(25);

      const event = createKeyEvent('PageUp');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedRowIndex.value).toBe(15);
      expect(onAnnounce).toHaveBeenCalledWith('Row 16');
    });

    it('clamps PageDown to last row', () => {
      const keyboard = createKeyboardSetup();

      keyboard.setFocusedRow(95);

      const event = createKeyEvent('PageDown');
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(99);
    });

    it('clamps PageUp to first row', () => {
      const keyboard = createKeyboardSetup();

      keyboard.setFocusedRow(5);

      const event = createKeyEvent('PageUp');
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(0);
    });

    it('uses default page size of 10 when pageSize is 0', () => {
      const pageSize = computed(() => 0);
      const keyboard = createKeyboardSetup({ pageSize });

      const event = createKeyEvent('PageDown');
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedRowIndex.value).toBe(10);
    });
  });

  describe('editing mode', () => {
    it('cancels edit with Escape when editing', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      const event = createKeyEvent('Escape');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(api.cancelEdit).toHaveBeenCalled();
    });

    it('commits edit with Enter when editing', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      const event = createKeyEvent('Enter');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(api.commitEdit).toHaveBeenCalled();
    });

    it('does not handle Enter when commit fails', () => {
      const api = {
        ...createMockApi(),
        commitEdit: vi.fn(() => false)
      } as unknown as KeyboardOptions['api'];
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      const event = createKeyEvent('Enter');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
    });

    it('moves to next cell with Tab while editing', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 0);

      const event = createKeyEvent('Tab');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedColumnIndex.value).toBe(1);
      expect(api.cancelEdit).toHaveBeenCalled();
    });

    it('moves to previous cell with Shift+Tab while editing', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 2);

      const event = createKeyEvent('Tab', { shiftKey: true });
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(keyboard.focusedColumnIndex.value).toBe(1);
    });

    it('does not move column when Tab on last column', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 2);

      const event = createKeyEvent('Tab');
      keyboard.handleKeyDown(event);

      expect(keyboard.focusedColumnIndex.value).toBe(2);
    });

    it('ignores other keys when editing', () => {
      const api = createMockApi();
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: { field: 'name', rowIndex: 0 },
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });
      const keyboard = createKeyboardSetup({ api, state });

      const event = createKeyEvent('a');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
    });

    it('starts editing with F2 in cell mode', () => {
      const api = createMockApi();
      const keyboard = createKeyboardSetup({ api });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 0);

      const event = createKeyEvent('F2');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(api.startEdit).toHaveBeenCalledWith({
        field: 'name',
        rowIndex: 5
      });
    });

    it('does not start editing when column is not editable', () => {
      const api = createMockApi();
      const columns = ref<ColumnDef[]>([
        { field: 'name', header: 'Name', editable: false },
        { field: 'email', header: 'Email' }
      ]);
      const rowCount = computed(() => 10);
      const pageSize = computed(() => 10);
      const paginationEnabled = computed(() => false);
      const state = ref<IoiTableState>({
        sort: [],
        filters: [],
        globalSearch: '',
        selectedRowKeys: [],
        editingCell: null,
        viewport: { scrollTop: 0, viewportHeight: 400 },
        expandedRowKeys: [],
        expandedGroupKeys: [],
        loading: false,
        error: null,
        serverTotalRows: null
      });

      const keyboard = createKeyboardNavigation({
        state,
        api,
        columns,
        rowCount,
        pageSize,
        paginationEnabled
      });

      keyboard.enterCellNavigation();
      keyboard.setFocusedCell(5, 0);

      const event = createKeyEvent('F2');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
      expect(api.startEdit).not.toHaveBeenCalled();
    });

    it('does not start editing when not in cell mode', () => {
      const api = createMockApi();
      const keyboard = createKeyboardSetup({ api });

      const event = createKeyEvent('F2');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
      expect(api.startEdit).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('selects all with Ctrl+A', () => {
      const api = createMockApi();
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ api, onAnnounce });

      const event = createKeyEvent('a', { ctrlKey: true });
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(api.selectAll).toHaveBeenCalledWith('filtered');
    });

    it('selects all with Meta+A (Cmd+A on Mac)', () => {
      const api = createMockApi();
      const keyboard = createKeyboardSetup({ api });

      const event = createKeyEvent('a', { metaKey: true });
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(api.selectAll).toHaveBeenCalledWith('filtered');
    });

    it('does not handle "a" without modifier', () => {
      const api = createMockApi();
      const keyboard = createKeyboardSetup({ api });

      const event = createKeyEvent('a');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
      expect(api.selectAll).not.toHaveBeenCalled();
    });

    it('announces selection count', () => {
      const api = {
        ...createMockApi(),
        selectAll: vi.fn(() => {
          (api.state as Ref<IoiTableState>).value.selectedRowKeys = [1, 2, 3];
        }),
        state: ref<IoiTableState>({
          sort: [],
          filters: [],
          globalSearch: '',
          selectedRowKeys: [1, 2, 3],
          editingCell: null,
          viewport: { scrollTop: 0, viewportHeight: 400 },
          expandedRowKeys: [],
          expandedGroupKeys: [],
          loading: false,
          error: null,
          serverTotalRows: null
        })
      } as unknown as KeyboardOptions['api'];
      const onAnnounce = vi.fn();
      const keyboard = createKeyboardSetup({ api, onAnnounce });

      const event = createKeyEvent('a', { ctrlKey: true });
      keyboard.handleKeyDown(event);

      expect(onAnnounce).toHaveBeenCalledWith('3 rows selected');
    });
  });

  describe('focus change callback', () => {
    it('calls onFocusChange when setting focused row', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.setFocusedRow(5);

      expect(onFocusChange).toHaveBeenCalledWith(5);
    });

    it('calls onFocusChange when setting focused cell', () => {
      const onFocusChange = vi.fn();
      const keyboard = createKeyboardSetup({ onFocusChange });

      keyboard.setFocusedCell(5, 2);

      expect(onFocusChange).toHaveBeenCalledWith(5, 2);
      expect(keyboard.isCellNavigationMode.value).toBe(true);
    });

    it('exits cell mode when setting focused row', () => {
      const keyboard = createKeyboardSetup();

      keyboard.enterCellNavigation();
      expect(keyboard.isCellNavigationMode.value).toBe(true);

      keyboard.setFocusedRow(10);
      expect(keyboard.isCellNavigationMode.value).toBe(false);
    });
  });

  describe('getFocusedElementSelector', () => {
    it('returns row selector when not in cell mode', () => {
      const keyboard = createKeyboardSetup();

      keyboard.setFocusedRow(5);
      const selector = keyboard.getFocusedElementSelector();

      expect(selector).toBe('[data-row-index="5"]');
    });

    it('returns cell selector when in cell mode', () => {
      const keyboard = createKeyboardSetup();

      keyboard.setFocusedCell(5, 2);
      const selector = keyboard.getFocusedElementSelector();

      expect(selector).toBe('[data-row-index="5"] [data-col-index="2"]');
    });
  });

  describe('unhandled keys', () => {
    it('returns false for unhandled keys', () => {
      const keyboard = createKeyboardSetup();

      const event = createKeyEvent('x');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
    });

    it('returns false for ArrowLeft when not in cell mode', () => {
      const keyboard = createKeyboardSetup();

      const event = createKeyEvent('ArrowLeft');
      const handled = keyboard.handleKeyDown(event);

      expect(handled).toBe(false);
    });
  });
});

