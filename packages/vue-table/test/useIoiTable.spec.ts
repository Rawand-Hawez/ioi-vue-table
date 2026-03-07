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
    expect(typeof table.setPageIndex).toBe('function');
    expect(typeof table.setPageSize).toBe('function');
    expect(typeof table.getColumnFacetOptions).toBe('function');
    expect(typeof table.toggleRow).toBe('function');
    expect(typeof table.isSelected).toBe('function');
    expect(typeof table.clearSelection).toBe('function');
    expect(typeof table.selectAll).toBe('function');
    expect(typeof table.getSelectedKeys).toBe('function');
    expect(typeof table.toggleSort).toBe('function');
    expect(typeof table.setViewport).toBe('function');
    expect(typeof table.scrollToRow).toBe('function');
    expect(typeof table.startEdit).toBe('function');
    expect(typeof table.setEditDraft).toBe('function');
    expect(typeof table.commitEdit).toBe('function');
    expect(typeof table.cancelEdit).toBe('function');
    expect(typeof table.exportCSV).toBe('function');
    expect(typeof table.parseCSV).toBe('function');
    expect(typeof table.commitCSVImport).toBe('function');
    expect(typeof table.resetState).toBe('function');
    expect(typeof table.emitSemanticEvent).toBe('function');
    expect(table.editingDraft.value).toBeNull();
    expect(table.editingError.value).toBeNull();
    expect(typeof table.actions.exportCSV).toBe('function');
    expect(typeof table.actions.parseCSV).toBe('function');
    expect(typeof table.actions.commitCSVImport).toBe('function');
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

  it('slices visible indices via pagination and disables virtual paddings', () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({ id: index + 1 }));
    const table = useIoiTable({
      rows,
      columns: [{ field: 'id', header: 'ID' }],
      rowHeight: 20,
      viewportHeight: 60,
      pagination: {
        pageIndex: 1,
        pageSize: 3
      }
    });

    expect(table.paginationEnabled.value).toBe(true);
    expect(table.pageIndex.value).toBe(1);
    expect(table.pageSize.value).toBe(3);
    expect(table.pageCount.value).toBe(4);

    expect(table.visibleIndices.value).toEqual([3, 4, 5]);
    expect(table.virtualPaddingTop.value).toBe(0);
    expect(table.virtualPaddingBottom.value).toBe(0);

    table.setViewport(80, 60);
    expect(table.visibleIndices.value).toEqual([3, 4, 5]);
  });

  it('supports partial pagination control when only pageSize is controlled', () => {
    const onPaginationChange = vi.fn();
    const rows = Array.from({ length: 6 }, (_, index) => ({ id: index + 1 }));
    const table = useIoiTable({
      rows,
      columns: [{ field: 'id', header: 'ID' }],
      pagination: {
        pageSize: 2
      },
      onPaginationChange
    });

    expect(table.paginationEnabled.value).toBe(true);
    expect(table.pageIndex.value).toBe(0);
    expect(table.visibleIndices.value).toEqual([0, 1]);

    table.setPageIndex(2);

    expect(table.pageIndex.value).toBe(2);
    expect(table.visibleIndices.value).toEqual([4, 5]);
    expect(onPaginationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pageIndex: 2,
        pageSize: 2,
        reason: 'setPageIndex'
      })
    );
  });

  it('builds select facet options from other filters + global search (excluding itself)', () => {
    const table = useIoiTable({
      rows: [
        { owner: 'A', status: 'Queued' },
        { owner: 'A', status: 'Done' },
        { owner: 'B', status: 'Queued' }
      ],
      columns: [
        { field: 'owner', type: 'text' },
        { field: 'status', type: 'text' }
      ]
    });

    table.setColumnFilter('owner', { type: 'text', value: 'A', operator: 'equals' });
    table.setColumnFilter('status', { type: 'text', value: 'Queued', operator: 'equals' });

    expect(table.getColumnFacetOptions('status')).toEqual(['Done', 'Queued']);
    expect(table.getColumnFacetOptions('owner')).toEqual(['A', 'B']);

    table.setGlobalSearch('done');
    expect(table.getColumnFacetOptions('status')).toEqual(['Done']);
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

  it('debounces column filters and global search when debounce options are configured', () => {
    vi.useFakeTimers();
    try {
      const table = useIoiTable({
        rows: [
          { id: 1, name: 'Alpha' },
          { id: 2, name: 'Beta' },
          { id: 3, name: 'Gamma' }
        ],
        columns: [{ field: 'name', type: 'text' }],
        filterDebounceMs: 30,
        globalSearchDebounceMs: 40
      });

      table.setColumnFilter('name', { type: 'text', value: 'a', operator: 'equals' });
      expect(table.state.value.filters).toEqual([]);
      vi.advanceTimersByTime(29);
      expect(table.state.value.filters).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(table.state.value.filters).toEqual([
        {
          field: 'name',
          filter: {
            type: 'text',
            value: 'a',
            operator: 'equals'
          }
        }
      ]);

      table.setGlobalSearch('beta');
      expect(table.state.value.globalSearch).toBe('');
      vi.advanceTimersByTime(39);
      expect(table.state.value.globalSearch).toBe('');
      vi.advanceTimersByTime(1);
      expect(table.state.value.globalSearch).toBe('beta');
    } finally {
      vi.useRealTimers();
    }
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

  it('exports nested objects as flattened dot-notation columns', () => {
    const table = useIoiTable({
      rows: [
        {
          id: 1,
          user: {
            profile: {
              name: 'Alpha',
              stats: {
                score: 12
              }
            }
          }
        },
        {
          id: 2,
          user: {
            profile: {
              name: 'Beta',
              stats: {
                score: null
              }
            }
          }
        }
      ],
      columns: [{ field: 'user.profile' }]
    });

    const csv = table.exportCSV({ scope: 'allLoaded', headerMode: 'header' });

    expect(csv).toBe('user.profile.name,user.profile.stats.score\nAlpha,12\nBeta,');
  });

  it('exports arrays as JSON strings', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, tags: ['alpha', 'beta'] },
        { id: 2, tags: [{ label: 'x' }, 99, true] },
        { id: 3, tags: [] }
      ],
      columns: [{ field: 'tags' }]
    });

    const csv = table.exportCSV({ scope: 'allLoaded', headerMode: 'header' });

    expect(csv).toBe(
      'tags\n"[""alpha"",""beta""]"\n"[{""label"":""x""},99,true]"\n[]'
    );
  });

  it('quotes CSV fields containing commas, quotes, or newlines', () => {
    const table = useIoiTable({
      rows: [{ id: 1, note: 'Hello, "World"\nLine 2' }],
      columns: [{ field: 'note' }]
    });

    const csv = table.exportCSV({ scope: 'allLoaded', headerMode: 'header' });

    expect(csv).toBe('note\n"Hello, ""World""\nLine 2"');
  });

  it('sanitizes formula-like CSV fields by default', () => {
    const table = useIoiTable({
      rows: [{ id: 1, note: '=SUM(A1:A2)' }, { id: 2, note: ' normal' }],
      columns: [{ field: 'note', header: '+unsafe_header' }]
    });

    const csv = table.exportCSV({ scope: 'allLoaded', headerMode: 'header' });

    expect(csv).toBe("'+unsafe_header\n'=SUM(A1:A2)\n normal");
  });

  it('allows opting out of formula sanitization and supports custom escape prefixes', () => {
    const table = useIoiTable({
      rows: [{ id: 1, note: '@cmd' }],
      columns: [{ field: 'note', header: '-header' }]
    });

    const rawCsv = table.exportCSV({
      scope: 'allLoaded',
      sanitizeFormulas: false,
      headerMode: 'header'
    });
    const tabEscapedCsv = table.exportCSV({
      scope: 'allLoaded',
      headerMode: 'header',
      formulaEscapePrefix: '\t'
    });

    expect(rawCsv).toBe('-header\n@cmd');
    expect(tabEscapedCsv).toBe('\t-header\n\t@cmd');
  });

  it('supports CSV scopes and preserves sorted order for filtered exports', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, group: 'A', score: 10, secret: 's1' },
        { id: 2, group: 'B', score: 99, secret: 's2' },
        { id: 3, group: 'A', score: 30, secret: 's3' },
        { id: 4, group: 'A', score: 20, secret: 's4' }
      ],
      columns: [
        { field: 'id', header: 'ID' },
        { field: 'group', header: 'Group' },
        { field: 'score', header: 'Score' },
        { field: 'secret', header: 'Secret', hidden: true }
      ],
      rowKey: 'id',
      rowHeight: 20,
      viewportHeight: 20,
      overscan: 0
    });

    table.setColumnFilter('group', { type: 'text', operator: 'equals', value: 'A' });
    table.setSortState([{ field: 'score', direction: 'desc' }]);
    expect(table.sortedIndices.value).toEqual([2, 3, 0]);

    const filtered = table.exportCSV({ scope: 'filtered' });
    const visible = table.exportCSV({ scope: 'visible' });

    table.toggleRow(2);
    table.toggleRow(4);
    const selected = table.exportCSV({ scope: 'selected' });
    const allLoaded = table.exportCSV({ scope: 'allLoaded' });
    const withHiddenAndHeaders = table.exportCSV({
      scope: 'allLoaded',
      includeHiddenColumns: true,
      headerMode: 'header'
    });

    expect(filtered).toBe('id,group,score\n3,A,30\n4,A,20\n1,A,10');
    expect(visible).toBe('id,group,score\n3,A,30');
    expect(selected).toBe('id,group,score\n2,B,99\n4,A,20');
    expect(allLoaded).toBe('id,group,score\n1,A,10\n2,B,99\n3,A,30\n4,A,20');
    expect(withHiddenAndHeaders).toBe(
      'ID,Group,Score,Secret\n1,A,10,s1\n2,B,99,s2\n3,A,30,s3\n4,A,20,s4'
    );
  });

  it('autodetects CSV delimiters (comma/semicolon/tab)', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [
        { field: 'name', type: 'text' },
        { field: 'score', type: 'number' }
      ]
    });

    const commaPreview = await table.parseCSV('name,score\nAlpha,10');
    const semicolonPreview = await table.parseCSV('name;score\nAlpha;10');
    const tabPreview = await table.parseCSV('name\tscore\nAlpha\t10');

    expect(commaPreview.delimiter).toBe(',');
    expect(semicolonPreview.delimiter).toBe(';');
    expect(tabPreview.delimiter).toBe('\t');
  });

  it('uses first-row headers by default and auto-maps fields case-insensitively', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [
        { field: 'user.profile.name', type: 'text' },
        { field: 'score', type: 'number' }
      ]
    });

    const withHeader = await table.parseCSV('USER.PROFILE.NAME,SCORE\nAlpha,11');
    const withoutHeader = await table.parseCSV('Alpha,11\nBeta,12', {
      hasHeader: false
    });

    expect(withHeader.hasHeader).toBe(true);
    expect(withHeader.headers).toEqual(['USER.PROFILE.NAME', 'SCORE']);
    expect(withHeader.mapping).toEqual({
      'user.profile.name': 0,
      score: 1
    });

    expect(withoutHeader.hasHeader).toBe(false);
    expect(withoutHeader.headers).toEqual(['column_1', 'column_2']);
    expect(withoutHeader.mapping).toEqual({
      'user.profile.name': 0,
      score: 1
    });
  });

  it('limits preview rows to 200 by default and supports override', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }]
    });
    const dataRows = Array.from({ length: 250 }, (_, index) => `Name ${index + 1}`).join('\n');

    const defaultPreview = await table.parseCSV(`name\n${dataRows}`);
    const limitedPreview = await table.parseCSV(`name\n${dataRows}`, {
      previewRowLimit: 50
    });

    expect(defaultPreview.totalRows).toBe(250);
    expect(defaultPreview.previewRowLimit).toBe(200);
    expect(defaultPreview.rows).toHaveLength(200);
    expect(defaultPreview.truncated).toBe(true);

    expect(limitedPreview.previewRowLimit).toBe(50);
    expect(limitedPreview.rows).toHaveLength(50);
    expect(limitedPreview.truncated).toBe(true);
  });

  it('uses defaultCsvPreviewRowLimit from table options when parse options omit it', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }],
      defaultCsvPreviewRowLimit: 12
    });
    const dataRows = Array.from({ length: 20 }, (_, index) => `Name ${index + 1}`).join('\n');

    const preview = await table.parseCSV(`name\n${dataRows}`);

    expect(preview.previewRowLimit).toBe(12);
    expect(preview.rows).toHaveLength(12);
    expect(preview.truncated).toBe(true);
  });

  it('returns a fatalError preview instead of throwing when CSV source reading fails', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }]
    });
    const failingSource = {
      text: async () => {
        throw new Error('boom');
      }
    } as unknown as Blob;

    const preview = await table.parseCSV(failingSource);

    expect(preview.fatalError).toBe('boom');
    expect(preview.rows).toEqual([]);
    expect(preview.totalRows).toBe(0);
    expect(table.lastEvent.value?.type).toBe('data:extract');
    expect((table.lastEvent.value?.payload as { reason?: string } | undefined)?.reason).toBe(
      'parseCSVError'
    );
  });

  it('returns a fatalError preview when CSV string input exceeds the configured size limit', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }],
      csvMaxSizeBytes: 5
    });

    const preview = await table.parseCSV('name\nAlpha');

    expect(preview.fatalError).toContain('maximum size of 5 bytes');
    expect(preview.rows).toEqual([]);
    expect(preview.totalRows).toBe(0);
  });

  it('rejects oversized blob-like CSV input before reading the body', async () => {
    const textSpy = vi.fn(async () => 'name\nAlpha');
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }],
      csvMaxSizeBytes: 5
    });

    const preview = await table.parseCSV({
      size: 10,
      text: textSpy
    } as unknown as Blob);

    expect(preview.fatalError).toContain('maximum size of 5 bytes');
    expect(textSpy).not.toHaveBeenCalled();
  });

  it('returns a fatalError preview when CSV input exceeds the configured row limit', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [{ field: 'name', type: 'text' }],
      csvMaxRows: 2
    });

    const preview = await table.parseCSV('name\nAlpha\nBeta\nGamma');

    expect(preview.fatalError).toContain('maximum row count of 2 rows');
    expect(preview.rows).toEqual([]);
    expect(preview.totalRows).toBe(0);
  });

  it('returns validation errors and commits nested paths via nestedPath.set', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [
        { field: 'user.profile.name', type: 'text' },
        {
          field: 'score',
          type: 'number',
          validate: (value) =>
            typeof value === 'number' && value >= 0 ? true : 'Score must be non-negative'
        }
      ]
    });
    const preview = await table.parseCSV(
      'user.profile.name,score\nAlpha,10\nBeta,-5\nGamma,invalid'
    );

    expect(preview.rows[0]?.values).toEqual({
      user: {
        profile: {
          name: 'Alpha'
        }
      },
      score: 10
    });
    expect(preview.rows[0]?.errors).toEqual([]);
    expect(preview.rows[1]?.errors[0]?.message).toBe('Score must be non-negative');
    expect(preview.rows[2]?.errors[0]?.message).toBe('Expected number value');

    const result = table.commitCSVImport(preview.mapping);

    expect(result.importedRowCount).toBe(1);
    expect(result.skippedRowCount).toBe(2);
    expect(result.errors.map((entry) => entry.rowNumber)).toEqual([3, 4]);
    expect(table.rows.value).toHaveLength(1);
    expect(table.rows.value[0]).toEqual({
      user: {
        profile: {
          name: 'Alpha'
        }
      },
      score: 10
    });
  });

  it('captures thrown validator errors as row validation errors', async () => {
    const table = useIoiTable({
      rows: [],
      columns: [
        {
          field: 'score',
          type: 'number',
          validate: () => {
            throw new Error('validator exploded');
          }
        }
      ]
    });

    const preview = await table.parseCSV('score\n10');

    expect(preview.rows[0]?.errors[0]?.message).toBe('validator exploded');
    const result = table.commitCSVImport(preview.mapping);
    expect(result.importedRowCount).toBe(0);
    expect(result.errors[0]?.errors[0]?.message).toBe('validator exploded');
  });

  it('parses JSON-array-like cells and keeps invalid JSON-array text raw', async () => {
    const table = useIoiTable<{ tags: unknown; score: number | null }>({
      rows: [],
      columns: [
        { field: 'tags', type: 'text' },
        { field: 'score', type: 'number' }
      ]
    });
    const preview = await table.parseCSV(
      'tags,score\n"[""alpha"",""beta""]",10\n"[a,b]",20'
    );

    expect(preview.delimiter).toBe(',');
    expect(preview.rows[0]?.values).toEqual({
      tags: ['alpha', 'beta'],
      score: 10
    });
    expect(preview.rows[1]?.values).toEqual({
      tags: '[a,b]',
      score: 20
    });

    const result = table.commitCSVImport(preview.mapping);
    expect(result.importedRowCount).toBe(2);
    expect(table.rows.value[0]?.tags).toEqual(['alpha', 'beta']);
    expect(table.rows.value[1]?.tags).toBe('[a,b]');
  });

  it('stages edits without mutating row data until commit', () => {
    const table = useIoiTable({
      rows: [{ id: 1, user: { profile: { name: 'Alpha' } } }],
      columns: [{ field: 'user.profile.name', type: 'text' }],
      rowKey: 'id'
    });

    table.startEdit({ rowKey: 1, field: 'user.profile.name' });
    table.setEditDraft('Beta');

    expect(table.state.value.editingCell).toMatchObject({
      rowKey: 1,
      field: 'user.profile.name'
    });
    expect(table.rows.value[0]?.user.profile.name).toBe('Alpha');
  });

  it('commits staged edits through nestedPath.set for nested fields', () => {
    const table = useIoiTable({
      rows: [{ id: 1, user: { profile: { name: 'Alpha' } } }],
      columns: [{ field: 'user.profile.name', type: 'text' }],
      rowKey: 'id'
    });

    table.startEdit({ rowKey: 1, field: 'user.profile.name' });
    table.setEditDraft('Beta');

    const committed = table.commitEdit();

    expect(committed).toBe(true);
    expect(table.rows.value[0]?.user.profile.name).toBe('Beta');
    expect(table.state.value.editingCell).toBeNull();
    expect(table.editingDraft.value).toBeNull();
    expect(table.editingError.value).toBeNull();
  });

  it('cancels staged edits without mutating row data', () => {
    const table = useIoiTable({
      rows: [{ id: 1, name: 'Alpha' }],
      columns: [{ field: 'name', type: 'text' }],
      rowKey: 'id'
    });

    table.startEdit({ rowKey: 1, field: 'name' });
    table.setEditDraft('Beta');
    table.cancelEdit();

    expect(table.rows.value[0]?.name).toBe('Alpha');
    expect(table.state.value.editingCell).toBeNull();
    expect(table.editingDraft.value).toBeNull();
    expect(table.editingError.value).toBeNull();
  });

  it('blocks commit when column validation fails and exposes an error message', () => {
    const table = useIoiTable({
      rows: [{ id: 1, score: 10 }],
      columns: [
        {
          field: 'score',
          type: 'number',
          validate: (value) =>
            typeof value === 'number' && value >= 0 ? true : 'Score must be non-negative'
        }
      ],
      rowKey: 'id'
    });

    table.startEdit({ rowKey: 1, field: 'score' });
    table.setEditDraft(-5);

    const committed = table.commitEdit();

    expect(committed).toBe(false);
    expect(table.rows.value[0]?.score).toBe(10);
    expect(table.editingError.value).toBe('Score must be non-negative');
    expect(table.state.value.editingCell).not.toBeNull();
  });

  it('emits schema-versioned data:modify events and calls commit hooks', () => {
    const onCellCommit = vi.fn();
    const onRowUpdate = vi.fn();
    const table = useIoiTable({
      rows: [{ id: 1, name: 'Alpha' }],
      columns: [{ field: 'name', type: 'text' }],
      rowKey: 'id',
      onCellCommit,
      onRowUpdate
    });

    table.startEdit({ rowKey: 1, field: 'name' });
    table.setEditDraft('Beta');

    const committed = table.commitEdit();

    expect(committed).toBe(true);
    expect(table.lastEvent.value?.schemaVersion).toBe(1);
    expect(table.lastEvent.value?.type).toBe('data:modify');
    expect(table.lastEvent.value?.payload).toMatchObject({
      reason: 'commitEdit',
      rowIndex: 0,
      rowKey: 1,
      field: 'name',
      oldValue: 'Alpha',
      newValue: 'Beta'
    });
    expect(onCellCommit).toHaveBeenCalledTimes(1);
    expect(onCellCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        rowIndex: 0,
        rowKey: 1,
        field: 'name',
        oldValue: 'Alpha',
        newValue: 'Beta'
      })
    );
    expect(onRowUpdate).toHaveBeenCalledTimes(1);
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

  it('computes group aggregations and paginates grouped render entries', () => {
    const table = useIoiTable({
      rows: [
        { id: 1, group: 'A', score: 10 },
        { id: 2, group: 'A', score: 30 },
        { id: 3, group: 'B', score: 90 }
      ],
      columns: [
        { field: 'group', type: 'text' },
        { field: 'score', type: 'number' }
      ],
      groupBy: 'group',
      groupAggregations: {
        score: ['sum', 'avg', 'min', 'max', 'count']
      },
      pagination: {
        pageSize: 2
      }
    });

    expect(table.groups.value).toEqual([
      expect.objectContaining({
        value: 'A',
        count: 2,
        aggregations: {
          score_sum: 40,
          score_avg: 20,
          score_min: 10,
          score_max: 30,
          score_count: 2
        }
      }),
      expect.objectContaining({
        value: 'B',
        count: 1,
        aggregations: {
          score_sum: 90,
          score_avg: 90,
          score_min: 90,
          score_max: 90,
          score_count: 1
        }
      })
    ]);
    expect(table.pageCount.value).toBe(1);
    expect(table.renderEntries.value.map((entry) => entry.type)).toEqual(['group', 'group']);
    expect(table.visibleIndices.value).toEqual([]);

    table.toggleGroupExpansion(table.groups.value[0]!.key);

    expect(table.pageCount.value).toBe(2);
    expect(table.renderEntries.value.map((entry) => entry.type)).toEqual(['group', 'row']);
    expect(table.visibleIndices.value).toEqual([0]);

    table.setPageIndex(1);

    expect(table.renderEntries.value.map((entry) => entry.type)).toEqual(['row', 'group']);
    expect(table.visibleIndices.value).toEqual([1]);
  });

  describe('server mode', () => {
    it('initializes with loading state when server mode is enabled', () => {
      const fetch = vi.fn().mockResolvedValue({ rows: [], totalRows: 0 });

      const api = useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: { fetch }
      });

      expect(api.loading.value).toBe(true);
      expect(api.error.value).toBeNull();
    });

    it('calls fetch on mount with initial params', async () => {
      const fetch = vi.fn().mockResolvedValue({ rows: [{ id: 1, name: 'Test' }], totalRows: 1 });

      useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: { fetch, debounceMs: 0 }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          pageSize: expect.any(Number),
          sort: [],
          filters: [],
          globalSearch: ''
        })
      );
    });

    it('uses the documented default initialPageSize of 50 in server mode', async () => {
      const fetch = vi.fn().mockResolvedValue({ rows: [], totalRows: 0 });

      useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: { fetch, debounceMs: 0 }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 50
        })
      );
    });

    it('uses serverTotalRows for pageCount in server mode', () => {
      const api = useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: {
          fetch: vi.fn().mockResolvedValue({ rows: [], totalRows: 100 })
        },
        pagination: { pageSize: 10 }
      });

      api.state.value.serverTotalRows = 100;

      expect(api.pageCount.value).toBe(10);
    });

    it('allows setPageIndex before the first server response resolves', () => {
      const fetch = vi.fn(
        () => new Promise<{ rows: Array<{ id: number }>; totalRows: number }>(() => {})
      );

      const api = useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: { fetch, debounceMs: 0, initialPageSize: 25 }
      });

      api.setPageIndex(3);

      expect(api.pageIndex.value).toBe(3);
    });

    it('exposes refresh method for manual data refresh', () => {
      const fetch = vi.fn().mockResolvedValue({ rows: [], totalRows: 0 });

      const api = useIoiTable({
        columns: [{ field: 'id', header: 'ID' }],
        rowKey: 'id',
        dataMode: 'server',
        serverOptions: { fetch, debounceMs: 0 }
      });

      expect(api.refresh).toBeDefined();
      expect(typeof api.refresh).toBe('function');
    });
  });
});
