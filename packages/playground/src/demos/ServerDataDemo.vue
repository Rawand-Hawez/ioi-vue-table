<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';
import type { ServerFetchParams, ServerFetchResult, ColumnDef } from '@ioi-dev/vue-table';

const { activeTheme } = useTheme();

interface Row { id: number; name: string; email: string; status: string }

const columns: ColumnDef<Row>[] = [
  { field: 'id', header: 'ID', width: 80, type: 'number' as const },
  { field: 'name', header: 'Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'status', header: 'Status', width: 120 }
];

const pageIndex = ref(0);
const pageSize = ref(10);
const requestCount = ref(0);

function mockFetch(params: ServerFetchParams): Promise<ServerFetchResult<Row>> {
  requestCount.value++;

  return new Promise((resolve) => {
    setTimeout(() => {
      const allRows: Row[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Inactive' : 'Pending'
      }));

      let filtered = allRows;
      if (params.globalSearch) {
        const q = params.globalSearch.toLowerCase();
        filtered = filtered.filter(
          (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
        );
      }

      if (params.sort.length > 0) {
        const s = params.sort[0];
        filtered = [...filtered].sort((a, b) => {
          const av = String(a[s.field as keyof Row]);
          const bv = String(b[s.field as keyof Row]);
          return s.direction === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
        });
      }

      const start = params.pageIndex * params.pageSize;
      const rows = filtered.slice(start, start + params.pageSize);

      resolve({ rows, totalRows: filtered.length });
    }, 600);
  });
}

const serverOptions = reactive({
  fetch: mockFetch
});

interface TableRef { refresh: () => void }
const tableRef = ref<TableRef | null>(null);

function refresh() {
  requestCount.value = 0;
  tableRef.value?.refresh();
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Server-Side Mode <span class="new-badge">v0.3.0</span></h2>
        <p class="demo-desc">
          Offload sorting, filtering, and pagination to your API.
          Requests: <strong class="text-purple-600">{{ requestCount }}</strong>
        </p>
      </div>
      <div class="controls">
        <button class="btn btn-secondary" @click="refresh">
          Refresh Data
        </button>
      </div>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :columns="(columns as any)"
        data-mode="server"
        :server-options="(serverOptions as any)"
        row-key="id"
        :height="400"
        :row-height="34"
        v-model:pageIndex="pageIndex"
        v-model:pageSize="pageSize"
        :show-pagination="true"
        :page-size-options="[10, 25, 50]"
      >
        <template #loading>
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Fetching from remote...</span>
          </div>
        </template>
      </Table>
    </div>

    <section class="code-section">
      <h3>Implementation</h3>
      <pre v-pre class="code-block"><code>&lt;Table
  data-mode="server"
  :server-options="{
    fetch: async (params) => {
      // params.pageIndex, params.pageSize
      // params.sort, params.filters, params.globalSearch

      const res = await api.get('/users', { params })
      return {
        rows: res.data,
        totalRows: res.total
      }
    }
  }"
/&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 60ch; }

.new-badge {
  font-size: 0.6rem; font-weight: 700;
  background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe;
  border-radius: 20px; padding: 0.1rem 0.4rem;
}

.controls { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }

.loading-overlay {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.75rem; font-size: 0.85rem; color: #64748b;
  background: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 24px; height: 24px;
  border: 2.5px solid #e2e8f0; border-top-color: #0f5bd4;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
