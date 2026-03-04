import { describe, expect, it } from 'vitest';
import { useIoiTable } from '../src/composables/useIoiTable';

describe('useIoiTable', () => {
  it('returns a stable API shape', () => {
    const table = useIoiTable({
      rows: [{ id: 1, name: 'Alpha' }],
      columns: [{ field: 'name', header: 'Name' }]
    });

    expect(table.schemaVersion).toBe(1);
    expect(table.visibleIndices.value).toEqual([0]);
    expect(table.visibleRows.value).toEqual([{ id: 1, name: 'Alpha' }]);

    expect(typeof table.setRows).toBe('function');
    expect(typeof table.setColumns).toBe('function');
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

    table.setViewport(80, 60);

    expect(table.virtualRange.value).toEqual({ start: 3, end: 8 });
    expect(table.visibleIndices.value).toEqual([3, 4, 5, 6, 7]);
    expect(table.virtualPaddingTop.value).toBe(60);
    expect(table.virtualPaddingBottom.value).toBe(1840);
  });
});
