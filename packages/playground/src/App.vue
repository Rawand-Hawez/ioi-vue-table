<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { lastPerfEntry } from './composables/usePerf';
import { useTheme, type Theme } from './composables/useTheme';

const { activeTheme, setTheme } = useTheme();

type RouteId =
  | 'overview'
  | 'sort-filter'
  | 'virtual-scroll'
  | 'column-control'
  | 'row-grouping'
  | 'row-styling'
  | 'custom-cells'
  | 'editing'
  | 'csv-export';

interface NavRoute {
  id: RouteId;
  label: string;
  badge?: string;
}

const routes: NavRoute[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sort-filter', label: 'Sort & Filter' },
  { id: 'virtual-scroll', label: 'Virtual Scroll' },
  { id: 'column-control', label: 'Columns' },
  { id: 'row-grouping', label: 'Grouping', badge: 'v0.2' },
  { id: 'row-styling', label: 'Row Styling', badge: 'v0.2.4' },
  { id: 'custom-cells', label: 'Custom Cells' },
  { id: 'editing', label: 'Editing' },
  { id: 'csv-export', label: 'CSV Export' },
];

const componentMap: Record<RouteId, ReturnType<typeof defineAsyncComponent>> = {
  'overview': defineAsyncComponent(() => import('./demos/OverviewDemo.vue')),
  'sort-filter': defineAsyncComponent(() => import('./demos/SortFilterDemo.vue')),
  'virtual-scroll': defineAsyncComponent(() => import('./demos/VirtualScrollDemo.vue')),
  'column-control': defineAsyncComponent(() => import('./demos/ColumnControlDemo.vue')),
  'row-grouping': defineAsyncComponent(() => import('./demos/RowGroupingDemo.vue')),
  'row-styling': defineAsyncComponent(() => import('./demos/RowStylingDemo.vue')),
  'custom-cells': defineAsyncComponent(() => import('./demos/CustomCellsDemo.vue')),
  'editing': defineAsyncComponent(() => import('./demos/InlineEditingDemo.vue')),
  'csv-export': defineAsyncComponent(() => import('./demos/CsvExportDemo.vue')),
};

function parseHash(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, '').trim() as RouteId;
  return routes.some((r) => r.id === id) ? id : 'overview';
}

const currentRoute = ref<RouteId>(parseHash(window.location.hash));
const activeComponent = computed(() => componentMap[currentRoute.value]);

function onHashChange(): void {
  currentRoute.value = parseHash(window.location.hash);
}

onMounted(() => {
  if (!window.location.hash) window.location.hash = 'overview';
  onHashChange();
  window.addEventListener('hashchange', onHashChange);
});

onUnmounted(() => window.removeEventListener('hashchange', onHashChange));

const themes: { id: Theme; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'bootstrap', label: 'Bootstrap' },
];

const perfColor = computed(() => {
  if (!lastPerfEntry.value) return '#64748b';
  const ms = lastPerfEntry.value.ms;
  if (ms < 5) return '#16a34a';
  if (ms < 50) return '#d97706';
  return '#dc2626';
});
</script>

<template>
  <div class="app-shell">
    <header class="top-nav">
      <a class="nav-brand" href="#overview">
        <span class="nav-logo">IOI</span>
        <span class="nav-title">Vue Table</span>
        <span class="nav-version">v0.2.4</span>
      </a>

      <nav class="nav-tabs" aria-label="Demo sections">
        <a
          v-for="route in routes"
          :key="route.id"
          :href="`#${route.id}`"
          :class="['nav-tab', { 'nav-tab--active': route.id === currentRoute }]"
        >
          {{ route.label }}
          <span v-if="route.badge" class="nav-tab-badge">{{ route.badge }}</span>
        </a>
      </nav>

      <div class="nav-right">
        <div class="theme-switcher" role="group" aria-label="Table theme">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="['theme-btn', { 'theme-btn--active': activeTheme === t.id }]"
            @click="setTheme(t.id)"
          >
            {{ t.label }}
          </button>
        </div>

        <div v-if="lastPerfEntry" class="perf-pill" :style="{ color: perfColor }">
          <span class="perf-pill__icon">&#9889;</span>
          <span class="perf-pill__ms">{{ lastPerfEntry.ms }}ms</span>
          <span class="perf-pill__label">{{ lastPerfEntry.label }}</span>
        </div>
      </div>
    </header>

    <main class="demo-stage">
      <Suspense>
        <component :is="activeComponent" />
        <template #fallback>
          <div class="demo-loading">Loading…</div>
        </template>
      </Suspense>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 52px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  gap: 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  flex-shrink: 0;
  margin-right: 1rem;
}

.nav-logo {
  background: var(--brand, #0f5bd4);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.18rem 0.38rem;
  border-radius: 5px;
}

.nav-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: #0f172a;
}

.nav-version {
  font-size: 0.68rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 20px;
  padding: 0.12rem 0.45rem;
}

.nav-tabs {
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  height: 100%;
}
.nav-tabs::-webkit-scrollbar { display: none; }

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  height: 100%;
  padding: 0 0.85rem;
  text-decoration: none;
  color: #64748b;
  font-size: 0.81rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 100ms, border-color 100ms;
  flex-shrink: 0;
}
.nav-tab:hover { color: #0f172a; }
.nav-tab--active {
  color: var(--brand, #0f5bd4);
  border-bottom-color: var(--brand, #0f5bd4);
  font-weight: 600;
}

.nav-tab-badge {
  font-size: 0.6rem;
  font-weight: 700;
  background: #eff6ff;
  color: #0f5bd4;
  border-radius: 20px;
  padding: 0.08rem 0.32rem;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.theme-switcher {
  display: flex;
  gap: 2px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.theme-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 500;
  padding: 0.26rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 100ms;
  white-space: nowrap;
}
.theme-btn:hover { color: #0f172a; background: #e2e8f0; }
.theme-btn--active {
  background: #ffffff;
  color: var(--brand, #0f5bd4);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.perf-pill {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.73rem;
  font-weight: 600;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 0.22rem 0.6rem;
  white-space: nowrap;
}
.perf-pill__label {
  color: #94a3b8;
  font-weight: 400;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-stage {
  flex: 1;
  padding: 1.5rem;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.demo-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #94a3b8;
  font-size: 0.875rem;
}

@media (max-width: 860px) {
  .perf-pill { display: none; }
  .demo-stage { padding: 1rem 0.75rem; }
}
</style>
