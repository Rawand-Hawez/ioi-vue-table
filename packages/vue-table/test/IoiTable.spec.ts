import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import IoiTable from '../src/components/IoiTable.vue';

describe('IoiTable', () => {
  it('renders columns and rows', () => {
    const wrapper = mount(IoiTable, {
      props: {
        columns: [
          { field: 'id', header: 'ID' },
          { field: 'name', header: 'Name' }
        ],
        rows: [
          { id: 1, name: 'Aster' },
          { id: 2, name: 'Beryl' }
        ]
      }
    });

    expect(wrapper.findAll('thead th')).toHaveLength(2);
    expect(wrapper.text()).toContain('ID');
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.text()).toContain('Aster');
    expect(wrapper.text()).toContain('Beryl');
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
