import { describe, expect, it, vi } from 'vitest';
import { useIoiTable } from '../src/composables/useIoiTable';

describe('useIoiTable', () => {
  it('returns a stable API shape', () => {
    const table = useIoiTable({
      rows: [{ id: 1, name: 'Alpha' }],
      columns: [{ field: 'name', header: 'Name' }]
    });

    expect(table.schemaVersion).toBe(1);
    expect(table.baseIndices.value).toEqual([0]);
    expect(table.filteredIndices.value).toEqual([0]);
    expect(table.sortedIndices.value).toEqual([0]);
    expect(table.visibleIndices.value).toEqual([0]);
    expect(table.visibleRows.value).toEqual([{ id: 1, name: 'Alpha' }]);

    expect(typeof table.setRows).toBe('function');
    expect(typeof table.setColumns).toBe('function');
    expect(typeof table.setSortState).toBe('function');
    expect(typeof table.setColumnFilter).toBe('function');
    expect(typeof table.clearColumnFilter).toBe('function');
    expect(typeof table.setGlobalSearch).toBe('function');
    expect(typeof table.clearAllFilters).toBe('function');
    expect(typeof table.toggleRow).toBe('function');
    expect(typeof table.isSelected).toBe('function');
    expect(typeof table.clearSelection).toBe('function');
    expect(typeof table.selectAll).toBe('function');
    expect(typeof table.getSelectedKeys).toBe('function');
    expect(typeof table.toggleSort).toBe('function');
    expect(typeof table.setViewport).toBe('function');
    expect(typeof table.scrollToRow).toBe('function');
    expect(typeof table.exportCSV).toBe('function');
    expect(typeof table.resetState).toBe('function');
    expect(typeof table.emitSemanticEvent).toBe('function');
    expect(typeof table.actions.exportCSV).toBe('function');
  });

  it('captures semantic events with schemaVersion', () => {
    const table = useIoiTable();

    const event = table.emitSemanticEvent('data:sort', {
      field: 'name',
      direction: 'asc'
    });

    expect(event.schemaVersion).toBe(1);
    expect(event.type).toBe('data:sort');
    expect(table.lastEvent.value).toEqual(event);
  });

  it('computes virtualized ranges from viewport and overscan', () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }));
    const table = useIoiTable({
      rows,
      columns: [{ field: 'id', header: 'ID' }],
      rowHeight: 20,
      viewportHeight: 60,
      overscan: 1
    });

    expect(table.virtualRange.value).toEqual({ start: 0, end: 5 });
    expect(table.visibleIndices.value).toEqual([0, 1, 2, 3, 4]);
    expect(table.visibleIndices.value).toHaveLength(5);
    expect(table.virtualPaddingTop.value).toBe(0);
    expect(table.virtualPaddingBottom.value).toBe(1900);

    table.setViewport(80, 60);

    expect(table.virtualRange.value).toEqual({ start: 3, end: 8 });
    expect(table.visibleIndices.value).toEqual([3, 4, 5, 6, 7]);
    expect(table.visibleIndices.value).toHaveLength(5);
    expect(table.virtualPaddingTop.value).toBe(60);
    expect(table.virtualPaddingBottom.value).toBe(1840);
  });

  it('sorts indices programmatically via sort state actions', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, user: { profile: { name: 'Charlie' } } },
        { id: 2, user: { profile: { name: 'Alice' } } },
        { id: 3, user: { profile: { name: 'Bob' } } }
      ],
      columns: [{ field: 'user.profile.name', type: 'text' }],
      rowHeight: 36,
      viewportHeight: 320
    });

    table.setSortState([{ field: 'user.profile.name', direction: 'asc' }]);
    expect(table.sortedIndices.value).toEqual([1, 2, 0]);

    table.toggleSort('user.profile.name');
    expect(table.sortedIndices.value).toEqual([0, 2, 1]);

    table.toggleSort('user.profile.name');
    expect(table.sortedIndices.value).toEqual([0, 1, 2]);
  });

  it('applies text filters with nested paths and case-insensitive contains by default', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, user: { profile: { name: 'Alice' } } },
        { id: 2, user: { profile: { name: 'bob' } } },
        { id: 3, user: { profile: { name: 'ALICIA' } } }
      ],
      columns: [{ field: 'user.profile.name', type: 'text' }]
    });

    table.setColumnFilter('user.profile.name', { type: 'text', value: 'ali' });
    expect(table.filteredIndices.value).toEqual([0, 2]);

    table.setColumnFilter('user.profile.name', {
      type: 'text',
      operator: 'startsWith',
      value: 'bo'
    });
    expect(table.filteredIndices.value).toEqual([1]);
  });

  it('matches text filters against arrays when any stringified element contains the query', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, tags: ['One', 'Two'] },
        { id: 2, tags: ['Three', 99] },
        { id: 3, tags: [] }
      ],
      columns: [{ field: 'tags', type: 'text' }]
    });

    table.setColumnFilter('tags', { type: 'text', value: '99' });
    expect(table.filteredIndices.value).toEqual([1]);

    table.setColumnFilter('tags', { type: 'text', value: 'wo' });
    expect(table.filteredIndices.value).toEqual([0]);
  });

  it('supports all number filter operators', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, amount: 10 },
        { id: 2, amount: 20 },
        { id: 3, amount: 30 },
        { id: 4, amount: 40 }
      ],
      columns: [{ field: 'amount', type: 'number' }]
    });

    table.setColumnFilter('amount', { type: 'number', operator: 'eq', value: 20 });
    expect(table.filteredIndices.value).toEqual([1]);

    table.setColumnFilter('amount', { type: 'number', operator: 'lt', value: 30 });
    expect(table.filteredIndices.value).toEqual([0, 1]);

    table.setColumnFilter('amount', { type: 'number', operator: 'lte', value: 20 });
    expect(table.filteredIndices.value).toEqual([0, 1]);

    table.setColumnFilter('amount', { type: 'number', operator: 'gt', value: 20 });
    expect(table.filteredIndices.value).toEqual([2, 3]);

    table.setColumnFilter('amount', { type: 'number', operator: 'gte', value: 30 });
    expect(table.filteredIndices.value).toEqual([2, 3]);

    table.setColumnFilter('amount', { type: 'number', operator: 'between', min: 15, max: 35 });
    expect(table.filteredIndices.value).toEqual([1, 2]);
  });

  it('supports date filtering with Date and ISO values and treats invalid as null', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, createdAt: new Date('2024-01-10T12:00:00.000Z') },
        { id: 2, createdAt: '2024-01-12T08:00:00.000Z' },
        { id: 3, createdAt: 'not-a-date' },
        { id: 4, createdAt: null },
        { id: 5, createdAt: undefined }
      ],
      columns: [{ field: 'createdAt', type: 'date' }]
    });

    table.setColumnFilter('createdAt', {
      type: 'date',
      operator: 'before',
      value: '2024-01-12T00:00:00.000Z'
    });
    expect(table.filteredIndices.value).toEqual([0]);

    table.setColumnFilter('createdAt', {
      type: 'date',
      operator: 'after',
      value: new Date('2024-01-10T12:00:00.000Z')
    });
    expect(table.filteredIndices.value).toEqual([1]);

    table.setColumnFilter('createdAt', {
      type: 'date',
      operator: 'on',
      value: new Date('2024-01-12T00:00:00.000Z')
    });
    expect(table.filteredIndices.value).toEqual([1]);
  });

  it('keeps filtered rows as sort input in the index pipeline', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, group: 'A', score: 80 },
        { id: 2, group: 'B', score: 90 },
        { id: 3, group: 'A', score: 70 },
        { id: 4, group: 'A', score: 95 }
      ],
      columns: [
        { field: 'group', type: 'text' },
        { field: 'score', type: 'number' }
      ]
    });

    table.setColumnFilter('group', { type: 'text', value: 'a', operator: 'equals' });
    expect(table.filteredIndices.value).toEqual([0, 2, 3]);

    table.setSortState([{ field: 'score', direction: 'desc' }]);
    expect(table.sortedIndices.value).toEqual([3, 0, 2]);
  });

  it('applies global search on visible columns only and supports array values', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, name: 'Alpha', secret: 'needle-only-hidden', tags: ['Red'] },
        { id: 2, name: 'Beta', secret: 'nope', tags: ['needle-tag'] },
        { id: 3, name: 'Gamma', secret: 'nothing', tags: [] }
      ],
      columns: [
        { field: 'name', type: 'text' },
        { field: 'secret', type: 'text', hidden: true },
        { field: 'tags', type: 'text' }
      ]
    });

    table.setGlobalSearch('NEEDLE');
    expect(table.filteredIndices.value).toEqual([1]);

    table.clearAllFilters();
    expect(table.filteredIndices.value).toEqual([0, 1, 2]);
  });

  it('clears per-column filters independently', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, name: 'Alice', age: 10 },
        { id: 2, name: 'Bob', age: 20 },
        { id: 3, name: 'Alicia', age: 20 }
      ],
      columns: [
        { field: 'name', type: 'text' },
        { field: 'age', type: 'number' }
      ]
    });

    table.setColumnFilter('name', { type: 'text', value: 'ali' });
    table.setColumnFilter('age', { type: 'number', operator: 'eq', value: 20 });
    expect(table.filteredIndices.value).toEqual([2]);

    table.clearColumnFilter('name');
    expect(table.filteredIndices.value).toEqual([1, 2]);
  });

  it('keeps selected keys stable across sorting and filtering', () => {
    const table = useIoiTable({
      rows: [
        { id: 'a', name: 'Charlie', group: 'x' },
        { id: 'b', name: 'Alice', group: 'x' },
        { id: 'c', name: 'Bob', group: 'y' }
      ],
      columns: [
        { field: 'name', type: 'text' },
        { field: 'group', type: 'text' }
      ],
      rowKey: 'id'
    });

    table.toggleRow('a');
    table.toggleRow('c');
    expect(table.getSelectedKeys()).toEqual(['a', 'c']);

    table.setSortState([{ field: 'name', direction: 'asc' }]);
    expect(table.sortedIndices.value).toEqual([1, 2, 0]);
    expect(table.isSelected('a')).toBe(true);
    expect(table.isSelected('c')).toBe(true);

    table.setColumnFilter('group', { type: 'text', operator: 'equals', value: 'x' });
    expect(table.filteredIndices.value).toEqual([0, 1]);
    expect(table.getSelectedKeys()).toEqual(['a', 'c']);
  });

  it('selects shift-ranges using sortedIndices order', () => {
    const table = useIoiTable({
      rows: [
        { id: 'a', score: 30 },
        { id: 'b', score: 10 },
        { id: 'c', score: 20 },
        { id: 'd', score: 40 }
      ],
      columns: [{ field: 'score', type: 'number' }],
      rowKey: 'id'
    });

    table.setSortState([{ field: 'score', direction: 'asc' }]);
    expect(table.sortedIndices.value).toEqual([1, 2, 0, 3]);

    table.toggleRow('c');
    table.toggleRow('d', { shiftKey: true });
    expect(table.getSelectedKeys()).toEqual(['c', 'a', 'd']);
  });

  it('supports selectAll scopes for visible, filtered, and allLoaded rows', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, group: 'A' },
        { id: 2, group: 'B' },
        { id: 3, group: 'A' },
        { id: 4, group: 'B' },
        { id: 5, group: 'A' }
      ],
      columns: [{ field: 'group', type: 'text' }],
      rowKey: 'id',
      rowHeight: 20,
      viewportHeight: 40,
      overscan: 0
    });

    table.setColumnFilter('group', { type: 'text', operator: 'equals', value: 'A' });
    expect(table.sortedIndices.value).toEqual([0, 2, 4]);
    expect(table.visibleIndices.value).toEqual([0, 2]);

    table.selectAll('visible');
    expect(table.getSelectedKeys()).toEqual([1, 3]);

    table.clearSelection();
    table.selectAll('filtered');
    expect(table.getSelectedKeys()).toEqual([1, 3, 5]);

    table.clearSelection();
    table.selectAll('allLoaded');
    expect(table.getSelectedKeys()).toEqual([1, 2, 3, 4, 5]);
  });

  it('disables selection when rowKey is missing and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = useIoiTable({
      rows: [
        { id: 1, name: 'Alpha' },
        { id: 2, name: 'Beta' }
      ],
      columns: [{ field: 'name', type: 'text' }]
    });

    table.toggleRow(1);
    table.selectAll('allLoaded');
    expect(table.getSelectedKeys()).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Selection is disabled');

    warnSpy.mockRestore();
  });
});
