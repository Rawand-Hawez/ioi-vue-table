<script setup lang="ts">
import { ref } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { CellSlotProps, ColumnDef } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';
import { createProducts, type ProductRow } from '../utils/demoData';

const { activeTheme } = useTheme();

const rows = ref<ProductRow[]>(createProducts(300));

const columns: ColumnDef<ProductRow>[] = [
  { id: 'id',       field: 'id',       header: 'ID',       type: 'number', width: 72 },
  { id: 'name',     field: 'name',     header: 'Product',  type: 'text',   width: 220, headerFilter: 'text' },
  { id: 'badge',    field: 'badge',    header: 'Badge',    type: 'text',   width: 90 },
  { id: 'category', field: 'category', header: 'Category', type: 'text',   width: 130, headerFilter: 'select' },
  { id: 'price',    field: 'price',    header: 'Price',    type: 'number', width: 110 },
  { id: 'stock',    field: 'stock',    header: 'Stock',    type: 'number', width: 90 },
  { id: 'rating',   field: 'rating',   header: 'Rating',   type: 'number', width: 130 },
  { id: 'trend',    field: 'trend',    header: 'Trend',    type: 'text',   width: 90 },
  { id: 'sales30d', field: 'sales30d', header: '30d Sales', type: 'number', width: 130 },
];

function stars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function trendColor(trend: string): string {
  if (trend === 'up') return '#16a34a';
  if (trend === 'down') return '#dc2626';
  return '#64748b';
}

function badgeStyle(badge: string | null): Record<string, string> {
  if (badge === 'New') return { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' };
  if (badge === 'Sale') return { background: '#fef9c3', color: '#854d0e', borderColor: '#fde68a' };
  if (badge === 'Hot') return { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' };
  return {};
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Custom Cells</h2>
        <p class="demo-desc">
          Uses the <code>#cell</code> slot to render badges, star ratings, trend arrows,
          progress bars and price formatting — all without changing the data or columns.
        </p>
      </div>
    </div>

    <div :class="`theme-${activeTheme}`">
      <Table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="520"
        :row-height="40"
        :overscan="8"
      >
        <template #cell="{ column, value }: CellSlotProps<ProductRow>">
          <!-- Badge column -->
          <template v-if="column.field === 'badge'">
            <span
              v-if="value"
              class="badge"
              :style="badgeStyle(value as string)"
            >{{ value }}</span>
            <span v-else class="badge-empty">—</span>
          </template>

          <!-- Rating column: star display -->
          <template v-else-if="column.field === 'rating'">
            <span class="stars" :title="`${value}/5`">{{ stars(value as number) }}</span>
            <span class="rating-num">{{ value }}</span>
          </template>

          <!-- Trend column: colored arrow -->
          <template v-else-if="column.field === 'trend'">
            <span class="trend-cell" :style="{ color: trendColor(value as string) }">
              <span class="trend-icon">
                {{ value === 'up' ? '↑' : value === 'down' ? '↓' : '–' }}
              </span>
              {{ value }}
            </span>
          </template>

          <!-- Price: formatted currency -->
          <template v-else-if="column.field === 'price'">
            <span class="price">£{{ (value as number).toFixed(2) }}</span>
          </template>

          <!-- Stock: color coded -->
          <template v-else-if="column.field === 'stock'">
            <span :class="['stock', (value as number) < 50 ? 'stock--low' : (value as number) < 150 ? 'stock--mid' : 'stock--ok']">
              {{ value }}
            </span>
          </template>

          <!-- 30-day sales: mini progress bar -->
          <template v-else-if="column.field === 'sales30d'">
            <div class="progress-cell">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${Math.min(100, (value as number) / 10)}%` }" />
              </div>
              <span class="progress-val">{{ value }}</span>
            </div>
          </template>

          <!-- Default -->
          <template v-else>{{ value }}</template>
        </template>
      </Table>
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>&lt;Table :rows="rows" :columns="columns" row-key="id"&gt;
  &lt;template #cell="{ column, value, row }"&gt;

    &lt;!-- Match on column.field to render custom content --&gt;
    &lt;template v-if="column.field === 'status'"&gt;
      &lt;span :class="['chip', `chip--${value}`]"&gt;{{ value }}&lt;/span&gt;
    &lt;/template&gt;

    &lt;template v-else-if="column.field === 'progress'"&gt;
      &lt;div class="bar"&gt;
        &lt;div :style="{ width: value + '%' }" /&gt;
      &lt;/div&gt;
    &lt;/template&gt;

    &lt;template v-else-if="column.field === 'price'"&gt;
      £{{ value.toFixed(2) }}
    &lt;/template&gt;

    &lt;!-- Fallback: render the raw value for all other columns --&gt;
    &lt;template v-else&gt;{{ value }}&lt;/template&gt;

  &lt;/template&gt;
&lt;/Table&gt;</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }
.demo-header { }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 65ch; }

/* ── Cell renderers ── */
.badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 20px;
  border: 1px solid;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.badge-empty { color: #cbd5e1; }

.stars { color: #f59e0b; font-size: 0.75rem; letter-spacing: 0.02em; }
.rating-num { font-size: 0.72rem; color: #94a3b8; margin-left: 0.25rem; }

.trend-cell { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
.trend-icon { font-size: 0.9rem; }

.price { font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums; }

.stock { font-weight: 600; font-variant-numeric: tabular-nums; border-radius: 6px; padding: 0.1rem 0.4rem; }
.stock--low  { background: #fef2f2; color: #b91c1c; }
.stock--mid  { background: #fefce8; color: #854d0e; }
.stock--ok   { background: #f0fdf4; color: #166534; }

.progress-cell { display: flex; align-items: center; gap: 0.5rem; }
.progress-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 9px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #0f5bd4, #7c3aed); border-radius: 9px; transition: width 300ms ease; }
.progress-val { font-size: 0.75rem; color: #64748b; font-variant-numeric: tabular-nums; white-space: nowrap; min-width: 28px; text-align: right; }
</style>
