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
});
