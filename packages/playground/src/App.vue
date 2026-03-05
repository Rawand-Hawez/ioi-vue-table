<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import BigDataDemo from './demos/BigDataDemo.vue';
import OpsDemo from './demos/OpsDemo.vue';
import PinnedColumnsDemo from './demos/PinnedColumnsDemo.vue';

type DemoRoute = 'big-data' | 'pinned-columns' | 'ops-demo';

interface DemoRouteEntry {
  id: DemoRoute;
  label: string;
  description: string;
}

const routes: DemoRouteEntry[] = [
  {
    id: 'big-data',
    label: 'Big Data',
    description: '100k x 50 deterministic primitives and virtualization stress.'
  },
  {
    id: 'pinned-columns',
    label: 'Pinned Columns',
    description: 'Left/right partitions with programmatic sizing and reorder actions.'
  },
  {
    id: 'ops-demo',
    label: 'Ops Demo',
    description: 'Sort/filter/global-search/selection plus perf timing panel.'
  }
];

const componentByRoute: Record<DemoRoute, unknown> = {
  'big-data': BigDataDemo,
  'pinned-columns': PinnedColumnsDemo,
  'ops-demo': OpsDemo
};

function parseRoute(hash: string): DemoRoute {
  const normalized = hash.replace(/^#\/?/, '').trim() as DemoRoute;
  return routes.some((route) => route.id === normalized) ? normalized : 'big-data';
}

const currentRoute = ref<DemoRoute>(parseRoute(window.location.hash));

const activeComponent = computed(() => componentByRoute[currentRoute.value]);

function onHashChange(): void {
  currentRoute.value = parseRoute(window.location.hash);
}

onMounted(() => {
  if (!window.location.hash) {
    window.location.hash = 'big-data';
  }
  onHashChange();
  window.addEventListener('hashchange', onHashChange);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange);
});
</script>

<template>
  <main class="playground-shell">
    <header class="shell-header">
      <p class="shell-header__kicker">IOI Vue Table Playground</p>
      <h1>Regression-Torture Demos</h1>
      <p class="shell-header__summary">
        JS-first baseline with virtualized rendering, pinned partition behavior, and repeatable perf
        timings. WASM integration remains intentionally separate.
      </p>
    </header>

    <nav class="route-nav" aria-label="Demo routes">
      <a
        v-for="route in routes"
        :key="route.id"
        :href="`#/${route.id}`"
        :class="['route-nav__item', { 'route-nav__item--active': route.id === currentRoute }]"
      >
        <strong>{{ route.label }}</strong>
        <span>{{ route.description }}</span>
      </a>
    </nav>

    <section class="route-stage">
      <component :is="activeComponent" />
    </section>
  </main>
</template>

<style scoped>
.playground-shell {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1.4rem;
  display: grid;
  gap: 1rem;
  font-family: 'Avenir Next', 'Segoe UI', sans-serif;
  color: #122033;
}

.shell-header {
  border: 1px solid #d9e2ef;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  background: linear-gradient(120deg, #f8fbff, #eef5ff 55%, #f3f8ff);
}

.shell-header__kicker {
  margin: 0;
  font-size: 0.77rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f4eaf;
  font-weight: 700;
}

.shell-header h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(1.4rem, 2.8vw, 2rem);
}

.shell-header__summary {
  margin: 0.5rem 0 0;
  max-width: 76ch;
  color: #435369;
}

.route-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.route-nav__item {
  display: grid;
  gap: 0.32rem;
  border: 1px solid #d9e2ef;
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  text-decoration: none;
  color: inherit;
  background: #ffffff;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.route-nav__item strong {
  font-size: 0.9rem;
}

.route-nav__item span {
  font-size: 0.8rem;
  color: #5f6c7e;
}

.route-nav__item:hover {
  transform: translateY(-1px);
  border-color: #b3c4df;
  box-shadow: 0 8px 16px rgba(15, 50, 108, 0.08);
}

.route-nav__item--active {
  border-color: #0f5bd4;
  box-shadow: 0 10px 22px rgba(15, 91, 212, 0.16);
}

.route-stage {
  border: 1px solid #d9e2ef;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.95rem;
}

@media (max-width: 980px) {
  .route-nav {
    grid-template-columns: minmax(0, 1fr);
  }

  .playground-shell {
    padding: 0.8rem;
  }
}
</style>
