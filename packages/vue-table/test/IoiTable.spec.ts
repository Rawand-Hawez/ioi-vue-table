import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
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
});
