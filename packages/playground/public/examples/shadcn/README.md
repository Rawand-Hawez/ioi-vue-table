# Shadcn Integration

## What This Provides

1. **CSS theme mapping** (`@ioi-dev/vue-table/themes/shadcn.css`) — maps all `--ioi-table-*` custom properties to your existing shadcn CSS variables.

2. **Copy-paste adapter** (`IoiDataTable.vue`) — imports both CSS files and forwards all props, events, and slots.

## Quick Start

1. Install:
   ```bash
   npm install @ioi-dev/vue-table
   ```

2. Copy `IoiDataTable.vue` into your project (e.g., `src/components/ui/data-table/`).

3. Use:
   ```vue
   <script setup>
   import { IoiDataTable } from '@/components/ui/data-table/IoiDataTable.vue'

   const columns = [
     { field: 'name', header: 'Name' },
     { field: 'email', header: 'Email' },
   ]

   const rows = [
     { id: 1, name: 'Alice', email: 'alice@example.com' },
     { id: 2, name: 'Bob', email: 'bob@example.com' },
   ]
   </script>

   <template>
     <IoiDataTable :columns="columns" :rows="rows" row-key="id" :page-size="10" :show-pagination="true" />
   </template>
   ```

## Customisation

The table renders with your shadcn design tokens automatically. To customise further:

- Use the `pagination` slot with your own pagination component
- Use the `header-filter` slot with shadcn `Input` / `Select`
- Use the `cell` slot for custom cell rendering (Badge, Button, etc.)

## CSS Variables Used

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`
- `--ring`, `--primary`
