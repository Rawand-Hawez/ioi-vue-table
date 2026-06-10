# Shadcn Integration

## Quick Start

1. Install the package:
   ```bash
   npm install @ioi-dev/vue-table
   ```

2. Copy `IoiDataTable.vue` into your project (e.g., `src/components/ui/data-table/`).

3. The adapter imports both the default and shadcn CSS themes. The shadcn theme maps `--ioi-table-*` variables to your existing shadcn CSS variables (`--background`, `--foreground`, `--muted`, etc.).

4. Use the component:

   ```vue
   <script setup>
   import IoiDataTable from '@/components/ui/data-table/IoiDataTable.vue'

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
     <IoiDataTable
       :columns="columns"
       :rows="rows"
       row-key="id"
       :page-size="10"
       :show-pagination="true"
     />
   </template>
   ```

## Adapter Philosophy

The adapter is a thin wrapper. It:

- Imports both CSS files (`styles.css` + `themes/shadcn.css`)
- Forwards all props, events, and slots to `IoiTable`
- Does **not** reimplement any UI primitives

You can customize it by:

- Adding shadcn components in the `pagination` slot
- Using the `header-filter` slot with shadcn `Input` / `Select`
- Wrapping cells with shadcn `Badge`, `Button`, etc. via the `cell` slot

## Aliases

If your shadcn components use a different import path, adjust the imports in your copy of `IoiDataTable.vue`. The adapter does not depend on any specific shadcn component — it only uses the CSS variable mapping.

## CSS Variables Used

The shadcn theme references these variables from your shadcn CSS:

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`
- `--ring`, `--primary`
