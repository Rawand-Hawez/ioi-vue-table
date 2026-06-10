<template>
  <div class="demo-section">
    <h3>Pagination</h3>
    <p>Built-in pagination with page size selector and navigation buttons.</p>

    <div class="demo-controls">
      <label>
        Page size:
        <select v-model="pageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
        </select>
      </label>
      <label>
        <input type="checkbox" v-model="showPagination" /> Show pagination
      </label>
    </div>

    <IoiTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :page-size="pageSize"
      :show-pagination="showPagination"
      :page-size-options="[5, 10, 25]"
      @pagination-change="onPageChange"
    />

    <p v-if="lastPage" class="demo-info">Current page: {{ lastPage.pageIndex + 1 }} / {{ lastPage.pageCount }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi-dev/vue-table';

const columns = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' }
];

const rows = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`
}));

const pageSize = ref(10);
const showPagination = ref(true);
const lastPage = ref<{ pageIndex: number; pageCount: number } | null>(null);

function onPageChange(payload: { pageIndex: number; pageCount: number }) {
  lastPage.value = payload;
}
</script>

<style scoped>
.demo-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}
.demo-controls select {
  padding: 0.3rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.demo-info {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.85em;
}
</style>
