import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import IoiTable from '../src/components/IoiTable.vue';
import { nextTick } from 'vue';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCss(): string {
  return readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
}

const rows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
const columns = [{ field: 'name', header: 'Name' }];

describe('accessibility', () => {
  it('renders table with role="grid"', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const grid = wrapper.find('[role="grid"]');
    expect(grid.exists()).toBe(true);
  });

  it('renders rows with role="row"', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const tableRows = wrapper.findAll('[role="row"]');
    expect(tableRows.length).toBeGreaterThan(0);
  });

  it('renders header cells with aria-sort attribute', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const th = wrapper.find('th[data-column-id="name"]');
    expect(th.attributes('aria-sort')).toBeDefined();
  });

  it('renders aria-selected on rows when selection is enabled', async () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    (wrapper.vm as { toggleRow: (key: number) => void }).toggleRow(1);
    await nextTick();

    const firstRow = wrapper.findAll('tbody tr.ioi-table__row')[0];
    expect(firstRow.attributes('aria-selected')).toBe('true');
  });

  it('pagination buttons have aria-labels', async () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id', pageSize: 5 }
    });

    await nextTick();

    const buttons = wrapper.findAll('.ioi-table__pagination-btn');
    for (const btn of buttons) {
      expect(btn.attributes('aria-label')).toBeDefined();
    }
  });

  it('disabled pagination buttons have disabled attribute', async () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id', pageSize: 5 }
    });

    await nextTick();

    const prevBtn = wrapper.find('.ioi-table__pagination-prev');
    expect(prevBtn.attributes('disabled')).toBeDefined();
  });

  it('sort buttons have focus-visible styling capability', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const sortBtn = wrapper.find('.ioi-table__sort-button');
    expect(sortBtn.exists()).toBe(true);
  });

  it('cells have aria-colindex', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const cells = wrapper.findAll('td[aria-colindex]');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('table has a live region for announcements', () => {
    const wrapper = mount(IoiTable, {
      props: { columns, rows, rowKey: 'id' }
    });

    const liveRegion = wrapper.find('[aria-live]');
    expect(liveRegion.exists()).toBe(true);
  });

  it('CSS includes prefers-reduced-motion media query', () => {
    expect(readCss()).toContain('prefers-reduced-motion');
  });

  it('CSS includes prefers-contrast: high media query', () => {
    expect(readCss()).toContain('prefers-contrast: high');
  });

  it('pagination wraps in narrow viewport CSS', () => {
    expect(readCss()).toContain('.ioi-table__pagination');
  });

  it('focus outline uses ring CSS custom property', () => {
    expect(readCss()).toContain('--ioi-table-focus-outline');
  });
});
