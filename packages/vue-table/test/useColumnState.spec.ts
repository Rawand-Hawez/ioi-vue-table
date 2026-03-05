import { describe, expect, it } from 'vitest';
import {
  createInMemoryColumnStateAdapter,
  useColumnState
} from '../src/composables/useColumnState';

describe('useColumnState', () => {
  it('uses explicit id first and falls back to field for stable column ids', () => {
    const state = useColumnState({
      columns: [
        { id: 'primary-id', field: 'id' },
        { field: 'user.name' }
      ]
    });

    expect(state.orderedColumns.value.map((column) => column.id)).toEqual([
      'primary-id',
      'user.name'
    ]);
  });

  it('updates column order and visibility state', () => {
    const state = useColumnState({
      columns: [{ field: 'id' }, { field: 'name' }, { field: 'status' }]
    });

    state.setColumnOrder(['status', 'id']);
    expect(state.orderedColumns.value.map((column) => column.id)).toEqual([
      'status',
      'id',
      'name'
    ]);

    state.setColumnVisibility('status', true);
    expect(state.visibleColumns.value.map((column) => column.id)).toEqual(['id', 'name']);
  });

  it('partitions pinned columns into left, center, and right groups', () => {
    const state = useColumnState({
      columns: [{ field: 'id' }, { field: 'name' }, { field: 'status' }]
    });

    state.setColumnPin('id', 'left');
    state.setColumnPin('status', 'right');

    expect(state.pinnedLeftColumns.value.map((column) => column.id)).toEqual(['id']);
    expect(state.centerColumns.value.map((column) => column.id)).toEqual(['name']);
    expect(state.pinnedRightColumns.value.map((column) => column.id)).toEqual(['status']);
  });

  it('persists state through the adapter interface', () => {
    const adapter = createInMemoryColumnStateAdapter();
    const first = useColumnState({
      columns: [{ field: 'id' }, { field: 'name' }],
      adapter
    });

    first.setColumnPin('id', 'left');
    first.setColumnVisibility('name', true);

    const rehydrated = useColumnState({
      columns: [{ field: 'id' }, { field: 'name' }],
      adapter
    });

    expect(rehydrated.pinnedLeftColumns.value.map((column) => column.id)).toEqual(['id']);
    expect(rehydrated.visibleColumns.value.map((column) => column.id)).toEqual(['id']);
  });

  it('clamps width updates to min/max bounds and rounds to integer pixels', () => {
    const state = useColumnState({
      columns: [{ field: 'score', width: 150, minWidth: 120, maxWidth: 180 }]
    });

    state.setColumnSizing('score', { width: 119.2 });
    expect(state.orderedColumns.value[0]?.width).toBe(120);

    state.setColumnSizing('score', { width: 180.7 });
    expect(state.orderedColumns.value[0]?.width).toBe(180);
  });

  it('falls back invalid widths to minWidth or default width when min/max are missing', () => {
    const withMin = useColumnState({
      columns: [{ field: 'amount', minWidth: 96 }]
    });
    const withoutMin = useColumnState({
      columns: [{ field: 'name' }]
    });

    withMin.setColumnSizing('amount', { width: Number.NaN });
    expect(withMin.orderedColumns.value[0]?.width).toBe(96);

    withMin.setColumnSizing('amount', { width: -80 });
    expect(withMin.orderedColumns.value[0]?.width).toBe(96);

    withoutMin.setColumnSizing('name', { width: Number.NaN });
    expect(withoutMin.orderedColumns.value[0]?.width).toBe(160);
  });

  it('ignores numeric resize attempts for percent-width columns', () => {
    const state = useColumnState({
      columns: [{ field: 'ratio', width: '35%', minWidth: 80, maxWidth: 200 }]
    });

    state.setColumnSizing('ratio', { width: 140 });
    expect(state.orderedColumns.value[0]?.width).toBe('35%');
  });

  it('sanitizes order updates and remains stable under rapid sizing updates', () => {
    const state = useColumnState({
      columns: [
        { field: 'id' },
        { field: 'name' },
        { field: 'status' },
        { field: 'score', width: 120, minWidth: 100, maxWidth: 140 }
      ]
    });

    state.setColumnOrder(['status', 'status', 'unknown', 'id']);
    expect(state.orderedColumns.value.map((column) => column.id)).toEqual([
      'status',
      'id',
      'name',
      'score'
    ]);

    const rapidWidths = [95, 101.4, 139.7, 144, 88, 111.2, 136.6];
    for (let index = 0; index < 120; index += 1) {
      state.setColumnSizing('score', { width: rapidWidths[index % rapidWidths.length] });
    }

    const width = state.orderedColumns.value.find((column) => column.id === 'score')?.width;
    expect(typeof width).toBe('number');
    expect(width).toBeGreaterThanOrEqual(100);
    expect(width).toBeLessThanOrEqual(140);
    expect(Number.isInteger(width as number)).toBe(true);
  });
});
