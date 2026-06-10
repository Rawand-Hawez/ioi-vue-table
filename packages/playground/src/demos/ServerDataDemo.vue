<template>
  <div class="demo-section">
    <h3>Server-Side Data</h3>
    <p>Table fetches data from a mock API using <code>serverOptions.fetch</code>.</p>

    <div class="demo-controls">
      <button @click="refresh">Refresh</button>
      <label>
        Page size:
        <select v-model.number="pageSize" @change="refresh">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </label>
    </div>

    <IoiTable
      :columns="columns"
      :data-mode="'server'"
      :server-options="serverOptions"
      :row-key="'id'"
      :page-size="pageSize"
      :show-pagination="true"
      :page-size-options="[10, 25, 50]"
      @pagination-change="onPaginationChange"
    />

    <div v-if="lastError" class="demo-error">Error: {{ lastError }}</div>
    <div v-if="requestCount > 0" class="demo-info">Requests made: {{ requestCount }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import IoiTable from '@ioi-dev/vue-table';
import type { ServerFetchParams, ServerFetchResult, ColumnDef } from '@ioi-dev/vue-table';

interface Row { id: number; name: string; email: string; status: string }

const columns: ColumnDef<Row>[] = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
  { field: 'status', header: 'Status' }
];

const pageSize = ref(10);
const lastError = ref('');
const requestCount = ref(0);
const currentPageIndex = ref(0);

function mockFetch(params: ServerFetchParams): Promise<ServerFetchResult<Row>> {
  requestCount.value++;
  lastError.value = '';

  return new Promise((resolve) => {
    setTimeout(() => {
      const allRows: Row[] = Array.from({ length: 200 }, (_, i) => ({
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
    }, 300);
  });
}

const serverOptions = reactive({
  fetch: mockFetch
});

function refresh() {
  requestCount.value = 0;
}

function onPaginationChange(payload: { pageIndex: number }) {
  currentPageIndex.value = payload.pageIndex;
}
</script>

<style scoped>
.demo-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}
.demo-controls button,
.demo-controls select {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font: inherit;
}
.demo-controls button {
  cursor: pointer;
  background: #f5f5f5;
}
.demo-controls button:hover {
  background: #e0e0e0;
}
.demo-error {
  margin-top: 1rem;
  color: #d32f2f;
}
.demo-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.85em;
}
</style>
