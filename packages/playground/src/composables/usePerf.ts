import { ref } from 'vue';

export interface PerfEntry {
  id: number;
  label: string;
  ms: number;
}

let nextId = 0;

// Module-level refs so all demos share the same perf state (visible in top nav)
export const lastPerfEntry = ref<PerfEntry | null>(null);
export const perfHistory = ref<PerfEntry[]>([]);

export function usePerf() {
  function measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const ms = Math.round((performance.now() - start) * 100) / 100;
    const entry: PerfEntry = { id: ++nextId, label, ms };
    lastPerfEntry.value = entry;
    perfHistory.value = [entry, ...perfHistory.value].slice(0, 20);
    return result;
  }

  async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const ms = Math.round((performance.now() - start) * 100) / 100;
    const entry: PerfEntry = { id: ++nextId, label, ms };
    lastPerfEntry.value = entry;
    perfHistory.value = [entry, ...perfHistory.value].slice(0, 20);
    return result;
  }

  function clearHistory(): void {
    perfHistory.value = [];
    lastPerfEntry.value = null;
  }

  return { lastPerfEntry, perfHistory, measure, measureAsync, clearHistory };
}
