import { describe, expect, it } from 'vitest';
import { DataTable, IoiTable, Table } from '../src';

describe('public component exports', () => {
  it('keeps Table, IoiTable, and DataTable as the same component', () => {
    expect(Table).toBe(IoiTable);
    expect(DataTable).toBe(IoiTable);
  });
});
