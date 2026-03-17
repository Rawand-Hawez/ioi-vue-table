<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { ColumnDef, ExportCsvOptions, ExportCsvScope, SelectAllScope, SortState } from '@ioi-dev/vue-table';
import { usePerf } from '../composables/usePerf';
import { useTheme } from '../composables/useTheme';
import { createEmployeeColumns, createEmployees, type Employee } from '../utils/demoData';

const { activeTheme } = useTheme();
const { measure } = usePerf();

const rows = ref<Employee[]>(createEmployees(5_000));
const columns = ref<ColumnDef<Employee>[]>(createEmployeeColumns());

const scope = ref<ExportCsvScope>('visible');
const delimiter = ref<',' | ';' | '\t'>(',');
const includeHeader = ref(true);
const sanitize = ref(true);
const headerMode = ref<'header' | 'field'>('header');

const pageIndex = ref(0);
const pageSize = ref(10);
const selectedCount = ref(0);

interface TableRef {
  exportCSV: (opts: ExportCsvOptions) => string;
  selectAll: (scope?: SelectAllScope) => void;
  clearSelection: () => void;
  getSelectedKeys: () => Array<string | number>;
  setSortState: (s: SortState[]) => void;
  setPageIndex: (i: number) => void;
}
const tableRef = ref<TableRef | null>(null);

const sortStates = ref<SortState[]>([]);
function getSortDir(field: string): 'asc' | 'desc' | '' {
  return sortStates.value.find(s => s.field === field)?.direction ?? '';
}
function headerSort(field: string): void {
  const cur = getSortDir(field);
  const next: SortState[] = !cur ? [{ field, direction: 'asc' }] : cur === 'asc' ? [{ field, direction: 'desc' }] : [];
  sortStates.value = next;
  tableRef.value?.setSortState(next);
  tableRef.value?.setPageIndex(0);
}

function syncSelected(): void {
  selectedCount.value = tableRef.value?.getSelectedKeys().length ?? 0;
}

function selectSome(): void {
  tableRef.value?.selectAll('visible');
  syncSelected();
}

function clearSel(): void {
  tableRef.value?.clearSelection();
  syncSelected();
}

function doExport(): void {
  const csv = measure(`export ${scope.value}`, () =>
    tableRef.value?.exportCSV({
      scope: scope.value,
      delimiter: delimiter.value,
      includeHeader: includeHeader.value,
      sanitizeFormulas: sanitize.value,
      headerMode: headerMode.value,
    }) ?? ''
  );
  downloadCsv(csv);
}

function downloadCsv(content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `employees-${scope.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const delimiters: Array<{ value: ',' | ';' | '\t'; label: string }> = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab (\\t)' },
];

const scopes: Array<{ value: ExportCsvScope; label: string; desc: string }> = [
  { value: 'visible', label: 'Visible page', desc: 'Current page only' },
  { value: 'filtered', label: 'Filtered', desc: 'All filtered rows' },
  { value: 'selected', label: 'Selected', desc: `${selectedCount.value} rows selected` },
  { value: 'allLoaded', label: 'All rows', desc: '5,000 rows' },
];
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">CSV Export</h2>
        <p class="demo-desc">
          Export the 5,000-row employee table by scope (visible page, filtered, selected, or all).
          Configure delimiter, header mode, and formula sanitization. Timing logged automatically.
          Selected: <strong>{{ selectedCount }}</strong>
        </p>
      </div>
    </div>

    <!-- Export config panel -->
    <div class="config-panel">
      <div class="config-section">
        <div class="config-label">Export scope</div>
        <div class="scope-grid">
          <label
            v-for="s in scopes"
            :key="s.value"
            :class="['scope-card', { 'scope-card--active': scope === s.value }]"
          >
            <input v-model="scope" type="radio" :value="s.value" class="sr-only" />
            <span class="scope-card-label">{{ s.label }}</span>
            <span class="scope-card-desc">{{ s.value === 'selected' ? `${selectedCount} rows` : s.desc }}</span>
          </label>
        </div>
      </div>

      <div class="config-row">
        <div class="config-field">
          <label class="config-label">Delimiter</label>
          <select v-model="delimiter" class="config-select">
            <option v-for="d in delimiters" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>

        <div class="config-field">
          <label class="config-label">Header mode</label>
          <select v-model="headerMode" class="config-select">
            <option value="header">Use column header label</option>
            <option value="field">Use field name (key)</option>
          </select>
        </div>

        <div class="config-checks">
          <label class="check-label">
            <input v-model="includeHeader" type="checkbox" />
            Include header row
          </label>
          <label class="check-label">
            <input v-model="sanitize" type="checkbox" />
            Sanitize formulas (injection-safe)
          </label>
        </div>
      </div>

      <div class="config-actions">
        <button class="btn" @click="doExport">Download CSV</button>
        <button class="btn btn-secondary" @click="selectSome">Select Visible</button>
        <button class="btn btn-ghost" @click="clearSel">Clear Selection</button>
      </div>
    </div>

    <!-- Table -->
    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="440"
        :row-height="36"
        :overscan="6"
        v-model:pageIndex="pageIndex"
        v-model:pageSize="pageSize"
        @state-change="syncSelected"
      >
        <template #header="{ column }">
          <div class="sort-header" @click.stop="headerSort(String(column.field))">
            <span>{{ column.header ?? column.field }}</span>
            <span class="sort-icon">{{ getSortDir(String(column.field)) === 'asc' ? '↑' : getSortDir(String(column.field)) === 'desc' ? '↓' : '' }}</span>
          </div>
        </template>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="pagination-bar">
      <div class="page-info">
        Page {{ pageIndex + 1 }} &nbsp;|&nbsp;
        <select
          :value="pageSize"
          class="page-size-select"
          @change="pageSize = Number(($event.target as HTMLSelectElement).value); pageIndex = 0"
        >
          <option v-for="n in [10, 25, 50, 100]" :key="n" :value="n">{{ n }} / page</option>
        </select>
      </div>
      <div class="page-btns">
        <button class="page-btn" :disabled="pageIndex === 0" @click="pageIndex--">&larr;</button>
        <button class="page-btn" @click="pageIndex++">&rarr;</button>
      </div>
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>const tableRef = ref(null)

// Sort — click column headers to cycle asc → desc → clear
tableRef.value.setSortState([{ field: 'name', direction: 'asc' }])
tableRef.value.setSortState([])  // clear

// Export by scope
const csv = tableRef.value.exportCSV({ scope: 'visible' })    // current page
const csv = tableRef.value.exportCSV({ scope: 'filtered' })   // all filtered rows
const csv = tableRef.value.exportCSV({ scope: 'selected' })   // selected rows only
const csv = tableRef.value.exportCSV({ scope: 'allLoaded' })  // all rows

// Full options
const csv = tableRef.value.exportCSV({
  scope: 'filtered',
  delimiter: ';',            // ',' | ';' | '\t'  (default: ',')
  includeHeader: true,       // include header row  (default: true)
  sanitizeFormulas: true,    // escape = + - @ to prevent CSV injection
  headerMode: 'header',      // 'header' = use column label, 'field' = use field key
})

// Trigger download
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
const url  = URL.createObjectURL(blob)
const a    = Object.assign(document.createElement('a'), { href: url, download: 'export.csv' })
a.click()
URL.revokeObjectURL(url)</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 65ch; }

.config-panel {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 1rem 1.25rem; display: grid; gap: 1rem;
}

.config-section { display: grid; gap: 0.5rem; }
.config-label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }

.scope-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.scope-card {
  flex: 1; min-width: 120px; max-width: 180px;
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.8rem;
  cursor: pointer; transition: all 120ms; display: grid; gap: 0.2rem;
}
.scope-card:hover { border-color: #93c5fd; background: #eff6ff; }
.scope-card--active { border-color: #0f5bd4; background: #eff6ff; box-shadow: 0 0 0 3px rgba(15,91,212,0.1); }
.scope-card-label { font-size: 0.82rem; font-weight: 600; color: #0f172a; }
.scope-card-desc { font-size: 0.72rem; color: #94a3b8; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

.config-row { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
.config-field { display: grid; gap: 0.35rem; }
.config-select { border: 1px solid #cbd5e1; border-radius: 7px; padding: 0.32rem 0.6rem; font-size: 0.8rem; outline: none; cursor: pointer; }

.config-checks { display: flex; flex-direction: column; gap: 0.45rem; padding-bottom: 0.1rem; }
.check-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #475569; cursor: pointer; }

.config-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 0.85rem; }


.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 0.45rem 0.85rem; font-size: 0.8rem; color: #475569;
}
.page-info { display: flex; align-items: center; gap: 0.5rem; }
.page-size-select { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.15rem 0.35rem; font-size: 0.78rem; }
.page-btns { display: flex; gap: 0.35rem; }
.page-btn {
  border: 1px solid #e2e8f0; background: #fff; border-radius: 6px;
  padding: 0.25rem 0.65rem; font-size: 0.8rem; cursor: pointer;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
