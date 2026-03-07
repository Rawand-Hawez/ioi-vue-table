/**
 * Server-side data fetching module for IOI Table.
 * Handles debounced fetch, loading/error state, and pagination.
 */

import { computed, watch, onScopeDispose, type ComputedRef, type Ref } from 'vue';
import type {
  ServerDataOptions,
  ServerFetchParams,
  ServerFetchResult,
  IoiTableState
} from '../../types';

/**
 * Data fetching API returned to the composable.
 */
export interface DataFetchingApi {
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMore: () => Promise<void>;
  isLoading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  errorMessage: ComputedRef<string | null>;
  hasMore: ComputedRef<boolean>;
}

/**
 * Options for data fetching module.
 */
export interface DataFetchingOptions<TRow> {
  serverOptions: ServerDataOptions<TRow>;
  state: Ref<IoiTableState>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  onRowsReceived: (rows: TRow[], totalRows: number) => void;
  onAppendRows?: (rows: TRow[], totalRows: number) => void;
}

/**
 * Creates server-side data fetching management functions.
 */
export function createDataFetching<TRow>(
  options: DataFetchingOptions<TRow>
): DataFetchingApi {
  const { serverOptions, state, pageIndex, pageSize, onRowsReceived } = options;

  const debounceMs = serverOptions.debounceMs ?? 300;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;
  let currentCursor: string | null = null;
  let nextPageIndex: number | null = null;

  const isLoading = computed(() => state.value.loading);
  const hasError = computed(() => state.value.error !== null);
  const errorMessage = computed(() => state.value.error);
  const hasMore = computed(() => {
    if (serverOptions.cursorMode) {
      return currentCursor !== null;
    }
    if (nextPageIndex !== null) {
      return true;
    }
    return false;
  });

  async function executeFetch(isFetchMore: boolean = false): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    state.value = {
      ...state.value,
      loading: true,
      error: null
    };

    serverOptions.onFetchStart?.();

    try {
      const params: ServerFetchParams = {
        pageIndex: isFetchMore && nextPageIndex !== null ? nextPageIndex : pageIndex.value,
        pageSize: pageSize.value,
        sort: state.value.sort,
        filters: state.value.filters,
        globalSearch: state.value.globalSearch,
        cursor: isFetchMore && serverOptions.cursorMode ? currentCursor : undefined,
      };

      const result: ServerFetchResult<TRow> = await serverOptions.fetch(params);

      if (abortController?.signal.aborted) {
        return;
      }

      if (isFetchMore && options.onAppendRows) {
        options.onAppendRows(result.rows, result.totalRows);
      } else {
        onRowsReceived(result.rows, result.totalRows);
      }
      
      if (result.nextCursor !== undefined) {
        currentCursor = result.nextCursor;
      }

      if (!serverOptions.cursorMode) {
        const totalPages = Math.ceil(result.totalRows / pageSize.value);
        const currentPage = params.pageIndex;
        nextPageIndex = currentPage + 1 < totalPages ? currentPage + 1 : null;
      }

      state.value = {
        ...state.value,
        serverTotalRows: result.totalRows,
        loading: false,
        error: null
      };

      serverOptions.onFetchSuccess?.(result);
    } catch (err) {
      if (abortController?.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      state.value = {
        ...state.value,
        loading: false,
        error: error.message
      };

      serverOptions.onFetchError?.(error);
    }
  }

  function debouncedFetch(): Promise<void> {
    return new Promise((resolve) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        executeFetch().then(resolve);
      }, debounceMs);
    });
  }

  const stopWatch = watch(
    [
      pageIndex,
      pageSize,
      () => state.value.sort,
      () => state.value.filters,
      () => state.value.globalSearch
    ],
    () => {
      currentCursor = null;
      nextPageIndex = null;
      debouncedFetch();
    },
    { deep: true }
  );

  onScopeDispose(() => {
    stopWatch();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  executeFetch();

  return {
    fetch: () => executeFetch(),
    refresh: () => {
      currentCursor = null;
      nextPageIndex = null;
      return executeFetch();
    },
    fetchMore: () => executeFetch(true),
    isLoading,
    hasError,
    errorMessage,
    hasMore,
  };
}
