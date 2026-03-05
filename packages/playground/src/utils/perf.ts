import { ref } from 'vue';

export interface PerfSample {
  id: number;
  label: string;
  durationMs: number;
  capturedAt: string;
}

export function usePerfBaseline(limit = 12) {
  const samples = ref<PerfSample[]>([]);
  let sequence = 0;

  function measure<T>(label: string, operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const durationMs = performance.now() - start;

    const sample: PerfSample = {
      id: sequence,
      label,
      durationMs,
      capturedAt: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };

    sequence += 1;
    samples.value = [sample, ...samples.value].slice(0, limit);
    console.info(`[ioi-vue-table:perf] ${label}: ${durationMs.toFixed(2)}ms`);

    return result;
  }

  function clear(): void {
    samples.value = [];
  }

  return {
    samples,
    measure,
    clear
  };
}
