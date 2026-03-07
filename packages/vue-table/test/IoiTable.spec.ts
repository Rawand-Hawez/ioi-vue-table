import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import IoiTable from '../src/components/IoiTable.vue';

describe('IoiTable', () => {
  it('renders columns and rows', () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      name: `Name ${index + 1}`
    }));

    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Name' }
        ],
        rows,
        rowHeight: 24,
        height: 72,
        overscan: 1
      }
    });

    expect(wrapper.findAll('thead th')).toHaveLength(2);
    expect(wrapper.text()).toContain('ID');
    expect(wrapper.text()).toContain('Name');

    const renderedRows = wrapper.findAll('tbody tr.ioi-table__row');
    expect(renderedRows.length).toBeLessThan(rows.length);
    expect(renderedRows.length).toBe(5);
  });

  it('keeps virtualization active when height prop is non-numeric at runtime', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = Array.from({ length: 40 }, (_, index) => ({
      id: index + 1,
      name: `Name ${index + 1}`
    }));

    try {
      const wrapper = mount(IoiTable as unknown as object, {
        props: {
          columns: [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Name' }
          ],
          rows,
          rowHeight: 48,
          height: '100%',
          overscan: 1
        }
      });

      const renderedRows = wrapper.findAll('tbody tr.ioi-table__row');
      expect(renderedRows.length).toBeLessThan(rows.length);
      expect(renderedRows.length).toBe(9);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('renders empty slot when no rows exist', () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        rows: []
      },
      slots: {
        empty: 'Nothing to show'
      }
    });

    expect(wrapper.text()).toContain('Nothing to show');
  });

  it('resizes headers with clamping via the resize handle', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'score', header: 'Score', width: 120, minWidth: 100, maxWidth: 130 }],
        rows: [{ score: 1 }]
      }
    });

    const handle = wrapper.find('th[data-column-id="score"] .ioi-table__resize-handle');
    expect(handle.exists()).toBe(true);

    await handle.trigger('mousedown', { clientX: 100, button: 0 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 180 }));
    await nextTick();

    const snapshot = (wrapper.vm as { getColumnStateSnapshot: () => { widths: Record<string, unknown> } })
      .getColumnStateSnapshot();
    expect(snapshot.widths.score).toBe(130);
  });

  it('reorders columns by drag and drop within the same pin group', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { id: 'id', field: 'id', header: 'ID', pin: 'left', width: 100 },
          { id: 'project', field: 'project', header: 'Project', pin: 'left', width: 160 },
          { id: 'owner', field: 'owner', header: 'Owner', width: 140 },
          { id: 'status', field: 'status', header: 'Status', pin: 'right', width: 120 }
        ],
        rows: [{ id: 1, project: 'A', owner: 'O', status: 'Queued' }]
      }
    });

    const dataTransfer = {
      setData: () => {},
      getData: () => '',
      effectAllowed: 'move',
      dropEffect: 'move'
    } as unknown as DataTransfer;

    const projectHeader = wrapper.find('th[data-column-id="project"]');
    const idHeader = wrapper.find('th[data-column-id="id"]');

    await projectHeader.trigger('dragstart', { dataTransfer });
    await idHeader.trigger('dragover', { dataTransfer });
    await idHeader.trigger('drop', { dataTransfer });
    await projectHeader.trigger('dragend', { dataTransfer });
    await nextTick();

    const snapshot = (
      wrapper.vm as { getColumnStateSnapshot: () => { order: string[] } }
    ).getColumnStateSnapshot();
    expect(snapshot.order).toEqual(['project', 'id', 'owner', 'status']);
  });

  it('blocks drag reorder across pin groups', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { id: 'id', field: 'id', header: 'ID', pin: 'left', width: 100 },
          { id: 'project', field: 'project', header: 'Project', pin: 'left', width: 160 },
          { id: 'owner', field: 'owner', header: 'Owner', width: 140 },
          { id: 'status', field: 'status', header: 'Status', pin: 'right', width: 120 }
        ],
        rows: [{ id: 1, project: 'A', owner: 'O', status: 'Queued' }]
      }
    });

    const dataTransfer = {
      setData: () => {},
      getData: () => '',
      effectAllowed: 'move',
      dropEffect: 'move'
    } as unknown as DataTransfer;

    const idHeader = wrapper.find('th[data-column-id="id"]');
    const ownerHeader = wrapper.find('th[data-column-id="owner"]');

    await idHeader.trigger('dragstart', { dataTransfer });
    await ownerHeader.trigger('dragover', { dataTransfer });
    await ownerHeader.trigger('drop', { dataTransfer });
    await idHeader.trigger('dragend', { dataTransfer });
    await nextTick();

    const snapshot = (
      wrapper.vm as { getColumnStateSnapshot: () => { order: string[] } }
    ).getColumnStateSnapshot();
    expect(snapshot.order).toEqual(['id', 'project', 'owner', 'status']);
  });

  it('renders header filter controls and emits filter events', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'status', header: 'Status', headerFilter: 'select' },
          { field: 'owner', header: 'Owner', headerFilter: 'text' }
        ],
        rows: [
          { status: 'Queued', owner: 'A' },
          { status: 'Done', owner: 'A' },
          { status: 'Queued', owner: 'B' }
        ]
      }
    });

    const select = wrapper.find('select.ioi-table__filter-select');
    const input = wrapper.find('input.ioi-table__filter-input');
    expect(select.exists()).toBe(true);
    expect(input.exists()).toBe(true);

    const optionLabels = select.findAll('option').map((option) => option.text());
    expect(optionLabels).toEqual(['All', 'Done', 'Queued']);

    await select.setValue('Queued');
    await nextTick();

    await input.setValue('A');
    await nextTick();

    const emitted = wrapper.emitted('state-change') ?? [];
    const eventTypes = emitted.map((entry) => (entry[0] as { type: string }).type);
    expect(eventTypes).toContain('data:filter');
  });

  it('uses field keys for duplicate-column header filters', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'status', header: 'Primary Status', headerFilter: 'text' },
          { field: 'status', header: 'Secondary Status', headerFilter: 'text' }
        ],
        rows: [
          { status: 'Queued' },
          { status: 'Done' }
        ]
      }
    });

    const inputs = wrapper.findAll('input.ioi-table__filter-input');
    expect(inputs).toHaveLength(2);

    await inputs[1]?.setValue('Queued');
    await nextTick();

    const filterEvents = (wrapper.emitted('state-change') ?? [])
      .map((entry) => entry[0] as { type: string; payload?: { filters?: Array<{ field: string }> } })
      .filter((event) => event.type === 'data:filter');
    const lastFilterEvent = filterEvents[filterEvents.length - 1];

    expect(lastFilterEvent?.payload?.filters?.[0]?.field).toBe('status');
  });

  it('emits pagination meta updates when controlled props change externally', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'id', header: 'ID' }],
        rows: Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })),
        pageIndex: 0,
        pageSize: 2
      }
    });

    const initialPaginationEventCount = (wrapper.emitted('pagination-change') ?? []).length;
    expect(initialPaginationEventCount).toBeGreaterThan(0);

    await wrapper.setProps({ pageIndex: 1 });
    await nextTick();

    const paginationEvents = wrapper.emitted('pagination-change') ?? [];
    const lastEvent = paginationEvents[paginationEvents.length - 1]?.[0] as {
      pageIndex: number;
      pageSize: number;
      reason: string;
    };

    expect(paginationEvents.length).toBeGreaterThan(initialPaginationEventCount);
    expect(lastEvent.pageIndex).toBe(1);
    expect(lastEvent.pageSize).toBe(2);
    expect(lastEvent.reason).toBe('meta');
  });

  it('sets aria-sort on sorted columns', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Name' }
        ],
        rows: [
          { id: 2, name: 'B' },
          { id: 1, name: 'A' }
        ]
      }
    });

    const headersBefore = wrapper.findAll('thead th');
    expect(headersBefore[0]?.attributes('aria-sort')).toBe('none');

    (wrapper.vm as { setSortState: (state: Array<{ field: string; direction: 'asc' | 'desc' }>) => void })
      .setSortState([{ field: 'id', direction: 'asc' }]);
    await nextTick();

    const headersAfter = wrapper.findAll('thead th');
    expect(headersAfter[0]?.attributes('aria-sort')).toBe('ascending');
    expect(headersAfter[1]?.attributes('aria-sort')).toBe('none');
  });

  it('adds aria-selected and selected-row class when rows are selected', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        rows: [
          { id: 1, name: 'Alpha' },
          { id: 2, name: 'Beta' }
        ],
        rowKey: 'id'
      }
    });

    (wrapper.vm as { toggleRow: (key: string | number) => void }).toggleRow(1);
    await nextTick();

    const firstRow = wrapper.findAll('tbody tr.ioi-table__row')[0];
    expect(firstRow?.attributes('aria-selected')).toBe('true');
    expect(firstRow?.classes()).toContain('ioi-table__row--selected');
  });

  it('supports keyboard selection and row-to-row focus navigation', async () => {
    const wrapper = mount(IoiTable, {
      attachTo: document.body,
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        rows: [
          { id: 1, name: 'Alpha' },
          { id: 2, name: 'Beta' },
          { id: 3, name: 'Gamma' }
        ],
        rowKey: 'id',
        rowHeight: 24,
        height: 120,
        overscan: 0
      }
    });

    const rows = wrapper.findAll('tbody tr.ioi-table__row');
    expect(rows).toHaveLength(3);

    await rows[0]?.trigger('keydown', { key: 'Enter' });
    await nextTick();
    expect((wrapper.vm as { getSelectedKeys: () => Array<string | number> }).getSelectedKeys()).toEqual([1]);

    await rows[1]?.trigger('keydown', { key: ' ', shiftKey: true });
    await nextTick();
    expect((wrapper.vm as { getSelectedKeys: () => Array<string | number> }).getSelectedKeys()).toEqual([
      1,
      2
    ]);

    const firstRow = rows[0]?.element as HTMLTableRowElement;
    firstRow.focus();
    await rows[0]?.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(document.activeElement).toBe(rows[1]?.element);

    wrapper.unmount();
  });

  it('supports keyboard row expansion without rowKey and updates the expander label', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'name', header: 'Name' }],
        rows: [{ name: 'Alpha' }],
        expandable: true
      },
      slots: {
        'expanded-row': ({ row }: { row: Record<string, unknown> }) => `Details:${String(row.name ?? '')}`
      }
    });

    const row = wrapper.find('tbody tr.ioi-table__row');
    expect(row.exists()).toBe(true);
    expect(wrapper.find('button.ioi-table__expand-icon').attributes('aria-label')).toBe('Expand row');

    await row.trigger('keydown', { key: 'Enter' });
    await nextTick();

    expect(wrapper.find('button.ioi-table__expand-icon').attributes('aria-label')).toBe('Collapse row');
    expect(wrapper.text()).toContain('Details:Alpha');
  });

  it('updates group-toggle aria labels as groups expand and collapse', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'group', header: 'Group' },
          { field: 'name', header: 'Name' }
        ],
        rows: [
          { id: 1, group: 'A', name: 'Alpha' },
          { id: 2, group: 'A', name: 'Beta' },
          { id: 3, group: 'B', name: 'Gamma' }
        ],
        rowKey: 'id',
        groupBy: 'group'
      }
    });

    const toggle = wrapper.find('button.ioi-table__group-toggle');
    expect(toggle.attributes('aria-label')).toBe('Expand group');

    await toggle.trigger('click');
    await nextTick();

    expect(wrapper.find('button.ioi-table__group-toggle').attributes('aria-label')).toBe('Collapse group');
    expect(wrapper.findAll('tbody tr.ioi-table__row')).toHaveLength(2);
  });

  it('updates the live region when semantic events are emitted', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [{ field: 'id', header: 'ID' }],
        rows: [{ id: 1 }]
      }
    });

    (wrapper.vm as { setSortState: (state: Array<{ field: string; direction: 'asc' | 'desc' }>) => void })
      .setSortState([{ field: 'id', direction: 'desc' }]);
    await nextTick();

    const liveRegion = wrapper.find('.ioi-table__sr-only');
    expect(liveRegion.text()).toContain('Sorted by id, descending.');
  });

  it('renders grouped pages with aggregation data and keeps later pages populated after expansion', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'group', header: 'Group' },
          { field: 'score', header: 'Score' }
        ],
        rows: [
          { id: 1, group: 'A', score: 10 },
          { id: 2, group: 'A', score: 30 },
          { id: 3, group: 'B', score: 90 }
        ],
        rowKey: 'id',
        groupBy: 'group',
        groupAggregations: {
          score: ['sum']
        },
        pageSize: 2
      }
    });

    expect(wrapper.findAll('tr.ioi-table__group-header')).toHaveLength(2);
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');

    const toggles = wrapper.findAll('button.ioi-table__group-toggle');
    await toggles[0]?.trigger('click');
    await nextTick();

    await wrapper.setProps({ pageIndex: 1 });
    await nextTick();

    expect(wrapper.findAll('tr.ioi-table__group-header')).toHaveLength(1);
    expect(wrapper.findAll('tbody tr.ioi-table__row')).toHaveLength(1);
    expect(wrapper.text()).toContain('30');
    expect(wrapper.text()).toContain('B');
  });

  it('renders grouped pages with aggregation data and keeps later pages populated after expansion', async () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'group', header: 'Group' },
          { field: 'score', header: 'Score' }
        ],
        rows: [
          { id: 1, group: 'A', score: 10 },
          { id: 2, group: 'A', score: 30 },
          { id: 3, group: 'B', score: 90 }
        ],
        rowKey: 'id',
        groupBy: 'group',
        groupAggregations: {
          score: ['sum']
        },
        pageSize: 2
      }
    });

    expect(wrapper.findAll('tr.ioi-table__group-header')).toHaveLength(2);
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');

    const toggles = wrapper.findAll('button.ioi-table__group-toggle');
    await toggles[0]?.trigger('click');
    await nextTick();

    await wrapper.setProps({ pageIndex: 1 });
    await nextTick();

    expect(wrapper.findAll('tr.ioi-table__group-header')).toHaveLength(1);
    expect(wrapper.findAll('tbody tr.ioi-table__row')).toHaveLength(1);
    expect(wrapper.text()).toContain('30');
    expect(wrapper.text()).toContain('B');
  });
});
