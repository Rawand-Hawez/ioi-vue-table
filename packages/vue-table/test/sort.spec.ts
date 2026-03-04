import { describe, expect, it } from 'vitest';
import { get as pathGet } from '../src/utils/nestedPath';
import { applySort, toggleSortState } from '../src/utils/sort';
import type { ColumnDef, SortState } from '../src/types';

describe('sort utils', () => {
  it('keeps sort stable for equal values', () => {
    const rows = [
      { id: 1, group: 'A', label: 'first' },
      { id: 2, group: 'B', label: 'other' },
      { id: 3, group: 'A', label: 'second' },
      { id: 4, group: 'A', label: 'third' }
    ];
    const indices = [0, 1, 2, 3];
    const sortState: SortState[] = [{ field: 'group', direction: 'asc' }];
    const columns: ColumnDef[] = [{ field: 'group', type: 'text' }];

    const sortedIndices = applySort(indices, rows, sortState, columns, pathGet);

    expect(sortedIndices).toEqual([0, 2, 3, 1]);
  });

  it('sorts nested fields through path getter', () => {
    const rows = [
      { id: 1, user: { profile: { name: 'Charlie' } } },
      { id: 2, user: { profile: { name: 'Alice' } } },
      { id: 3, user: { profile: { name: 'Bob' } } }
    ];
    const columns: ColumnDef[] = [{ field: 'user.profile.name', type: 'text' }];

    const sortedIndices = applySort(
      [0, 1, 2],
      rows,
      [{ field: 'user.profile.name', direction: 'asc' }],
      columns,
      pathGet
    );

    expect(sortedIndices).toEqual([1, 2, 0]);
  });

  it('keeps null and undefined values at the end for both sort directions', () => {
    const rows = [{ score: 10 }, { score: null }, { score: 5 }, {}, { score: 20 }];
    const columns: ColumnDef[] = [{ field: 'score', type: 'number' }];

    const asc = applySort(
      [0, 1, 2, 3, 4],
      rows,
      [{ field: 'score', direction: 'asc' }],
      columns,
      pathGet
    );
    const desc = applySort(
      [0, 1, 2, 3, 4],
      rows,
      [{ field: 'score', direction: 'desc' }],
      columns,
      pathGet
    );

    expect(asc).toEqual([2, 0, 4, 1, 3]);
    expect(desc).toEqual([4, 0, 2, 1, 3]);
  });

  it('applies multi-sort in the provided rule order', () => {
    const rows = [
      { team: 'B', score: 1, name: 'z' },
      { team: 'A', score: 2, name: 'b' },
      { team: 'A', score: 2, name: 'a' },
      { team: 'A', score: 1, name: 'c' },
      { team: 'B', score: 3, name: 'd' }
    ];
    const columns: ColumnDef[] = [
      { field: 'team', type: 'text' },
      { field: 'score', type: 'number' },
      { field: 'name', type: 'text' }
    ];
    const sortState: SortState[] = [
      { field: 'team', direction: 'asc' },
      { field: 'score', direction: 'desc' },
      { field: 'name', direction: 'asc' }
    ];

    const sortedIndices = applySort([0, 1, 2, 3, 4], rows, sortState, columns, pathGet);

    expect(sortedIndices).toEqual([2, 1, 3, 4, 0]);
  });

  it('supports date sorting with ISO strings and Date objects', () => {
    const rows = [
      { createdAt: '2024-01-03T00:00:00.000Z' },
      { createdAt: new Date('2024-01-01T00:00:00.000Z') },
      { createdAt: 'invalid-date' },
      { createdAt: '2024-01-02T00:00:00.000Z' }
    ];
    const columns: ColumnDef[] = [{ field: 'createdAt', type: 'date' }];

    const asc = applySort(
      [0, 1, 2, 3],
      rows,
      [{ field: 'createdAt', direction: 'asc' }],
      columns,
      pathGet
    );
    const desc = applySort(
      [0, 1, 2, 3],
      rows,
      [{ field: 'createdAt', direction: 'desc' }],
      columns,
      pathGet
    );

    expect(asc).toEqual([1, 3, 0, 2]);
    expect(desc).toEqual([0, 3, 1, 2]);
  });

  it('uses custom comparator when provided on a column', () => {
    const rows = [{ name: 'A' }, { name: 'CCC' }, { name: 'BB' }];
    const columns: ColumnDef[] = [
      {
        field: 'name',
        comparator: (valueA, valueB) => String(valueA).length - String(valueB).length
      }
    ];

    const sortedIndices = applySort(
      [0, 1, 2],
      rows,
      [{ field: 'name', direction: 'asc' }],
      columns,
      pathGet
    );

    expect(sortedIndices).toEqual([0, 2, 1]);
  });

  it('toggles sort state as none -> asc -> desc -> none', () => {
    const stepOne = toggleSortState([], 'name');
    const stepTwo = toggleSortState(stepOne, 'name');
    const stepThree = toggleSortState(stepTwo, 'name');

    expect(stepOne).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(stepTwo).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(stepThree).toEqual([]);
  });
});
