<template>
  <div class="demo-section">
    <h3>Shadcn Integration</h3>
    <p>
      Table using the shadcn CSS theme — visual tokens map to
      <code>--background</code>, <code>--foreground</code>, <code>--muted</code>,
      <code>--accent</code>, <code>--border</code>, <code>--ring</code>, etc.
    </p>

    <div class="shadcn-preview">
      <IoiTable
        :columns="columns"
        :rows="rows"
        row-key="id"
        :page-size="5"
        :show-pagination="true"
        :page-size-options="[5, 10, 20]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import IoiTable from '@ioi-dev/vue-table';
import type { ColumnDef } from '@ioi-dev/vue-table';

interface Row { id: number; name: string; email: string; role: string; status: string }

const columns: ColumnDef<Row>[] = [
  { field: 'id', header: 'ID' },
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
  { field: 'role', header: 'Role' },
  { field: 'status', header: 'Status' }
];

const roles = ['Admin', 'Editor', 'Viewer', 'Moderator'];
const statuses = ['Active', 'Inactive', 'Pending'];

const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: roles[i % roles.length],
  status: statuses[i % statuses.length]
}));
</script>

<style scoped>
.shadcn-preview {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --primary: 240 5.9% 10%;

  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 1rem;
}
</style>
