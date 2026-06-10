<template>
  <div class="w-full">
    <IoiTable
      v-bind="$attrs"
      :columns="columns"
      :rows="rows"
      :row-key="rowKey"
      :selection-mode="selectionMode"
      :selected-row-keys="selectedRowKeys"
      :page-size="pageSize"
      :show-pagination="showPagination"
      :page-size-options="pageSizeOptions"
      @update:selected-row-keys="$emit('update:selectedRowKeys', $event)"
      @selection-change="$emit('selection-change', $event)"
      @cell-commit="$emit('cell-commit', $event)"
      @row-click="$emit('row-click', $event)"
      @pagination-change="$emit('pagination-change', $event)"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </IoiTable>
  </div>
</template>

<script setup lang="ts">
import { IoiTable } from '@ioi-dev/vue-table';
import '@ioi-dev/vue-table/styles.css';
import '@ioi-dev/vue-table/themes/shadcn.css';
import type { ColumnDef } from '@ioi-dev/vue-table';

defineOptions({ inheritAttrs: false });

defineProps<{
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  rowKey: string;
  selectionMode?: 'single' | 'multi';
  selectedRowKeys?: Array<string | number>;
  pageSize?: number;
  showPagination?: boolean;
  pageSizeOptions?: number[];
}>();

defineEmits([
  'update:selectedRowKeys',
  'selection-change',
  'cell-commit',
  'row-click',
  'pagination-change'
]);
</script>
