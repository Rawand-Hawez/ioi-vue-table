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
const collapsed = ref(false);

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
    <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
      <div class="sidebar-top">
        <a class="nav-brand" href="#overview">
          <span class="nav-logo">IOI</span>
          <div class="nav-brand-text">
            <span class="nav-title">Vue Table</span>
            <span class="nav-version">v0.2.4</span>
          </div>
        </a>
        <button
          class="sidebar-toggle"
          :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="collapsed = !collapsed"
        >{{ collapsed ? '›' : '‹' }}</button>
      </div>

      <nav class="sidebar-nav" aria-label="Demo sections">
        <span class="sidebar-label">Demos</span>
        <a
          v-for="route in routes"
          :key="route.id"
          :href="`#${route.id}`"
          :class="['sidebar-link', { 'sidebar-link--active': route.id === currentRoute }]"
        >
          {{ route.label }}
          <span v-if="route.badge" class="nav-badge">{{ route.badge }}</span>
        </a>
      </nav>
    </aside>

    <main class="demo-stage">
      <div class="stage-toolbar">
        <div class="theme-switcher" role="group" aria-label="Table theme">
          <button
            v-for="t in themes"
            :key="t.id"
            :class="['theme-btn', { 'theme-btn--active': activeTheme === t.id }]"
            @click="setTheme(t.id)"
          >{{ t.label }}</button>
        </div>
        <div v-if="lastPerfEntry" class="toolbar-perf" :style="{ color: perfColor }">
          <span>&#9889;</span>
          <span>{{ lastPerfEntry.ms }}ms</span>
          <span class="toolbar-perf__label">{{ lastPerfEntry.label }}</span>
        </div>
      </div>

      <div class="stage-content">
        <Suspense>
          <component :is="activeComponent" />
          <template #fallback>
            <div class="demo-loading">Loading…</div>
          </template>
        </Suspense>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: row;
  height: 100dvh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  transition: width 200ms ease;
}

.sidebar--collapsed {
  width: 48px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0.75rem 1rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  gap: 0.5rem;
  min-height: 52px;
}

.sidebar--collapsed .sidebar-top {
  justify-content: center;
  padding: 1rem 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  opacity: 1;
  transition: opacity 150ms ease;
}

.sidebar--collapsed .nav-brand {
  opacity: 0;
  pointer-events: none;
}

.nav-logo {
  background: var(--brand, #0f5bd4);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.22rem 0.4rem;
  border-radius: 5px;
  flex-shrink: 0;
}

.nav-brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  overflow: hidden;
}

.nav-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
  line-height: 1.2;
  white-space: nowrap;
}

.nav-version {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.2;
}

.sidebar-toggle {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms, color 120ms;
  padding: 0;
  line-height: 1;
}

.sidebar-toggle:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ── Nav links ── */
.sidebar-nav {
  flex: 1;
  padding: 0.85rem 0 0.5rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  opacity: 1;
  transition: opacity 150ms ease;
}

.sidebar--collapsed .sidebar-nav {
  opacity: 0;
  pointer-events: none;
}

.sidebar-label {
  display: block;
  padding: 0 1rem 0.45rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
  text-transform: uppercase;
}

.sidebar-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.42rem 1rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: background 80ms, color 80ms;
  white-space: nowrap;
}

.sidebar-link:hover {
  background: #f8fafc;
  color: #0f172a;
}

.sidebar-link--active {
  color: var(--brand, #0f5bd4);
  background: #eff6ff;
  border-left-color: var(--brand, #0f5bd4);
  font-weight: 600;
}

.nav-badge {
  font-size: 0.58rem;
  font-weight: 700;
  background: #eff6ff;
  color: #0f5bd4;
  border-radius: 20px;
  padding: 0.06rem 0.3rem;
  flex-shrink: 0;
}

/* ── Stage ── */
.demo-stage {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.stage-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
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
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.24rem 0.55rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 80ms;
  white-space: nowrap;
}

.theme-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.theme-btn--active {
  background: #ffffff;
  color: var(--brand, #0f5bd4);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.toolbar-perf {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.71rem;
  font-weight: 600;
}

.toolbar-perf__label {
  color: #94a3b8;
  font-weight: 400;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
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

@media (max-width: 700px) {
  .sidebar { width: 180px; }
  .sidebar--collapsed { width: 44px; }
  .stage-content { padding: 1rem; }
}
</style>
