<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';

const { activeTheme } = useTheme();

const columns = [
  { field: 'id', header: 'ID', width: 80, type: 'number' },
  { field: 'name', header: 'Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'role', header: 'Role', width: 140 },
  { field: 'status', header: 'Status', width: 120 }
];

const roles = ['Admin', 'Editor', 'Viewer', 'Moderator'];
const statuses = ['Active', 'Inactive', 'Pending'];

const rows = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: roles[i % roles.length],
  status: statuses[i % statuses.length]
}));

const pageIndex = ref(0);
const pageSize = ref(10);
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Pagination <span class="new-badge">v0.3.0</span></h2>
        <p class="demo-desc">
          Built-in pagination with page size selector, navigation buttons, and a replacement slot.
        </p>
      </div>
    </div>

    <div class="toolbar">
      <div class="ctrl-group">
        <label class="ctrl-label">Page size</label>
        <select :value="pageSize" class="ctrl-input" style="width:90px" @change="pageSize = Number(($event.target as HTMLSelectElement).value); pageIndex = 0">
          <option v-for="n in [5, 10, 25]" :key="n" :value="n">{{ n }} rows</option>
        </select>
      </div>
      <span class="ctrl-label">Page {{ pageIndex + 1 }}</span>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        :columns="columns"
        :rows="rows"
        row-key="id"
        :height="400"
        :row-height="36"
        v-model:pageIndex="pageIndex"
        v-model:pageSize="pageSize"
        :show-pagination="true"
        :page-size-options="[5, 10, 25]"
      />
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>&lt;Table
  :columns="columns"
  :rows="rows"
  row-key="id"

  v-model:pageIndex="page"
  v-model:pageSize="size"
  :show-pagination="true"
  :page-size-options="[5, 10, 25]"
/&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 60ch; }

.new-badge {
  font-size: 0.6rem; font-weight: 700;
  background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe;
  border-radius: 20px; padding: 0.1rem 0.4rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.7rem 1rem;
}
.ctrl-group { display: flex; align-items: center; gap: 0.35rem; }
</style>
