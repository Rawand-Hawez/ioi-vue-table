<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';

const { activeTheme } = useTheme();

interface Row { id: number; name: string; email: string; role: string; status: string }

const columns = [
  { field: 'id', header: 'ID', width: 80, type: 'number' },
  { field: 'name', header: 'Name', width: 200 },
  { field: 'email', header: 'Email', width: 250 },
  { field: 'role', header: 'Role', width: 140 },
  { field: 'status', header: 'Status', width: 120 }
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

const useShadcnTheme = ref(true);
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Shadcn Integration <span class="new-badge">v0.3.0</span></h2>
        <p class="demo-desc">
          Table using the shadcn CSS theme — tokens map to
          <code>--background</code>, <code>--muted</code>,
          <code>--accent</code>, <code>--border</code>, <code>--ring</code>, etc.
        </p>
      </div>
      <div class="controls">
        <div class="segment">
          <button :class="['seg-btn', { 'seg-btn--active': useShadcnTheme }]" @click="useShadcnTheme = true">Shadcn Theme</button>
          <button :class="['seg-btn', { 'seg-btn--active': !useShadcnTheme }]" @click="useShadcnTheme = false">Default Theme</button>
        </div>
      </div>
    </div>

    <div :class="useShadcnTheme ? 'shadcn-preview' : `theme-${activeTheme}`">
      <Table
        :columns="columns"
        :rows="rows"
        row-key="id"
        :height="400"
        :row-height="36"
        :page-size="5"
        :show-pagination="true"
        :page-size-options="[5, 10, 20]"
      />
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>// Import both default + shadcn CSS themes
import '@ioi-dev/vue-table/styles.css'
import '@ioi-dev/vue-table/themes/shadcn.css'

// The shadcn theme maps ioi-table tokens to your shadcn variables:
// --ioi-table-bg         → var(--background)
// --ioi-table-color      → var(--foreground)
// --ioi-table-header-bg  → var(--muted)
// --ioi-table-border     → var(--border)
// --ioi-table-focus      → var(--ring)</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 65ch; }

.new-badge {
  font-size: 0.6rem; font-weight: 700;
  background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe;
  border-radius: 20px; padding: 0.1rem 0.4rem;
}

.controls { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }

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
