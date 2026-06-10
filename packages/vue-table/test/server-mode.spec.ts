import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import IoiTable from '../src/components/IoiTable.vue';
import { nextTick } from 'vue';
import type { ServerFetchParams, ServerFetchResult } from '../src/types';

function createMockFetch(delay = 0) {
  const fetch = vi.fn(async (params: ServerFetchParams): Promise<ServerFetchResult> => {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    const start = params.pageIndex * params.pageSize;
    const allRows = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
    return {
      rows: allRows.slice(start, start + params.pageSize),
      totalRows: 100
    };
  });
  return fetch;
}

describe('server mode', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('calls serverOptions.fetch on mount with correct params', async () => {
    const fetch = createMockFetch();
    mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();

    expect(fetch).toHaveBeenCalled();
    const params = fetch.mock.calls[0][0];
    expect(params.pageIndex).toBe(0);
    expect(params.pageSize).toBe(50);
  });

  it('displays fetched rows after fetch resolves', async () => {
    const fetch = vi.fn(async (): Promise<ServerFetchResult> => ({
      rows: [{ id: 1, name: 'Server Item 1' }, { id: 2, name: 'Server Item 2' }],
      totalRows: 2
    }));
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();
    await nextTick();

    expect(fetch).toHaveBeenCalled();
    const cells = wrapper.findAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('uses canonical serverOptions.fetch (not query)', () => {
    const fetch = createMockFetch();
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    expect(wrapper.props('serverOptions')).toBeDefined();
    expect(typeof (wrapper.props('serverOptions') as { fetch: unknown }).fetch).toBe('function');
  });

  it('respects initialPageSize from serverOptions', async () => {
    const fetch = createMockFetch();
    mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch, initialPageSize: 10 },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();

    expect(fetch).toHaveBeenCalled();
    const params = fetch.mock.calls[0][0];
    expect(params.pageSize).toBe(10);
  });

  it('sets loading state during fetch', async () => {
    let resolveFetch!: (result: ServerFetchResult) => void;
    const fetch = vi.fn(async () => {
      return new Promise<ServerFetchResult>((resolve) => { resolveFetch = resolve; });
    });

    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();

    expect(wrapper.vm.loading || wrapper.find('.ioi-table__loading-overlay').exists()).toBeTruthy();

    resolveFetch({ rows: [{ id: 1, name: 'Loaded' }], totalRows: 1 });
    await nextTick();
    await nextTick();
  });

  it('shows error overlay on fetch failure', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('Network error');
    });

    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();
    await nextTick();

    expect(wrapper.find('.ioi-table__error-overlay').exists()).toBe(true);
  });

  it('passes sort state to fetch params', async () => {
    const fetch = createMockFetch();
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();
    fetch.mockClear();

    await wrapper.find('th[data-column-id="name"] .ioi-table__sort-button').trigger('click');
    vi.advanceTimersByTime(500);
    await nextTick();

    expect(fetch).toHaveBeenCalled();
    const params = fetch.mock.calls[0][0] as ServerFetchParams;
    expect(params.sort.length).toBeGreaterThan(0);
    expect(params.sort[0].field).toBe('name');
  });

  it('calls fetch on globalSearch change', async () => {
    const fetch = createMockFetch();
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        dataMode: 'server',
        serverOptions: { fetch, debounceMs: 100 },
        rowKey: 'id'
      }
    });

    vi.advanceTimersByTime(500);
    await nextTick();
    fetch.mockClear();

    (wrapper.vm as { setGlobalSearch: (v: string) => void }).setGlobalSearch('test query');
    await nextTick();
    vi.advanceTimersByTime(500);
    await nextTick();
    await nextTick();

    expect(fetch).toHaveBeenCalled();
    const params = fetch.mock.calls[0][0] as ServerFetchParams;
    expect(params.globalSearch).toBe('test query');
  });
});
