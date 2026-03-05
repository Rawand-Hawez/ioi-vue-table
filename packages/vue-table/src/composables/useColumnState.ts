import { computed, ref, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';
import type { ColumnDef } from '../types';

export type ColumnPinState = 'left' | 'right' | 'none';

export interface ColumnStateColumn<TRow = Record<string, unknown>> extends ColumnDef<TRow> {
  id: string;
  hidden: boolean;
  pin: ColumnPinState;
}

export interface ColumnStateSnapshot {
  order: string[];
  hidden: Record<string, boolean>;
  pin: Record<string, ColumnPinState>;
  widths: Record<string, number | string | undefined>;
  minWidths: Record<string, number | undefined>;
  maxWidths: Record<string, number | undefined>;
}

export interface ColumnStatePersistenceAdapter {
  load: () => Partial<ColumnStateSnapshot> | null | undefined;
  save: (snapshot: ColumnStateSnapshot) => void;
}

export interface UseColumnStateOptions<TRow = Record<string, unknown>> {
  columns: ColumnDef<TRow>[];
  adapter?: ColumnStatePersistenceAdapter;
}

export interface ColumnSizingUpdate {
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
}

const DEFAULT_COLUMN_WIDTH = 160;

function normalizePin(pin: unknown): ColumnPinState {
  return pin === 'left' || pin === 'right' ? pin : 'none';
}

function cloneSnapshot(snapshot: Partial<ColumnStateSnapshot>): Partial<ColumnStateSnapshot> {
  return {
    order: snapshot.order ? [...snapshot.order] : undefined,
    hidden: snapshot.hidden ? { ...snapshot.hidden } : undefined,
    pin: snapshot.pin ? { ...snapshot.pin } : undefined,
    widths: snapshot.widths ? { ...snapshot.widths } : undefined,
    minWidths: snapshot.minWidths ? { ...snapshot.minWidths } : undefined,
    maxWidths: snapshot.maxWidths ? { ...snapshot.maxWidths } : undefined
  };
}

function sanitizeOrder(order: readonly string[] | undefined, sourceIds: readonly string[]): string[] {
  const nextOrder: string[] = [];
  const sourceIdSet = new Set(sourceIds);
  const seenIds = new Set<string>();

  if (order) {
    for (let index = 0; index < order.length; index += 1) {
      const id = order[index];
      if (!sourceIdSet.has(id) || seenIds.has(id)) {
        continue;
      }

      seenIds.add(id);
      nextOrder.push(id);
    }
  }

  for (let index = 0; index < sourceIds.length; index += 1) {
    const id = sourceIds[index];
    if (seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);
    nextOrder.push(id);
  }

  return nextOrder;
}

function normalizeWidthLimit(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.round(value);
}

function isPercentWidth(width: number | string | undefined): width is string {
  return typeof width === 'string' && width.trim().endsWith('%');
}

function parseNumericWidth(width: number | string | undefined): number | undefined {
  if (typeof width === 'number') {
    if (Number.isNaN(width) || !Number.isFinite(width) || width <= 0) {
      return undefined;
    }

    return Math.round(width);
  }

  if (typeof width !== 'string') {
    return undefined;
  }

  const trimmed = width.trim();
  if (trimmed.length === 0 || trimmed.endsWith('%')) {
    return undefined;
  }

  const normalized = trimmed.endsWith('px') ? trimmed.slice(0, -2) : trimmed;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.round(parsed);
}

function normalizeColumnSizingState<TRow>(
  sourceColumn: ColumnStateColumn<TRow>,
  widthInput: number | string | undefined,
  minWidthInput: number | undefined,
  maxWidthInput: number | undefined
): {
  width: number | string | undefined;
  minWidth: number | undefined;
  maxWidth: number | undefined;
} {
  const minWidth = normalizeWidthLimit(minWidthInput);
  let maxWidth = normalizeWidthLimit(maxWidthInput);

  if (minWidth !== undefined && maxWidth !== undefined && maxWidth < minWidth) {
    maxWidth = minWidth;
  }

  if (isPercentWidth(sourceColumn.width)) {
    return {
      width: sourceColumn.width,
      minWidth,
      maxWidth
    };
  }

  const hasExplicitWidthInput = widthInput !== undefined;
  const numericWidth = parseNumericWidth(widthInput);
  let width: number | string | undefined;

  if (numericWidth === undefined) {
    if (!hasExplicitWidthInput && sourceColumn.width === undefined) {
      width = undefined;
    } else {
      width = minWidth ?? DEFAULT_COLUMN_WIDTH;
    }
  } else {
    width = numericWidth;
  }

  if (typeof width === 'number') {
    if (minWidth !== undefined && width < minWidth) {
      width = minWidth;
    }
    if (maxWidth !== undefined && width > maxWidth) {
      width = maxWidth;
    }
  }

  return {
    width,
    minWidth,
    maxWidth
  };
}

export function createInMemoryColumnStateAdapter(
  initialState: Partial<ColumnStateSnapshot> = {}
): ColumnStatePersistenceAdapter {
  let snapshot = cloneSnapshot(initialState);

  return {
    load() {
      return cloneSnapshot(snapshot);
    },
    save(nextSnapshot) {
      snapshot = cloneSnapshot(nextSnapshot);
    }
  };
}

export function useColumnState<TRow = Record<string, unknown>>(
  options: MaybeRef<UseColumnStateOptions<TRow>>
) {
  const defaultAdapter = createInMemoryColumnStateAdapter();
  const columnOrder = ref<string[]>([]);
  const hiddenById = ref<Record<string, boolean>>({});
  const pinById = ref<Record<string, ColumnPinState>>({});
  const widthById = ref<Record<string, number | string | undefined>>({});
  const minWidthById = ref<Record<string, number | undefined>>({});
  const maxWidthById = ref<Record<string, number | undefined>>({});

  const sourceColumns = computed<ColumnStateColumn<TRow>[]>(() => {
    const rawColumns = unref(options).columns ?? [];
    const idUsage = new Map<string, number>();

    return rawColumns.map((column, index) => {
      const baseId = column.id ? String(column.id) : String(column.field);
      const seenCount = idUsage.get(baseId) ?? 0;
      idUsage.set(baseId, seenCount + 1);
      const id = seenCount === 0 ? baseId : `${baseId}#${index}`;

      return {
        ...column,
        id,
        hidden: Boolean(column.hidden),
        pin: normalizePin(column.pin)
      };
    });
  });

  const sourceColumnMap = computed(() => {
    const map = new Map<string, ColumnStateColumn<TRow>>();

    for (let index = 0; index < sourceColumns.value.length; index += 1) {
      const column = sourceColumns.value[index];
      map.set(column.id, column);
    }

    return map;
  });

  const adapter = computed(() => unref(options).adapter ?? defaultAdapter);

  function getSnapshot(): ColumnStateSnapshot {
    return {
      order: [...columnOrder.value],
      hidden: { ...hiddenById.value },
      pin: { ...pinById.value },
      widths: { ...widthById.value },
      minWidths: { ...minWidthById.value },
      maxWidths: { ...maxWidthById.value }
    };
  }

  function persistSnapshot(): void {
    adapter.value.save(getSnapshot());
  }

  watch(
    [sourceColumns, adapter],
    ([nextColumns]) => {
      const loadedState = adapter.value.load() ?? {};
      const sourceIds = nextColumns.map((column) => column.id);

      columnOrder.value = sanitizeOrder(loadedState.order, sourceIds);
      hiddenById.value = {};
      pinById.value = {};
      widthById.value = {};
      minWidthById.value = {};
      maxWidthById.value = {};

      for (let index = 0; index < nextColumns.length; index += 1) {
        const column = nextColumns[index];
        const id = column.id;
        const normalizedSizing = normalizeColumnSizingState(
          column,
          loadedState.widths?.[id] ?? column.width,
          loadedState.minWidths?.[id] ?? column.minWidth,
          loadedState.maxWidths?.[id] ?? column.maxWidth
        );

        hiddenById.value[id] = loadedState.hidden?.[id] ?? column.hidden;
        pinById.value[id] = normalizePin(loadedState.pin?.[id] ?? column.pin);
        widthById.value[id] = normalizedSizing.width;
        minWidthById.value[id] = normalizedSizing.minWidth;
        maxWidthById.value[id] = normalizedSizing.maxWidth;
      }

      persistSnapshot();
    },
    { immediate: true }
  );

  const orderedColumns = computed<ColumnStateColumn<TRow>[]>(() => {
    const columns: ColumnStateColumn<TRow>[] = [];

    for (let index = 0; index < columnOrder.value.length; index += 1) {
      const id = columnOrder.value[index];
      const sourceColumn = sourceColumnMap.value.get(id);

      if (!sourceColumn) {
        continue;
      }

      const normalizedSizing = normalizeColumnSizingState(
        sourceColumn,
        widthById.value[id],
        minWidthById.value[id],
        maxWidthById.value[id]
      );

      columns.push({
        ...sourceColumn,
        hidden: hiddenById.value[id] ?? sourceColumn.hidden,
        pin: normalizePin(pinById.value[id] ?? sourceColumn.pin),
        width: normalizedSizing.width,
        minWidth: normalizedSizing.minWidth,
        maxWidth: normalizedSizing.maxWidth
      });
    }

    return columns;
  });

  const visibleColumns = computed(() => orderedColumns.value.filter((column) => !column.hidden));
  const pinnedLeftColumns = computed(() =>
    visibleColumns.value.filter((column) => column.pin === 'left')
  );
  const centerColumns = computed(() => visibleColumns.value.filter((column) => column.pin === 'none'));
  const pinnedRightColumns = computed(() =>
    visibleColumns.value.filter((column) => column.pin === 'right')
  );

  function setColumnOrder(nextOrder: string[]): void {
    columnOrder.value = sanitizeOrder(nextOrder, sourceColumns.value.map((column) => column.id));
    persistSnapshot();
  }

  function setColumnVisibility(columnId: string, hidden: boolean): void {
    if (!sourceColumnMap.value.has(columnId)) {
      return;
    }

    hiddenById.value = {
      ...hiddenById.value,
      [columnId]: hidden
    };
    persistSnapshot();
  }

  function setColumnPin(columnId: string, pin: ColumnPinState): void {
    if (!sourceColumnMap.value.has(columnId)) {
      return;
    }

    pinById.value = {
      ...pinById.value,
      [columnId]: normalizePin(pin)
    };
    persistSnapshot();
  }

  function setColumnSizing(columnId: string, sizing: ColumnSizingUpdate): void {
    const sourceColumn = sourceColumnMap.value.get(columnId);
    if (!sourceColumn) {
      return;
    }

    const nextSizing = normalizeColumnSizingState(
      sourceColumn,
      sizing.width !== undefined ? sizing.width : widthById.value[columnId],
      sizing.minWidth !== undefined ? sizing.minWidth : minWidthById.value[columnId],
      sizing.maxWidth !== undefined ? sizing.maxWidth : maxWidthById.value[columnId]
    );

    widthById.value = {
      ...widthById.value,
      [columnId]: nextSizing.width
    };
    minWidthById.value = {
      ...minWidthById.value,
      [columnId]: nextSizing.minWidth
    };
    maxWidthById.value = {
      ...maxWidthById.value,
      [columnId]: nextSizing.maxWidth
    };
    persistSnapshot();
  }

  return {
    columnOrder,
    orderedColumns,
    visibleColumns,
    pinnedLeftColumns,
    centerColumns,
    pinnedRightColumns,
    getSnapshot,
    setColumnOrder,
    setColumnVisibility,
    setColumnPin,
    setColumnSizing
  };
}
