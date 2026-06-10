<script setup lang="ts">
import { ref, watch } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';

const { activeTheme } = useTheme();

const columns = [
  { field: 'id', header: 'ID', width: 80, type: 'number' as const },
  { field: 'name', header: 'Name', width: 200 },
  { field: 'status', header: 'Status', width: 120 }
];

const rows = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: ['Active', 'Inactive', 'Pending'][i % 3]
}));

const selectionMode = ref<'single' | 'multi'>('multi');
const selectedKeys = ref<Array<string | number>>([]);

watch(selectionMode, () => { selectedKeys.value = []; });
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Selection <span class="new-badge">v0.3.0</span></h2>
        <p class="demo-desc">
          Single and multi-row selection with <code>v-model:selectedRowKeys</code>.
          <strong class="text-blue-600">{{ selectedKeys.length }}</strong> selected.
        </p>
      </div>
      <div class="controls">
        <div class="segment">
          <button :class="['seg-btn', { 'seg-btn--active': selectionMode === 'single' }]" @click="selectionMode = 'single'">Single</button>
          <button :class="['seg-btn', { 'seg-btn--active': selectionMode === 'multi' }]" @click="selectionMode = 'multi'">Multi</button>
        </div>
        <button class="pg-btn pg-btn-ghost" @click="selectedKeys = []">Clear Selection</button>
      </div>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        v-model:selected-row-keys="selectedKeys"
        :columns="columns"
        :rows="rows"
        row-key="id"
        :selection-mode="selectionMode"
        :height="400"
        :row-height="36"
        :overscan="4"
      />
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>&lt;Table
  :columns="columns"
  :rows="rows"
  row-key="id"
  selection-mode="multi"
  v-model:selected-row-keys="selectedKeys"
  @selection-change="onChange"
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
</style>
