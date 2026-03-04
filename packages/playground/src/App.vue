<script setup lang="ts">
import { ref } from 'vue';
import { IoiTable } from '@ioi/vue-table';
import type { ColumnDef } from '@ioi/vue-table';

interface DemoRow {
  id: number;
  team: string;
  score: number;
}

const columns = ref<ColumnDef<DemoRow>[]>([
  { field: 'id', header: 'ID', width: 80 },
  { field: 'team', header: 'Team' },
  { field: 'score', header: 'Score' }
]);

const rows = ref<DemoRow[]>([
  { id: 1, team: 'Orion', score: 78 },
  { id: 2, team: 'Lyra', score: 83 },
  { id: 3, team: 'Hydra', score: 91 }
]);
</script>

<template>
  <main>
    <h1>IOI Vue Table Playground</h1>
    <IoiTable :rows="rows" :columns="columns" :height="280" />
  </main>
</template>

<style scoped>
main {
  max-width: 900px;
  margin: 3rem auto;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
</style>
