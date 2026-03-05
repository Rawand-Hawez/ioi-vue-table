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
});
