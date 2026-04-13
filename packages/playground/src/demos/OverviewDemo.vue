<script setup lang="ts">
import { ref } from 'vue';
import { Table, type ColumnDef } from '@ioi-dev/vue-table';
import type { SortState } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';

const { activeTheme } = useTheme();

const copied = ref(false);

interface TableRef { setSortState: (s: SortState[]) => void; }
const quickTableRef = ref<TableRef | null>(null);
const sortStates = ref<SortState[]>([]);
function getSortDir(field: string): 'asc' | 'desc' | '' {
  return sortStates.value.find(s => s.field === field)?.direction ?? '';
}
function headerSort(field: string): void {
  const cur = getSortDir(field);
  const next: SortState[] = !cur ? [{ field, direction: 'asc' }] : cur === 'asc' ? [{ field, direction: 'desc' }] : [];
  sortStates.value = next;
  quickTableRef.value?.setSortState(next);
}

const installCmd = 'npm install @ioi-dev/vue-table';

function copyInstall(): void {
  navigator.clipboard.writeText(installCmd).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

const quickStartCode = `<script setup>
import { Table } from '@ioi-dev/vue-table'

const columns = [
  { field: 'id',     header: 'ID',         type: 'number', width: 72  },
  { field: 'name',   header: 'Name',        type: 'text'               },
  { field: 'role',   header: 'Role',        type: 'text'               },
  { field: 'status', header: 'Status',      type: 'text',  width: 110  },
]

const rows = [
  { id: 1, name: 'Alice Chen',   role: 'Engineering Lead',  status: 'Active' },
  { id: 2, name: 'Bob Smith',    role: 'Product Manager',   status: 'Remote' },
  { id: 3, name: 'Carol Patel',  role: 'Senior Engineer',   status: 'Active' },
  { id: 4, name: 'David Kim',    role: 'Design Lead',       status: 'On Leave' },
  { id: 5, name: 'Eva Garcia',   role: 'Data Analyst',      status: 'Active' },
]
${'</'}script>

<template>
  <Table :rows="rows" :columns="columns" row-key="id" :height="280" />
</template>`;

interface QuickRow { id: number; name: string; role: string; status: string; [key: string]: unknown }

const quickColumns: ColumnDef<QuickRow>[] = [
  { field: 'id',     header: 'ID',     type: 'number', width: 72  },
  { field: 'name',   header: 'Name',   type: 'text',   width: 180 },
  { field: 'role',   header: 'Role',   type: 'text',   width: 200 },
  { field: 'status', header: 'Status', type: 'text',   width: 110 },
];

const quickRows: QuickRow[] = [
  { id: 1, name: 'Alice Chen',  role: 'Engineering Lead', status: 'Active'   },
  { id: 2, name: 'Bob Smith',   role: 'Product Manager',  status: 'Remote'   },
  { id: 3, name: 'Carol Patel', role: 'Senior Engineer',  status: 'Active'   },
  { id: 4, name: 'David Kim',   role: 'Design Lead',      status: 'On Leave' },
  { id: 5, name: 'Eva Garcia',  role: 'Data Analyst',     status: 'Active'   },
];

const features = [
  { icon: '⚡', title: 'Virtual Scroll', desc: 'Render 1M+ rows at 60fps with windowed virtualization.' },
  { icon: '🔍', title: 'Sort & Filter', desc: 'Multi-column sort, text/select/number/date filters, global search.' },
  { icon: '📌', title: 'Column Pinning', desc: 'Left and right pinned partitions with drag-reorder and resize.' },
  { icon: '🗂', title: 'Row Grouping', desc: 'Group by any field with sum/avg/count/min/max aggregations. New in v0.2.' },
  { icon: '🖊', title: 'Inline Editing', desc: 'Click-to-edit cells with per-column validation support.' },
  { icon: '📄', title: 'CSV Export', desc: 'Export all, filtered, or selected rows. Formula-injection safe.' },
  { icon: '🌐', title: 'Server-Side Mode', desc: 'Plug in your own fetch function; the table handles paging & state. New in v0.2.' },
  { icon: '🎨', title: 'Unstyled Export', desc: 'Import from /unstyled and apply Tailwind, Bootstrap, or any CSS.' },
];
</script>

<template>
  <div class="overview">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-kicker">Performance-first Vue 3 data table</div>
        <h1 class="hero-title">IOI Vue Table</h1>
        <p class="hero-sub">
          A lightweight, headless-capable table with virtual scrolling, rich filtering,
          row grouping, CSV export and server-side mode — all in a small, composable API.
        </p>
        <div class="hero-actions">
          <div class="install-bar">
            <span class="install-prompt">$</span>
            <code class="install-cmd">{{ installCmd }}</code>
            <button class="install-copy" @click="copyInstall">
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <a
            class="hero-link"
            href="https://github.com/Rawand-Hawez/ioi-vue-table"
            target="_blank"
            rel="noopener"
          >GitHub</a>
        </div>
      </div>

      <div class="hero-stats">
        <div class="stat"><strong>0.2.5</strong><span>Latest</span></div>
        <div class="stat"><strong>0</strong><span>Runtime deps</span></div>
        <div class="stat"><strong>TS</strong><span>TypeScript-first</span></div>
        <div class="stat"><strong>Vue 3</strong><span>Composition API</span></div>
      </div>
    </section>

    <!-- Feature grid -->
    <section class="features">
      <h2 class="section-title">What's included</h2>
      <div class="feature-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon">{{ f.icon }}</div>
          <div>
            <div class="feature-title">{{ f.title }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick start -->
    <section class="quickstart">
      <h2 class="section-title">Quick Start</h2>
      <div class="qs-layout">
        <!-- Code snippet -->
        <div class="code-block">
          <div class="code-header">
            <span>App.vue</span>
          </div>
          <pre class="code-body">{{ quickStartCode }}</pre>
        </div>

        <!-- Live result -->
        <div class="qs-result">
          <div class="qs-result-label">Live result ↓</div>
          <div :class="`theme-${activeTheme}`">
            <Table
              ref="quickTableRef"
              :rows="quickRows"
              :columns="quickColumns"
              row-key="id"
              :height="240"
              :row-height="36"
            >
              <template #header="{ column }">
                <div class="sort-header" @click.stop="headerSort(String(column.field))">
                  <span>{{ column.header ?? column.field }}</span>
                  <span class="sort-icon">{{ getSortDir(String(column.field)) === 'asc' ? '↑' : getSortDir(String(column.field)) === 'desc' ? '↓' : '' }}</span>
                </div>
              </template>
            </Table>
          </div>
        </div>
      </div>
    </section>

    <section class="quickstart">
      <h2 class="section-title">Key Props</h2>
      <pre v-pre class="code-block"><code>&lt;Table
  :rows="rows"                   // required — array of row objects
  :columns="columns"             // required — ColumnDef[]
  row-key="id"                   // required — unique row identifier field

  :height="400"                  // px — enables virtual scrolling
  :row-height="36"               // px — fixed row height for virtual window
  :overscan="6"                  // extra rows rendered beyond viewport edges

  group-by="region"              // field name to group rows by
  :group-aggregations="{ ... }"  // { field: AggregationType[] }
  v-model:expandedGroupKeys="keys"

  v-model:pageIndex="page"       // controlled pagination
  v-model:pageSize="size"

  row-key-field="id"
  :row-class="getRowClass"       // string | object | (row, i) =&gt; string | object

  @cell-commit="onCommit"        // fired when an inline edit is committed
  @state-change="onStateChange"  // fired on sort/filter/page/selection change
/&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.overview { display: grid; gap: 2.5rem; }

/* ── Hero ── */
.hero {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f8faff 100%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
  padding: 2.5rem;
  display: grid;
  gap: 2rem;
}

.hero-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #0f5bd4;
  margin-bottom: 0.5rem;
}

.hero-title {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.hero-sub {
  margin: 0 0 1.5rem;
  max-width: 60ch;
  color: #475569;
  line-height: 1.65;
  font-size: 1rem;
}

.hero-actions { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }

.install-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0f172a;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
}

.install-prompt { color: #64748b; font-family: monospace; font-size: 0.85rem; }

.install-cmd {
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.85rem;
  color: #e2e8f0;
  background: transparent;
  padding: 0;
}

.install-copy {
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 120ms;
}
.install-copy:hover { background: #1e293b; color: #e2e8f0; }

.hero-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f5bd4;
  text-decoration: none;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  transition: all 120ms;
}
.hero-link:hover { background: #eff6ff; }

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-top: 1px solid #dbeafe;
  padding-top: 1.5rem;
}

.stat {
  flex: 1;
  min-width: 100px;
  display: grid;
  gap: 0.2rem;
  padding: 0 1.5rem 0 0;
}
.stat strong { font-size: 1.4rem; font-weight: 800; color: #0f172a; }
.stat span { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Features ── */
.features { display: grid; gap: 1rem; }
.section-title {
  margin: 0 0 1rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.feature-card {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  transition: border-color 120ms, box-shadow 120ms;
}
.feature-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 12px rgba(15, 91, 212, 0.08);
}

.feature-icon { font-size: 1.3rem; flex-shrink: 0; }
.feature-title { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; color: #0f172a; }
.feature-desc { font-size: 0.78rem; color: #64748b; line-height: 1.5; }

/* ── Quick Start ── */
.quickstart { display: grid; gap: 1rem; }

.qs-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

.code-block {
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
  font-size: 0.78rem;
}

.code-header {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #1e293b;
  color: #94a3b8;
  font-size: 0.72rem;
  font-family: monospace;
  border-bottom: 1px solid #334155;
}

.code-body {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  color: #e2e8f0;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre;
}

.qs-result { display: grid; gap: 0.6rem; }
.qs-result-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

@media (max-width: 800px) {
  .qs-layout { grid-template-columns: 1fr; }
  .hero { padding: 1.5rem; }
}
</style>
