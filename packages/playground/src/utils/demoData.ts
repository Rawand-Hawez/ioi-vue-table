import type { ColumnDef } from '@ioi-dev/vue-table';

export type PrimitiveCell = string | number | boolean;
export type PrimitiveRow = Record<string, PrimitiveCell>;

const TEAM_NAMES = ['Orion', 'Lyra', 'Hydra', 'Phoenix', 'Atlas', 'Nova'] as const;
const CITIES = ['Erbil', 'Sulaymaniyah', 'Duhok', 'Kirkuk', 'Baghdad', 'Basra'] as const;
const REGIONS = ['North', 'South', 'East', 'West'] as const;
const RISKS = ['Low', 'Medium', 'High'] as const;
const STATUSES = ['Queued', 'Running', 'Done', 'Blocked'] as const;

function getColumnField(index: number): string {
  return `c${String(index + 1).padStart(2, '0')}`;
}

export function createBigDataColumns(columnCount = 50): ColumnDef<PrimitiveRow>[] {
  const columns: ColumnDef<PrimitiveRow>[] = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const field = getColumnField(columnIndex);
    columns.push({
      field,
      header: field.toUpperCase(),
      width: columnIndex === 0 ? 96 : 140,
      type: columnIndex % 3 === 0 ? 'number' : 'text'
    });
  }

  return columns;
}

export function createBigDataRows(rowCount = 100_000, columnCount = 50): PrimitiveRow[] {
  const rows = new Array<PrimitiveRow>(rowCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row: PrimitiveRow = {};

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const field = getColumnField(columnIndex);

      if (columnIndex === 0) {
        row[field] = rowIndex + 1;
        continue;
      }

      if (columnIndex % 3 === 0) {
        row[field] = (rowIndex * (columnIndex + 5)) % 10_000;
      } else if (columnIndex % 3 === 1) {
        row[field] = `R${rowIndex + 1}-C${columnIndex + 1}-${(rowIndex * 17 + columnIndex * 13) % 997}`;
      } else {
        row[field] = (rowIndex + columnIndex) % 2 === 0;
      }
    }

    rows[rowIndex] = row;
  }

  return rows;
}

export interface PinnedRow {
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

export function createPinnedColumns(): ColumnDef<PinnedRow>[] {
  return [
    { id: 'id', field: 'id', header: 'ID', width: 92, pin: 'left', type: 'number' },
    { id: 'project', field: 'project', header: 'Project', width: 220, pin: 'left', type: 'text' },
    { id: 'owner', field: 'owner', header: 'Owner', width: 160, type: 'text' },
    { id: 'city', field: 'city', header: 'City', width: 160, type: 'text' },
    { id: 'budget', field: 'budget', header: 'Budget', width: 140, type: 'number' },
    { id: 'spent', field: 'spent', header: 'Spent', width: 140, type: 'number' },
    { id: 'risk', field: 'risk', header: 'Risk', width: 120, type: 'text' },
    { id: 'updatedAt', field: 'updatedAt', header: 'Updated', width: 140, type: 'text' },
    { id: 'status', field: 'status', header: 'Status', width: 120, pin: 'right', type: 'text' },
    { id: 'progress', field: 'progress', header: 'Progress %', width: 130, pin: 'right', type: 'number' }
  ];
}

export function createPinnedRows(rowCount = 1_200): PinnedRow[] {
  const rows = new Array<PinnedRow>(rowCount);

  for (let index = 0; index < rowCount; index += 1) {
    const team = TEAM_NAMES[index % TEAM_NAMES.length];
    const status = STATUSES[(index * 5) % STATUSES.length];
    const budget = 20_000 + ((index * 231) % 80_000);
    const spent = Math.round(budget * (((index * 19) % 91) / 100));

    rows[index] = {
      id: index + 1,
      project: `${team}-CON-${String((index % 900) + 100).padStart(3, '0')}`,
      owner: `${team} Team`,
      city: CITIES[(index * 7) % CITIES.length],
      budget,
      spent,
      risk: RISKS[(index * 3) % RISKS.length],
      status,
      progress: Math.min(100, Math.round((spent / budget) * 100)),
      updatedAt: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`
    };
  }

  return rows;
}

export interface OpsRow {
  id: number;
  team: string;
  city: string;
  score: number;
  active: boolean;
  tags: string[];
  meta: {
    region: string;
  };
}

export function createOpsColumns(): ColumnDef<OpsRow>[] {
  return [
    { field: 'id', header: 'ID', width: 90, type: 'number' },
    { field: 'team', header: 'Team', width: 180, type: 'text' },
    { field: 'city', header: 'City', width: 160, type: 'text' },
    { field: 'score', header: 'Score', width: 130, type: 'number' },
    { field: 'active', header: 'Active', width: 120, type: 'text' },
    { field: 'meta.region', header: 'Region', width: 140, type: 'text' },
    { field: 'tags', header: 'Tags', width: 220, type: 'text' }
  ];
}

export function createOpsRows(rowCount = 20_000): OpsRow[] {
  const rows = new Array<OpsRow>(rowCount);

  for (let index = 0; index < rowCount; index += 1) {
    const team = TEAM_NAMES[(index * 7) % TEAM_NAMES.length];
    const city = CITIES[(index * 11) % CITIES.length];

    rows[index] = {
      id: index + 1,
      team,
      city,
      score: (index * 37) % 1_000,
      active: index % 3 !== 0,
      tags: [team.toLowerCase(), `zone-${index % 5}`],
      meta: {
        region: REGIONS[(index * 13) % REGIONS.length]
      }
    };
  }

  return rows;
}
