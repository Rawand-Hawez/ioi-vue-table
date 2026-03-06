import { describe, it, expect, beforeEach } from 'vitest';
import { useIoiTable } from '../src/composables/useIoiTable';
import type { ColumnDef } from '../src/types';

interface TestRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

describe('Row Expansion', () => {
  const columns: ColumnDef<TestRow>[] = [
    { field: 'id', header: 'ID', type: 'number' },
    { field: 'name', header: 'Name', type: 'text' },
    { field: 'email', header: 'Email', type: 'text' }
  ];

  const rows: TestRow[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', status: 'active' },
    { id: 2, name: 'Bob', email: 'bob@example.com', status: 'inactive' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'active' }
  ];

  describe('Basic Expansion', () => {
    it('should initialize with empty expanded rows', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      expect(table.state.value.expandedRowKeys).toEqual([]);
    });

    it('should toggle row expansion', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      expect(table.state.value.expandedRowKeys).toEqual([1]);
      expect(table.isRowExpanded(1)).toBe(true);

      table.toggleRowExpansion(1);
      expect(table.state.value.expandedRowKeys).toEqual([]);
      expect(table.isRowExpanded(1)).toBe(false);
    });

    it('should expand multiple rows', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      table.toggleRowExpansion(2);
      expect(table.state.value.expandedRowKeys).toEqual([1, 2]);
      expect(table.isRowExpanded(1)).toBe(true);
      expect(table.isRowExpanded(2)).toBe(true);
      expect(table.isRowExpanded(3)).toBe(false);
    });

    it('should expand all rows', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.expandAllRows();
      expect(table.state.value.expandedRowKeys).toEqual([1, 2, 3]);
      expect(table.isRowExpanded(1)).toBe(true);
      expect(table.isRowExpanded(2)).toBe(true);
      expect(table.isRowExpanded(3)).toBe(true);
    });

    it('should collapse all rows', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.expandAllRows();
      expect(table.state.value.expandedRowKeys).toEqual([1, 2, 3]);

      table.collapseAllRows();
      expect(table.state.value.expandedRowKeys).toEqual([]);
      expect(table.isRowExpanded(1)).toBe(false);
      expect(table.isRowExpanded(2)).toBe(false);
      expect(table.isRowExpanded(3)).toBe(false);
    });
  });

  describe('Controlled Expansion', () => {
    it('should support controlled expandedRowKeys', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true,
        expandedRowKeys: [1, 2]
      });

      expect(table.state.value.expandedRowKeys).toEqual([1, 2]);
      expect(table.isRowExpanded(1)).toBe(true);
      expect(table.isRowExpanded(2)).toBe(true);
    });
  });

  describe('Conditional Expansion', () => {
    it('should respect rowExpandable function', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true,
        rowExpandable: (row) => row.status === 'active'
      });

      // Only active rows should be expandable
      table.expandAllRows();
      
      // Only rows 1 and 3 are active
      expect(table.state.value.expandedRowKeys).toEqual([1, 3]);
    });
  });

  describe('Expansion Events', () => {
    it('should emit onRowExpand callback when row is expanded', () => {
      let expandPayload: any = null;
      
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true,
        onRowExpand: (payload) => {
          expandPayload = payload;
        }
      });

      table.toggleRowExpansion(1);

      expect(expandPayload).not.toBeNull();
      expect(expandPayload.rowKey).toBe(1);
      expect(expandPayload.expanded).toBe(true);
      expect(expandPayload.row).toEqual(rows[0]);
      expect(expandPayload.rowIndex).toBe(0);
    });

    it('should emit onRowExpand callback when row is collapsed', () => {
      let expandPayload: any = null;
      
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true,
        onRowExpand: (payload) => {
          expandPayload = payload;
        }
      });

      table.toggleRowExpansion(1);
      expect(expandPayload.expanded).toBe(true);

      table.toggleRowExpansion(1);
      expect(expandPayload.expanded).toBe(false);
    });
  });

  describe('Expansion with Filtering', () => {
    it('should maintain expansion state when filtering', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      expect(table.isRowExpanded(1)).toBe(true);

      // Apply filter
      table.setGlobalSearch('Bob');
      
      // Row 1 should still be expanded even though it's filtered out
      expect(table.isRowExpanded(1)).toBe(true);
    });

    it('should preserve expansion when clearing filters', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      table.toggleRowExpansion(2);

      table.setGlobalSearch('Bob');
      table.clearAllFilters();

      expect(table.isRowExpanded(1)).toBe(true);
      expect(table.isRowExpanded(2)).toBe(true);
    });
  });

  describe('Expansion with Sorting', () => {
    it('should maintain expansion state when sorting', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      expect(table.isRowExpanded(1)).toBe(true);

      // Sort by name descending
      table.toggleSort('name');
      table.toggleSort('name'); // Toggle twice for desc

      // Row 1 should still be expanded
      expect(table.isRowExpanded(1)).toBe(true);
    });
  });

  describe('Expansion with Pagination', () => {
    it('should maintain expansion state across pages', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true,
        pagination: { pageSize: 2, pageIndex: 0 }
      });

      table.toggleRowExpansion(1);
      expect(table.isRowExpanded(1)).toBe(true);

      // Change page
      table.setPageIndex(1);

      // Row 1 should still be expanded
      expect(table.isRowExpanded(1)).toBe(true);
    });
  });

  describe('Reset State', () => {
    it('should clear expansion on reset', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.expandAllRows();
      expect(table.state.value.expandedRowKeys).toEqual([1, 2, 3]);

      table.resetState();
      expect(table.state.value.expandedRowKeys).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent row keys', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      // Toggle non-existent key should not throw
      expect(() => table.toggleRowExpansion(999)).not.toThrow();
      expect(table.isRowExpanded(999)).toBe(true);
    });

    it('should handle duplicate expansion toggles', () => {
      const table = useIoiTable({
        rows,
        columns,
        rowKey: 'id',
        expandable: true
      });

      table.toggleRowExpansion(1);
      table.toggleRowExpansion(1);
      table.toggleRowExpansion(1);

      expect(table.state.value.expandedRowKeys).toEqual([1]);
    });

    it('should work without rowKey but use index', () => {
      const table = useIoiTable({
        rows,
        columns,
        expandable: true
      });

      // When no rowKey, expansion should still work (using indices internally)
      table.toggleRowExpansion(0);
      expect(table.isRowExpanded(0)).toBe(true);
    });
  });
});
