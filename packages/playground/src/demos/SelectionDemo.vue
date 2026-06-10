<template>
  <div class="demo-section">
    <h3>Selection</h3>
    <p>Single and multi-row selection with <code>v-model:selectedRowKeys</code>.</p>

    <div class="demo-controls">
      <label>Mode:</label>
      <select v-model="selectionMode">
        <option value="single">Single</option>
        <option value="multi">Multi</option>
      </select>
      <button @click="selectedKeys = []">Clear</button>
      <span class="demo-info">{{ selectedKeys.length }} selected</span>
    </div>

    <IoiTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :selection-mode="selectionMode"
      v-model:selected-row-keys="selectedKeys"
      @selection-change="onSelectionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IoiTable from '@ioi-dev/vue-table';

const columns = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' },
  { field: 'status', header: 'Status' }
];

const rows = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: ['Active', 'Inactive', 'Pending'][i % 3]
}));

const selectionMode = ref<'single' | 'multi'>('multi');
const selectedKeys = ref<Array<string | number>>([]);

function onSelectionChange(payload: { selectedRowKeys: Array<string | number>; reason: string }) {
  console.log('Selection changed:', payload.reason, payload.selectedRowKeys);
}
</script>

<style scoped>
.demo-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}
.demo-controls select,
.demo-controls button {
  padding: 0.3rem 0.6rem;
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
.demo-info {
  color: #666;
  font-size: 0.85em;
}
</style>
