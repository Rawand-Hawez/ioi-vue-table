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
});
