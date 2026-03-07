/**
 * Pagination management module for IOI Table.
 * Handles pagination state, computed values, and operations.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { IoiPaginationChangePayload, IoiPaginationOptions, IoiSemanticEvent, IoiSemanticEventType, IoiTableState } from '../../types';
import { normalizeNonNegativeInteger, normalizePositiveInteger } from '../../utils/number';
import { buildPaginationPayload } from './pagination';
import { clamp } from './utils';

/**
 * Pagination API returned to the composable.
 */
export interface PaginationApi {
  setPageIndex: (pageIndex: number, reason?: IoiPaginationChangePayload['reason']) => void;
  setPageSize: (pageSize: number, reason?: IoiPaginationChangePayload['reason']) => void;
}

/**
 * Pagination computed values.
 */
export interface PaginationComputed {
  enabled: ComputedRef<boolean>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  pageCount: ComputedRef<number>;
  rawPageIndex: ComputedRef<number>;
  rawPageSize: ComputedRef<number>;
}

/**
 * Options for pagination module.
 */
export interface PaginationOptions {
  config: ComputedRef<IoiPaginationOptions | undefined>;
  processedRowCount: ComputedRef<number>;
  onPaginationChange?: (payload: IoiPaginationChangePayload) => void;
}

/**
 * Dependencies for pagination.
 */
export interface PaginationDeps {
  state: Ref<IoiTableState>;
}

/**
 * Event emitter function type.
 */
type EventEmitter = <TPayload>(
  type: IoiSemanticEventType,
  payload: TPayload
) => IoiSemanticEvent<TPayload>;

/**
 * Creates pagination management functions and computed values.
 */
export function createPaginationManager(
  deps: PaginationDeps,
  options: PaginationOptions,
  emitEvent: EventEmitter
): {
  api: PaginationApi;
  computed: PaginationComputed;
  uncontrolledPageIndex: Ref<number>;
  uncontrolledPageSize: Ref<number>;
} {
  // state is available in deps but not currently used by this module
  // It's kept for future extensions that may need direct state access
  void deps.state;
  const { config, processedRowCount, onPaginationChange } = options;

  // Uncontrolled state (when pageIndex/pageSize are not provided via props)
  const uncontrolledPageIndex = ref(0);
  const uncontrolledPageSize = ref(0);

  // Controlled state detection
  const isPageIndexControlled = computed(() => config.value?.pageIndex !== undefined);
  const isPageSizeControlled = computed(() => config.value?.pageSize !== undefined);

  // Raw values (from controlled or uncontrolled state)
  const rawPageIndex: ComputedRef<number> = computed(() =>
    normalizeNonNegativeInteger(
      isPageIndexControlled.value ? config.value?.pageIndex : uncontrolledPageIndex.value,
      0
    )
  );

  const rawPageSize: ComputedRef<number> = computed(() =>
    normalizePositiveInteger(
      isPageSizeControlled.value ? config.value?.pageSize : uncontrolledPageSize.value,
      0
    )
  );

  // Derived computed values
  const enabled: ComputedRef<boolean> = computed(() => rawPageSize.value > 0);

  const pageCount: ComputedRef<number> = computed(() =>
    enabled.value
      ? Math.max(1, Math.ceil(processedRowCount.value / rawPageSize.value))
      : 1
  );

  const pageIndex: ComputedRef<number> = computed(() =>
    enabled.value ? clamp(rawPageIndex.value, 0, pageCount.value - 1) : 0
  );

  const pageSize: ComputedRef<number> = computed(() => rawPageSize.value);

  function notifyPaginationChange(
    nextPageIndex: number,
    nextPageSize: number,
    reason: IoiPaginationChangePayload['reason']
  ): void {
    const normalizedPageSize = normalizePositiveInteger(nextPageSize, 0);
    const normalizedPageIndex = normalizeNonNegativeInteger(nextPageIndex, 0);
    const payload = buildPaginationPayload(
      normalizedPageIndex,
      normalizedPageSize,
      processedRowCount.value,
      reason
    );

    onPaginationChange?.(payload);

    emitEvent('data:explore', {
      reason: 'pagination',
      action: payload.reason,
      pageIndex: payload.pageIndex,
      pageSize: payload.pageSize,
      pageCount: payload.pageCount,
      rowCount: payload.rowCount
    });
  }

  function setPageIndex(
    nextPageIndex: number,
    reason: IoiPaginationChangePayload['reason'] = 'setPageIndex'
  ): void {
    if (rawPageSize.value <= 0) {
      return;
    }

    const nextPageSize = rawPageSize.value;
    const normalizedNextPageIndex = normalizeNonNegativeInteger(nextPageIndex, 0);
    const nextPageCount =
      nextPageSize > 0 ? Math.max(1, Math.ceil(processedRowCount.value / nextPageSize)) : 1;
    const clampedNextPageIndex =
      nextPageSize > 0 ? clamp(normalizedNextPageIndex, 0, nextPageCount - 1) : 0;

    if (clampedNextPageIndex === pageIndex.value) {
      return;
    }

    if (!isPageIndexControlled.value) {
      uncontrolledPageIndex.value = clampedNextPageIndex;
    }

    if (!isPageSizeControlled.value) {
      uncontrolledPageSize.value = nextPageSize;
    }

    notifyPaginationChange(clampedNextPageIndex, nextPageSize, reason);
  }

  function setPageSize(
    nextPageSize: number,
    reason: IoiPaginationChangePayload['reason'] = 'setPageSize'
  ): void {
    const normalizedNextPageSize = normalizePositiveInteger(nextPageSize, 0);
    const nextPageIndex = 0;

    if (normalizedNextPageSize === pageSize.value && pageIndex.value === nextPageIndex) {
      return;
    }

    if (!isPageSizeControlled.value) {
      uncontrolledPageSize.value = normalizedNextPageSize;
    }

    if (!isPageIndexControlled.value) {
      uncontrolledPageIndex.value = nextPageIndex;
    }

    notifyPaginationChange(nextPageIndex, normalizedNextPageSize, reason);
  }

  return {
    api: {
      setPageIndex,
      setPageSize
    },
    computed: {
      enabled,
      pageIndex,
      pageSize,
      pageCount,
      rawPageIndex,
      rawPageSize
    },
    uncontrolledPageIndex,
    uncontrolledPageSize
  };
}
