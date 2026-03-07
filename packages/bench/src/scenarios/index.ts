import { generateRows } from './data-generator';
import { useIoiTable } from '@ioi-dev/vue-table';
import type { ColumnDef } from '@ioi-dev/vue-table';

interface BenchmarkScenario {
  name: string;
  description: string;
  dataSize: number;
  targetMs: number;
  run: (data: any[]) => Promise<void>;
}

interface TestRow {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number;
  hireDate: string;
  active: boolean;
}

const columns: ColumnDef<TestRow>[] = [
  { id: 'id', field: 'id', header: 'ID', type: 'number' },
  { id: 'name', field: 'name', header: 'Name', type: 'text' },
  { id: 'email', field: 'email', header: 'Email', type: 'text' },
  { id: 'age', field: 'age', header: 'Age', type: 'number' },
  { id: 'department', field: 'department', header: 'Department', type: 'text' },
  { id: 'salary', field: 'salary', header: 'Salary', type: 'number' },
  { id: 'hireDate', field: 'hireDate', header: 'Hire Date', type: 'date' },
  { id: 'active', field: 'active', header: 'Active', type: 'text' },
];

export function generateTestData(count: number): TestRow[] {
  return generateRows(count);
}

export const benchmarks: BenchmarkScenario[] = [
  {
    name: 'Initial Render (1k rows)',
    description: 'Time to initialize table with 1,000 rows',
    dataSize: 1000,
    targetMs: 100,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
      });
      // Force evaluation of computed properties
      void api.visibleRows.value;
      void api.renderEntries.value;
    },
  },
  {
    name: 'Virtual Scroll (100k rows)',
    description: 'Time to compute visible rows from 100k dataset',
    dataSize: 100000,
    targetMs: 16, // 60fps target
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
        rowHeight: 40,
        viewportHeight: 600,
      });
      
      // Simulate scroll position change
      api.setViewport(50000 * 40, 600);
      void api.visibleRows.value;
      void api.renderEntries.value;
    },
  },
  {
    name: 'Sort (100k rows)',
    description: 'Time to sort 100k rows by single column',
    dataSize: 100000,
    targetMs: 200,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
      });
      
      api.toggleSort('name');
      void api.sortedIndices.value;
      void api.visibleRows.value;
    },
  },
  {
    name: 'Multi-Sort (100k rows)',
    description: 'Time to sort 100k rows by 3 columns',
    dataSize: 100000,
    targetMs: 300,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
      });
      
      api.toggleSort('department', true);
      api.toggleSort('name', true);
      api.toggleSort('age', true);
      void api.sortedIndices.value;
      void api.visibleRows.value;
    },
  },
  {
    name: 'Filter (100k rows)',
    description: 'Time to filter 100k rows with text filter',
    dataSize: 100000,
    targetMs: 150,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
      });
      
      api.setColumnFilter('name', { type: 'text', value: 'John', operator: 'contains' });
      void api.filteredIndices.value;
      void api.visibleRows.value;
    },
  },
  {
    name: 'Global Search (100k rows)',
    description: 'Time to search 100k rows globally',
    dataSize: 100000,
    targetMs: 200,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
      });
      
      api.setGlobalSearch('engineering');
      void api.filteredIndices.value;
      void api.visibleRows.value;
    },
  },
  {
    name: 'Selection Toggle (100k rows)',
    description: 'Time to toggle selection on 1000 rows',
    dataSize: 100000,
    targetMs: 50,
    run: async (data) => {
      const api = useIoiTable({
        rows: data,
        columns,
        rowKey: 'id',
        selectionMode: 'multi',
      });

      for (let i = 0; i < 1000; i++) {
        api.toggleRow(i);
      }
    },
  },
  {
    name: 'CSV Parse (10MB)',
    description: 'Time to parse 10MB CSV data',
    dataSize: 100000,
    targetMs: 3000,
    run: async (data) => {
      const api = useIoiTable({
        rows: [],
        columns,
        rowKey: 'id',
      });

      const headers = 'id,name,email,age,department,salary,hireDate,active';
      const csvRows = data.map((row: any) =>
        `${row.id},"${row.name}","${row.email}",${row.age},"${row.department}",${row.salary},"${row.hireDate}",${row.active}`
      );
      const csvString = [headers, ...csvRows].join('\n');

      await api.parseCSV(csvString, { hasHeader: true });
    },
  },
];
