import { describe, expect, it } from 'vitest';
import { DataTable, IoiTable, Table } from '../src';
import { Table as UnstyledTable } from '../src/unstyled';
import { useColumnState } from '../src/composables/useColumnState';
import { useIoiTable } from '../src/composables/useIoiTable';
import { get, has, set } from '../src/utils/nestedPath';

describe('public component exports', () => {
  it('keeps Table, IoiTable, and DataTable as the same component', () => {
    expect(Table).toBe(IoiTable);
    expect(DataTable).toBe(IoiTable);
    expect(UnstyledTable).toBe(IoiTable);
  });

  it('exposes composables and nestedPath helpers as importable modules', () => {
    expect(typeof useIoiTable).toBe('function');
    expect(typeof useColumnState).toBe('function');
    expect(typeof get).toBe('function');
    expect(typeof set).toBe('function');
    expect(typeof has).toBe('function');
  });
});
