import type { IoiTableState } from '../../types';

export function createInitialState(viewportHeight: number): IoiTableState {
  return {
    sort: [],
    filters: [],
    globalSearch: '',
    selectedRowKeys: [],
    editingCell: null,
    viewport: {
      scrollTop: 0,
      viewportHeight
    }
  };
}
