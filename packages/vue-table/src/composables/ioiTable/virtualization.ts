/**
 * Virtualization module for IOI Table.
 * Handles viewport and scroll calculations for virtual scrolling.
 */

import { computed, type ComputedRef, type Ref } from 'vue';
import type { IoiTableState, VirtualRange } from '../../types';
import { normalizePositiveNumber } from '../../utils/number';
import { clamp } from './utils';
import { DEFAULT_VIEWPORT_HEIGHT } from './constants';

/**
 * Virtualization API returned to the composable.
 */
export interface VirtualizationApi {
  setViewport: (scrollTop: number, viewportHeight?: number) => void;
  scrollToRow: (index: number) => void;
}

/**
 * Virtualization computed values.
 */
export interface VirtualizationComputed {
  virtualRange: ComputedRef<VirtualRange>;
  virtualPaddingTop: ComputedRef<number>;
  virtualPaddingBottom: ComputedRef<number>;
  totalHeight: ComputedRef<number>;
}

/**
 * Options for virtualization module.
 */
export interface VirtualizationOptions {
  rowHeight: Ref<number>;
  overscan: Ref<number>;
  processedRowCount: ComputedRef<number>;
  paginationEnabled: ComputedRef<boolean>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  setPageIndex: (index: number, reason?: string) => void;
}

/**
 * Dependencies for virtualization computed values.
 */
export interface VirtualizationDeps {
  state: Ref<IoiTableState>;
}

/**
 * Creates virtualization management functions and computed values.
 */
export function createVirtualization(
  deps: VirtualizationDeps,
  options: VirtualizationOptions
): {
  api: VirtualizationApi;
  computed: VirtualizationComputed;
} {
  const { state } = deps;
  const {
    rowHeight,
    overscan,
    processedRowCount,
    paginationEnabled,
    pageIndex,
    pageSize,
    setPageIndex
  } = options;

  const totalHeight: ComputedRef<number> = computed(() => {
    return processedRowCount.value * rowHeight.value;
  });

  const virtualRange: ComputedRef<VirtualRange> = computed(() => {
    if (processedRowCount.value === 0) {
      return { start: 0, end: 0 };
    }

    if (paginationEnabled.value) {
      const start = clamp(pageIndex.value * pageSize.value, 0, processedRowCount.value);
      const end = clamp(start + pageSize.value, start, processedRowCount.value);
      return { start, end };
    }

    const viewportHeight = state.value.viewport.viewportHeight;
    const visibleCount = Math.max(1, Math.ceil(viewportHeight / rowHeight.value));
    const start = clamp(
      Math.floor(state.value.viewport.scrollTop / rowHeight.value) - overscan.value,
      0,
      processedRowCount.value
    );
    const end = clamp(start + visibleCount + overscan.value * 2, start, processedRowCount.value);

    return { start, end };
  });

  const virtualPaddingTop: ComputedRef<number> = computed(() => {
    return paginationEnabled.value ? 0 : virtualRange.value.start * rowHeight.value;
  });

  const virtualPaddingBottom: ComputedRef<number> = computed(() => {
    if (paginationEnabled.value) {
      return 0;
    }

    // Note: This depends on visibleIndices.length which is computed outside this module
    // For now, we calculate based on the range
    const visibleCount = virtualRange.value.end - virtualRange.value.start;
    const renderedHeight = visibleCount * rowHeight.value;
    return Math.max(0, totalHeight.value - virtualPaddingTop.value - renderedHeight);
  });

  function setViewport(scrollTop: number, viewportHeight = state.value.viewport.viewportHeight): void {
    const nextViewportHeight = normalizePositiveNumber(viewportHeight, DEFAULT_VIEWPORT_HEIGHT);
    const maxScrollTop = Math.max(0, totalHeight.value - nextViewportHeight);
    const nextScrollTop = clamp(scrollTop, 0, maxScrollTop);

    if (
      nextScrollTop === state.value.viewport.scrollTop &&
      nextViewportHeight === state.value.viewport.viewportHeight
    ) {
      return;
    }

    state.value = {
      ...state.value,
      viewport: {
        scrollTop: nextScrollTop,
        viewportHeight: nextViewportHeight
      }
    };
  }

  function scrollToRow(index: number): void {
    if (processedRowCount.value === 0) {
      return;
    }

    const clampedIndex = clamp(index, 0, processedRowCount.value - 1);

    if (paginationEnabled.value && pageSize.value > 0) {
      const nextPageIndex = Math.floor(clampedIndex / pageSize.value);
      setPageIndex(nextPageIndex);
      const withinPageIndex = clampedIndex - nextPageIndex * pageSize.value;
      setViewport(withinPageIndex * rowHeight.value, state.value.viewport.viewportHeight);
      return;
    }

    setViewport(clampedIndex * rowHeight.value, state.value.viewport.viewportHeight);
  }

  return {
    api: {
      setViewport,
      scrollToRow
    },
    computed: {
      virtualRange,
      virtualPaddingTop,
      virtualPaddingBottom,
      totalHeight
    }
  };
}
