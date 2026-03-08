import type { ColumnDef } from '@ioi-dev/vue-table';

// ============================================================
// Employee data — Sort/Filter, CSV Export, Editing demos
// ============================================================

const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hana', 'Ivan', 'Julia',
  'Kevin', 'Laura', 'Mike', 'Nina', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tina',
  'Umar', 'Vera', 'Will', 'Xara', 'Yusuf', 'Zoe', 'Aaron', 'Beth', 'Carl', 'Dana'];
const LAST_NAMES = ['Chen', 'Smith', 'Patel', 'Garcia', 'Kim', 'Johnson', 'Hawez', 'Nguyen', 'Brown',
  'Williams', 'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'DevOps', 'Data'];
const ROLES = ['Manager', 'Senior Engineer', 'Engineer', 'Lead', 'Principal', 'Intern', 'Director', 'Analyst', 'Architect', 'Specialist'];
const EMP_STATUSES = ['Active', 'Remote', 'On Leave'] as const;

export type EmployeeStatus = typeof EMP_STATUSES[number];

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  status: EmployeeStatus;
  performance: number;
}

export function createEmployees(count = 5_000): Employee[] {
  const rows = new Array<Employee>(count);
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const dept = DEPARTMENTS[(i * 3) % DEPARTMENTS.length];
    const role = ROLES[(i * 5) % ROLES.length];
    const salary = 40_000 + ((i * 1_973) % 120_000);
    const year = 2018 + (i % 7);
    const month = (i % 12) + 1;
    const day = (i % 28) + 1;
    rows[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i > 0 ? i : ''}@company.io`,
      department: dept,
      role,
      salary,
      startDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      status: EMP_STATUSES[(i * 11) % EMP_STATUSES.length],
      performance: 40 + ((i * 37) % 61),
    };
  }
  return rows;
}

export function createEmployeeColumns(): ColumnDef<Employee>[] {
  return [
    { id: 'id', field: 'id', header: 'ID', type: 'number', width: 72, pin: 'left' },
    { id: 'name', field: 'name', header: 'Name', type: 'text', width: 200, headerFilter: 'text' },
    { id: 'email', field: 'email', header: 'Email', type: 'text', width: 260 },
    { id: 'department', field: 'department', header: 'Department', type: 'text', width: 150, headerFilter: 'select' },
    { id: 'role', field: 'role', header: 'Role', type: 'text', width: 180, headerFilter: 'select' },
    { id: 'salary', field: 'salary', header: 'Salary ($)', type: 'number', width: 130 },
    { id: 'startDate', field: 'startDate', header: 'Start Date', type: 'date', width: 130 },
    { id: 'status', field: 'status', header: 'Status', type: 'text', width: 120, headerFilter: 'select' },
    { id: 'performance', field: 'performance', header: 'Score', type: 'number', width: 100 },
  ];
}

// ============================================================
// Sales data — Row Grouping demo
// ============================================================

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Latin America'];
const CATEGORIES = ['Software', 'Hardware', 'Services', 'Support', 'Training'];
const REPS = ['Alice Chen', 'Bob Smith', 'Carol Patel', 'David Kim', 'Eva Garcia',
  'Frank Johnson', 'Grace Lee', 'Hana Nguyen', 'Ivan Brown', 'Julia Wilson'];
const PRODUCTS = ['ProSuite', 'DataGrid', 'CloudPack', 'SupportHub', 'DevKit', 'AnalyticsPro', 'SecureVault', 'FlowEngine'];
const SALE_STATUSES = ['Won', 'Lost', 'Pending'] as const;

export type SaleStatus = typeof SALE_STATUSES[number];

export interface SaleRow {
  id: number;
  rep: string;
  region: string;
  category: string;
  product: string;
  amount: number;
  units: number;
  month: string;
  status: SaleStatus;
}

export function createSalesData(count = 2_000): SaleRow[] {
  const rows = new Array<SaleRow>(count);
  for (let i = 0; i < count; i++) {
    const month = 1 + (i % 12);
    rows[i] = {
      id: i + 1,
      rep: REPS[(i * 7) % REPS.length],
      region: REGIONS[(i * 3) % REGIONS.length],
      category: CATEGORIES[(i * 5) % CATEGORIES.length],
      product: PRODUCTS[(i * 11) % PRODUCTS.length],
      amount: 5_000 + ((i * 2_371) % 95_000),
      units: 1 + ((i * 13) % 50),
      month: `2025-${String(month).padStart(2, '0')}`,
      status: SALE_STATUSES[(i * 7) % SALE_STATUSES.length],
    };
  }
  return rows;
}

export function createSalesColumns(): ColumnDef<SaleRow>[] {
  return [
    { id: 'id', field: 'id', header: 'ID', type: 'number', width: 72 },
    { id: 'rep', field: 'rep', header: 'Rep', type: 'text', width: 160 },
    { id: 'region', field: 'region', header: 'Region', type: 'text', width: 160, headerFilter: 'select' },
    { id: 'category', field: 'category', header: 'Category', type: 'text', width: 130, headerFilter: 'select' },
    { id: 'product', field: 'product', header: 'Product', type: 'text', width: 140 },
    { id: 'amount', field: 'amount', header: 'Amount ($)', type: 'number', width: 130 },
    { id: 'units', field: 'units', header: 'Units', type: 'number', width: 90 },
    { id: 'month', field: 'month', header: 'Month', type: 'text', width: 110 },
    { id: 'status', field: 'status', header: 'Status', type: 'text', width: 110, headerFilter: 'select' },
  ];
}

// ============================================================
// Product data — Custom Cells demo
// ============================================================

const PRODUCT_NAMES = ['Orion Suite', 'Lyra Grid', 'Nova Dashboard', 'Atlas CRM', 'Hydra Flow',
  'Phoenix AI', 'Stellar DB', 'Comet Analytics', 'Quasar UI', 'Pulsar API',
  'Nebula Chat', 'Eclipse BI', 'Aurora Forms', 'Horizon Maps', 'Zenith Search'];
const PRODUCT_CATS = ['Analytics', 'CRM', 'DevTools', 'Infrastructure', 'AI', 'UI'];
const TRENDS = ['up', 'down', 'flat'] as const;
const BADGES = ['New', 'Sale', 'Hot', null] as const;

export type TrendDirection = typeof TRENDS[number];
export type ProductBadge = typeof BADGES[number];

export interface ProductRow {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  trend: TrendDirection;
  badge: ProductBadge;
  sales30d: number;
}

export function createProducts(count = 300): ProductRow[] {
  const rows = new Array<ProductRow>(count);
  for (let i = 0; i < count; i++) {
    const base = PRODUCT_NAMES[i % PRODUCT_NAMES.length];
    const suffix = i >= PRODUCT_NAMES.length ? ` v${Math.floor(i / PRODUCT_NAMES.length) + 1}` : '';
    rows[i] = {
      id: i + 1,
      name: `${base}${suffix}`,
      sku: `SKU-${String(1000 + i).padStart(5, '0')}`,
      category: PRODUCT_CATS[(i * 3) % PRODUCT_CATS.length],
      price: Math.round((9.99 + ((i * 17.37) % 490)) * 100) / 100,
      stock: (i * 13) % 500,
      rating: Math.round((2.5 + ((i * 7) % 25) / 10) * 10) / 10,
      trend: TRENDS[(i * 5) % TRENDS.length],
      badge: BADGES[(i * 3) % BADGES.length],
      sales30d: (i * 23) % 1000,
    };
  }
  return rows;
}

// ============================================================
// Team members — Inline Editing demo
// ============================================================

const TEAMS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  hourlyRate: number;
  status: 'Active' | 'Inactive';
}

export function createTeamMembers(count = 80): TeamMember[] {
  const rows = new Array<TeamMember>(count);
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 5) % LAST_NAMES.length];
    rows[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}@team.io`,
      role: ROLES[(i * 3) % ROLES.length],
      team: TEAMS[(i * 7) % TEAMS.length],
      hourlyRate: 45 + ((i * 11) % 105),
      status: i % 7 === 0 ? 'Inactive' : 'Active',
    };
  }
  return rows;
}

// ============================================================
// Big Data — Virtual Scroll demo
// ============================================================

export type BigDataRow = Record<string, string | number | boolean>;

function getBigField(index: number): string {
  return `c${String(index + 1).padStart(2, '0')}`;
}

export function createBigDataColumns(columnCount = 50): ColumnDef<BigDataRow>[] {
  const columns: ColumnDef<BigDataRow>[] = [];
  for (let ci = 0; ci < columnCount; ci++) {
    columns.push({
      field: getBigField(ci),
      header: getBigField(ci).toUpperCase(),
      width: ci === 0 ? 90 : 130,
      type: ci % 3 === 0 ? 'number' : 'text',
      // text columns → text filter; boolean columns (ci%3===2) → select filter
      headerFilter: ci % 3 === 1 && ci < 9 ? 'text'
        : ci % 3 === 2 && ci < 9 ? 'select'
        : undefined,
    });
  }
  return columns;
}

export function createBigDataRows(rowCount = 100_000, columnCount = 50): BigDataRow[] {
  const rows = new Array<BigDataRow>(rowCount);
  for (let ri = 0; ri < rowCount; ri++) {
    const row: BigDataRow = {};
    for (let ci = 0; ci < columnCount; ci++) {
      const field = getBigField(ci);
      if (ci === 0) {
        row[field] = ri + 1;
      } else if (ci % 3 === 0) {
        row[field] = (ri * (ci + 5)) % 10_000;
      } else if (ci % 3 === 1) {
        row[field] = `R${ri + 1}-C${ci + 1}-${(ri * 17 + ci * 13) % 997}`;
      } else {
        row[field] = (ri + ci) % 2 === 0;
      }
    }
    rows[ri] = row;
  }
  return rows;
}

// ============================================================
// Project data — Column Control demo
// ============================================================

const PROJ_STATUSES = ['Queued', 'Running', 'Done', 'Blocked'] as const;
const RISKS = ['Low', 'Medium', 'High'] as const;
const CITIES = ['Erbil', 'Sulaymaniyah', 'Duhok', 'Kirkuk', 'Baghdad', 'Berlin', 'London', 'Dubai'];
const TEAM_NAMES = ['Orion', 'Lyra', 'Hydra', 'Phoenix', 'Atlas', 'Nova'];

export interface ProjectRow {
  id: number;
  project: string;
  owner: string;
  city: string;
  budget: number;
  spent: number;
  risk: string;
  status: string;
  progress: number;
  updatedAt: string;
}

export function createProjects(count = 1_200): ProjectRow[] {
  const rows = new Array<ProjectRow>(count);
  for (let i = 0; i < count; i++) {
    const team = TEAM_NAMES[i % TEAM_NAMES.length];
    const budget = 20_000 + ((i * 231) % 80_000);
    const spent = Math.round(budget * (((i * 19) % 91) / 100));
    rows[i] = {
      id: i + 1,
      project: `${team}-PRJ-${String((i % 900) + 100).padStart(3, '0')}`,
      owner: `${team} Team`,
      city: CITIES[(i * 7) % CITIES.length],
      budget,
      spent,
      risk: RISKS[(i * 3) % RISKS.length],
      status: PROJ_STATUSES[(i * 5) % PROJ_STATUSES.length],
      progress: Math.min(100, Math.round((spent / budget) * 100)),
      updatedAt: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    };
  }
  return rows;
}

export function createProjectColumns(): ColumnDef<ProjectRow>[] {
  return [
    { id: 'id', field: 'id', header: 'ID', width: 80, pin: 'left', type: 'number' },
    { id: 'project', field: 'project', header: 'Project', width: 200, pin: 'left', type: 'text' },
    { id: 'owner', field: 'owner', header: 'Owner', width: 140, type: 'text' },
    { id: 'city', field: 'city', header: 'City', width: 130, type: 'text' },
    { id: 'budget', field: 'budget', header: 'Budget ($)', width: 130, type: 'number' },
    { id: 'spent', field: 'spent', header: 'Spent ($)', width: 130, type: 'number' },
    { id: 'risk', field: 'risk', header: 'Risk', width: 110, type: 'text' },
    { id: 'updatedAt', field: 'updatedAt', header: 'Updated', width: 130, type: 'text' },
    { id: 'status', field: 'status', header: 'Status', width: 110, pin: 'right', type: 'text' },
    { id: 'progress', field: 'progress', header: 'Progress %', width: 120, pin: 'right', type: 'number' },
  ];
}
