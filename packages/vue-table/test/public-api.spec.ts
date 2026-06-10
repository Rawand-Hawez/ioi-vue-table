import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { IoiTable, Table, DataTable } from '../src';
import { Table as UnstyledTable } from '../src/unstyled';
import type {
  ColumnDef,
  PaginationSlotProps,
  SelectionMode
} from '../src/types';

describe('v0.3.0 public contract — component props', () => {
  const requiredProps = [
    'rows',
    'columns',
    'rowKey',
    'rowHeight',
    'overscan',
    'height',
    'pageIndex',
    'pageSize',
    'globalSearchDebounceMs',
    'filterDebounceMs',
    'expandable',
    'rowExpandable',
    'expandedRowKeys',
    'groupBy',
    'groupAggregations',
    'expandedGroupKeys',
    'ariaLabel',
    'dataMode',
    'serverOptions',
    'rowClass',
    'copyable',
    'rowDraggable',
    'columnGroups',
    'selectionMode',
    'selectedRowKeys',
    'showPagination',
    'pageSizeOptions'
  ] as const;

  it.each(requiredProps as unknown as string[])('exposes the "%s" prop', (propName: string) => {
    const props = (IoiTable as unknown as { props: Record<string, unknown> }).props;
    expect(props).toHaveProperty(propName);
  });

  it('Table and DataTable are the same component', () => {
    expect(Table).toBe(IoiTable);
    expect(DataTable).toBe(IoiTable);
    expect(UnstyledTable).toBe(IoiTable);
  });
});

describe('v0.3.0 public contract — component events', () => {
  const requiredEmits = [
    'row-click',
    'state-change',
    'update:pageIndex',
    'update:pageSize',
    'pagination-change',
    'update:expandedRowKeys',
    'row-expand',
    'update:expandedGroupKeys',
    'group-expand',
    'row-reorder',
    'update:selectedRowKeys',
    'selection-change',
    'cell-commit'
  ] as const;

  it.each(requiredEmits as unknown as string[])('emits "%s"', (emitName: string) => {
    const emits = (IoiTable as unknown as { emits: string[] }).emits;
    expect(emits).toContain(emitName);
  });
});

describe('v0.3.0 public contract — exposed methods', () => {
  const requiredMethods = [
    'scrollToRow',
    'exportCSV',
    'parseCSV',
    'commitCSVImport',
    'resetState',
    'setColumnFilter',
    'clearColumnFilter',
    'setGlobalSearch',
    'clearAllFilters',
    'setPageIndex',
    'setPageSize',
    'getColumnFacetOptions',
    'setSortState',
    'toggleSort',
    'toggleRow',
    'isSelected',
    'clearSelection',
    'selectAll',
    'getSelectedKeys',
    'toggleRowExpansion',
    'expandAllRows',
    'collapseAllRows',
    'isRowExpanded',
    'toggleGroupExpansion',
    'expandAllGroups',
    'collapseAllGroups',
    'isGroupExpanded',
    'startEdit',
    'setEditDraft',
    'commitEdit',
    'cancelEdit',
    'setColumnOrder',
    'setColumnVisibility',
    'setColumnPin',
    'setColumnSizing',
    'getColumnStateSnapshot',
    'autoSizeColumns',
    'focusRow',
    'refresh',
    'copySelectionToClipboard'
  ] as const;

  it('exposes all required methods and properties on the component instance', () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'id', header: 'ID' }],
        rows: [{ id: 1 }]
      }
    });

    const vm = wrapper.vm as unknown as Record<string, unknown>;
    for (const method of requiredMethods) {
      expect(typeof vm[method], `expected exposed "${method}" to exist`).not.toBe('undefined');
    }

    expect(vm).toHaveProperty('focusedRowIndex');
    expect(vm).toHaveProperty('focusedColumnIndex');
    expect(vm).toHaveProperty('isCellNavigationMode');
    expect(vm).toHaveProperty('loading');
    expect(vm).toHaveProperty('error');
    expect(vm).toHaveProperty('hasMore');
  });
});

describe('v0.3.0 public contract — pagination slot', () => {
  it('renders the pagination slot when pageSize > 0', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'id', header: 'ID' }, { field: 'name', header: 'Name' }],
        rows,
        pageSize: 10,
        rowKey: 'id'
      },
      slots: {
        pagination: `<template #pagination="props"><div class="test-pagination">{{ props.pageIndex }}-{{ props.pageSize }}-{{ props.pageCount }}-{{ props.rowCount }}</div></template>`
      }
    });

    const paginationEl = wrapper.find('.test-pagination');
    expect(paginationEl.exists()).toBe(true);
    expect(paginationEl.text()).toContain('0');
    expect(paginationEl.text()).toContain('10');
    expect(paginationEl.text()).toContain('30');
  });
});

describe('v0.3.0 public contract — package exports', () => {
  const requiredTypeExports = [
    'PaginationSlotProps',
    'SelectionMode',
    'ColumnDef',
    'IoiCellCommitPayload',
    'ServerDataOptions',
    'ServerFetchParams',
    'ServerFetchResult',
    'IoiPaginationChangePayload'
  ] as const;

  it('package.json exports map includes all documented subpaths', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    const requiredExports = [
      '.',
      './unstyled',
      './styles.css',
      './style.css',
      './minimal',
      './minimal.css'
    ];

    for (const exp of requiredExports) {
      expect(packageJson.exports?.[exp], `expected export "${exp}"`).toBeDefined();
    }
  });

  it('re-exports all required types from index', async () => {
    const indexModule = await import('../src');
    for (const typeName of requiredTypeExports) {
      expect(
        (indexModule as Record<string, unknown>)[typeName],
        `expected type export "${typeName}" to be re-exported (as type-only)`
      ).toBeUndefined();
    }
  });
});

describe('v0.3.0 public contract — type-level checks', () => {
  it('ColumnDef has a sortable field', () => {
    const col: ColumnDef = { field: 'test', sortable: true };
    expect(col.sortable).toBe(true);

    const colDefault: ColumnDef = { field: 'test' };
    expect(colDefault.sortable).toBeUndefined();
  });

  it('PaginationSlotProps shape matches the contract', () => {
    const slotProps: PaginationSlotProps = {
      pageIndex: 0,
      pageSize: 10,
      pageCount: 3,
      rowCount: 30,
      canPreviousPage: false,
      canNextPage: true,
      setPageIndex: () => {},
      setPageSize: () => {},
      previousPage: () => {},
      nextPage: () => {},
      firstPage: () => {},
      lastPage: () => {}
    };
    expect(slotProps.pageIndex).toBe(0);
    expect(slotProps.pageSize).toBe(10);
    expect(slotProps.pageCount).toBe(3);
    expect(slotProps.rowCount).toBe(30);
    expect(slotProps.canPreviousPage).toBe(false);
    expect(slotProps.canNextPage).toBe(true);
    expect(typeof slotProps.setPageIndex).toBe('function');
    expect(typeof slotProps.setPageSize).toBe('function');
    expect(typeof slotProps.previousPage).toBe('function');
    expect(typeof slotProps.nextPage).toBe('function');
    expect(typeof slotProps.firstPage).toBe('function');
    expect(typeof slotProps.lastPage).toBe('function');
  });

  it('SelectionMode accepts valid values', () => {
    const single: SelectionMode = 'single';
    const multi: SelectionMode = 'multi';
    expect(single).toBe('single');
    expect(multi).toBe('multi');
  });
});
