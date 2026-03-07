# useIoiTable Refactoring Plan

## Executive Summary

**Current State:** `useIoiTable.ts` is 1,905 lines with mixed concerns
**Target State:** Modular architecture with ~15 focused modules
**Estimated Effort:** 3-4 days
**Risk Level:** Medium (requires careful dependency management)

---

## Current Analysis

### File Breakdown by Concern

| Concern | Lines | Functions | Complexity |
|---------|-------|-----------|------------|
| CSV Export | ~120 | `resolveExportColumns`, `exportCSV` | Medium |
| CSV Import | ~350 | `parseCSV`, `commitCSVImport`, helpers | High |
| Filtering | ~150 | `setColumnFilter`, `clearColumnFilter`, `setGlobalSearch`, `clearAllFilters` | Medium |
| Sorting | ~50 | `setSortState`, `toggleSort` | Low |
| Pagination | ~100 | `setPageIndex`, `setPageSize`, watchers | Medium |
| Selection | ~150 | `toggleRow`, `isSelected`, `selectAll`, `clearSelection` | Medium |
| Editing | ~120 | `startEdit`, `setEditDraft`, `commitEdit`, `cancelEdit` | Medium |
| Expansion | ~80 | `toggleRowExpansion`, `expandAllRows`, `collapseAllRows`, `isRowExpanded` | Low |
| Grouping | ~50 | `toggleGroupExpansion`, `expandAllGroups`, `collapseAllGroups`, `isGroupExpanded` | Low |
| Virtualization | ~80 | `setViewport`, `scrollToRow` | Medium |
| State Management | ~150 | watchers, normalization, `resetState` | High |
| Core/Orchestration | ~300 | computed properties, initialization, API assembly | High |

### Existing Extracted Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `constants.ts` | 12 | Default values, patterns |
| `state.ts` | 17 | Initial state factory |
| `utils.ts` | 65 | Pure utility functions |
| `events.ts` | 14 | Semantic event creation |
| `selection.ts` | 16 | Key normalisation |
| `pagination.ts` | 20 | Payload builder |
| `editing.ts` | 5 | Validation message resolver |
| `csv.ts` | 333 | CSV encoding/parsing utilities |
| `grouping.ts` | 116 | Group calculation logic |

---

## Proposed Module Structure

```
composables/
├── useIoiTable.ts              # Thin orchestrator (~200 lines)
└── ioiTable/
    ├── index.ts                # Public barrel export
    ├── constants.ts            # ✅ exists (no changes)
    ├── state.ts                # ✅ exists (enhance)
    ├── types.ts                # 🆕 Internal types
    ├── utils.ts                # ✅ exists (enhance)
    ├── events.ts               # ✅ exists (no changes)
    │
    ├── # Feature Modules
    ├── filtering.ts            # 🆕 Filter management
    ├── sorting.ts              # 🆕 Sort management
    ├── pagination.ts           # ✅ exists (enhance)
    ├── selection.ts            # ✅ exists (enhance)
    ├── editing.ts              # ✅ exists (enhance)
    ├── expansion.ts            # 🆕 Row expansion
    ├── grouping.ts             # ✅ exists (no changes)
    │
    ├── # CSV Modules
    ├── csv.ts                  # ✅ exists (no changes)
    ├── csvExport.ts            # 🆕 Export logic
    ├── csvImport.ts            # 🆕 Import logic
    │
    ├── # Core Modules
    ├── virtualization.ts       # 🆕 Viewport/scroll
    ├── data.ts                 # 🆕 Row/column management
    └── facets.ts               # 🆕 Facet options
```

---

## Detailed Module Specifications

### 1. `types.ts` (NEW) — Internal Type Definitions

**Purpose:** Shared internal types not exposed in public API

```typescript
// Internal types used across modules
export interface ExportColumn {
  fieldPath: string;
  header: string;
}

export interface ImportColumnBinding<TRow> {
  columnId: string;
  field: string;
  header: string;
  column: Pick<ColumnDef<TRow>, 'type' | 'validate'>;
}

export interface ParsedCsvImportSession<TRow> {
  delimiter: CsvDelimiter;
  hasHeader: boolean;
  headers: string[];
  dataRows: string[][];
  previewRowLimit: number;
  maxColumnCount: number;
  columns: ImportColumnBinding<TRow>[];
  mapping: CsvImportMapping;
}

export interface FilterDebounceTimers {
  column: Map<string, ReturnType<typeof setTimeout>>;
  globalSearch: ReturnType<typeof setTimeout> | null;
}
```

**Lines:** ~40
**Dependencies:** None

---

### 2. `filtering.ts` (NEW) — Filter Management

**Purpose:** All filter-related state and operations

```typescript
// Public API
export interface FilteringApi {
  setColumnFilter: (field: string, filter: ColumnFilter) => void;
  clearColumnFilter: (field: string) => void;
  setGlobalSearch: (text: string) => void;
  clearAllFilters: () => void;
  getColumnFacetOptions: (field: string) => string[];
}

export interface FilteringState {
  filters: Ref<FilterState[]>;
  globalSearch: Ref<string>;
}

export interface FilteringOptions {
  filterDebounceMs: number;
  globalSearchDebounceMs: number;
  onFilterChange?: (payload: FilterChangePayload) => void;
}

// Main factory function
export function createFiltering(
  state: Ref<IoiTableState>,
  columns: Ref<ColumnDef<TRow>[]>,
  rows: Ref<TRow[]>,
  options: FilteringOptions,
  emitEvent: EventEmitter
): {
  api: FilteringApi;
  state: FilteringState;
  cleanup: () => void;
}
```

**Extracted from useIoiTable.ts:**
- Lines 981-1001: Debounce timer management
- Lines 1007-1180: Filter functions
- Lines 823-901: `getColumnFacetOptions`

**Lines:** ~180
**Dependencies:** `utils.ts`, `events.ts`, external `filter.ts`

---

### 3. `sorting.ts` (NEW) — Sort Management

**Purpose:** Sort state and operations

```typescript
export interface SortingApi {
  setSortState: (sortState: SortState[]) => void;
  toggleSort: (field: string, multi?: boolean) => void;
}

export interface SortingOptions {
  onSortChange?: (sortState: SortState[]) => void;
}

export function createSorting(
  state: Ref<IoiTableState>,
  options: SortingOptions,
  emitEvent: EventEmitter
): SortingApi;
```

**Extracted from useIoiTable.ts:**
- Lines 952-979: `setSortState`
- Lines 1393-1396: `toggleSort`

**Lines:** ~60
**Dependencies:** `events.ts`, external `sort.ts`

---

### 4. `pagination.ts` (ENHANCED) — Pagination Management

**Current:** Only `buildPaginationPayload`
**Target:** Full pagination logic

```typescript
export interface PaginationApi {
  setPageIndex: (pageIndex: number, reason?: string) => void;
  setPageSize: (pageSize: number, reason?: string) => void;
}

export interface PaginationComputed {
  enabled: ComputedRef<boolean>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  pageCount: ComputedRef<number>;
}

export interface PaginationOptions {
  config: ComputedRef<IoiPaginationOptions | undefined>;
  onPaginationChange?: (payload: IoiPaginationChangePayload) => void;
}

export function createPagination(
  state: Ref<IoiTableState>,
  processedRowCount: ComputedRef<number>,
  options: PaginationOptions,
  emitEvent: EventEmitter
): {
  api: PaginationApi;
  computed: PaginationComputed;
  uncontrolledPageIndex: Ref<number>;
  uncontrolledPageSize: Ref<number>;
};
```

**Extracted from useIoiTable.ts:**
- Lines 425-455: Pagination computed properties
- Lines 751-821: `setPageIndex`, `setPageSize`, `notifyPaginationChange`
- Lines 903-934: Pagination watchers

**Lines:** ~120
**Dependencies:** `utils.ts`, `events.ts`

---

### 5. `selection.ts` (ENHANCED) — Selection Management

**Current:** Only `normalizeSelectedKeys`
**Target:** Full selection logic

```typescript
export interface SelectionApi {
  toggleRow: (key: string | number, options?: ToggleRowOptions) => void;
  isSelected: (key: string | number) => boolean;
  clearSelection: () => void;
  selectAll: (scope?: SelectAllScope) => void;
  getSelectedKeys: () => Array<string | number>;
}

export interface SelectionOptions {
  enabled: ComputedRef<boolean>;
  mode: ComputedRef<SelectionMode>;
  rowKey: IoiTableOptions['rowKey'];
  onSelectionChange?: (keys: Array<string | number>) => void;
}

export function createSelection(
  state: Ref<IoiTableState>,
  rows: Ref<TRow[]>,
  sortedIndices: ComputedRef<number[]>,
  baseIndices: ComputedRef<number[]>,
  visibleIndices: ComputedRef<number[]>,
  options: SelectionOptions,
  emitEvent: EventEmitter
): {
  api: SelectionApi;
  lastSelectedKey: Ref<string | number | null>;
  resolveRowKey: (row: TRow, index: number) => string | number | null;
};
```

**Extracted from useIoiTable.ts:**
- Lines 516-523: `warnSelectionDisabled`
- Lines 525-559: Key resolution functions
- Lines 589-604: `collectSelectionKeys`, `getSortedSelectionKeys`
- Lines 1182-1281: Selection API functions
- Lines 662-696: Selection cleanup watchers

**Lines:** ~180
**Dependencies:** `utils.ts`, `events.ts`

---

### 6. `editing.ts` (ENHANCED) — Cell Editing

**Current:** Only `resolveValidationMessage`
**Target:** Full editing logic

```typescript
export interface EditingApi {
  startEdit: (options: StartEditOptions) => void;
  setEditDraft: (value: unknown) => void;
  commitEdit: () => boolean;
  cancelEdit: () => void;
}

export interface EditingState {
  draft: Ref<unknown>;
  error: Ref<string | null>;
}

export interface EditingOptions {
  columns: Ref<ColumnDef<TRow>[]>;
  onCellCommit?: (payload: IoiCellCommitPayload<TRow>) => void;
  onRowUpdate?: (payload: IoiCellCommitPayload<TRow>) => void;
}

export function createEditing(
  state: Ref<IoiTableState>,
  rows: Ref<TRow[]>,
  resolveRowKey: (row: TRow, index: number) => string | number | null,
  options: EditingOptions,
  emitEvent: EventEmitter
): {
  api: EditingApi;
  state: EditingState;
  cleanup: () => void;
};
```

**Extracted from useIoiTable.ts:**
- Lines 561-578: `resolveEditRowIndex`
- Lines 580-587: `clearEditingState`
- Lines 1437-1546: Editing API functions
- Lines 698-713: Editing cleanup watcher

**Lines:** ~140
**Dependencies:** `utils.ts`, `events.ts`, `nestedPath.ts`

---

### 7. `expansion.ts` (NEW) — Row Expansion

**Purpose:** Row expand/collapse logic

```typescript
export interface ExpansionApi {
  toggleRowExpansion: (key: string | number) => void;
  expandAllRows: () => void;
  collapseAllRows: () => void;
  isRowExpanded: (key: string | number) => boolean;
}

export interface ExpansionOptions {
  expandable: ComputedRef<boolean>;
  rowExpandable?: (row: TRow, index: number) => boolean;
  onRowExpand?: (payload: IoiRowExpandPayload<TRow>) => void;
}

export function createExpansion(
  state: Ref<IoiTableState>,
  rows: Ref<TRow[]>,
  sortedIndices: ComputedRef<number[]>,
  resolveRowKey: (row: TRow, index: number) => string | number | null,
  options: ExpansionOptions
): ExpansionApi;
```

**Extracted from useIoiTable.ts:**
- Lines 1283-1345: Expansion API functions
- Lines 715-740: Expansion cleanup watcher

**Lines:** ~100
**Dependencies:** None

---

### 8. `groupExpansion.ts` (NEW) — Group Expansion

**Purpose:** Group expand/collapse logic (separate from row expansion)

```typescript
export interface GroupExpansionApi {
  toggleGroupExpansion: (groupKey: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  isGroupExpanded: (groupKey: string) => boolean;
}

export interface GroupExpansionOptions {
  onGroupExpand?: (payload: IoiGroupExpandPayload) => void;
}

export function createGroupExpansion(
  state: Ref<IoiTableState>,
  groups: ComputedRef<GroupInfo[]>,
  options: GroupExpansionOptions
): GroupExpansionApi;
```

**Extracted from useIoiTable.ts:**
- Lines 1347-1391: Group expansion API functions

**Lines:** ~60
**Dependencies:** `grouping.ts`

---

### 9. `csvExport.ts` (NEW) — CSV Export

**Purpose:** Export table data to CSV

```typescript
export interface CsvExportOptions extends ExportCsvOptions {
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  sortedIndices: ComputedRef<number[]>;
  visibleIndices: ComputedRef<number[]>;
  baseIndices: ComputedRef<number[]>;
  selectedRowKeys: ComputedRef<Array<string | number>>;
  selectionEnabled: ComputedRef<boolean>;
}

export function createCsvExport(
  options: CsvExportOptions,
  emitEvent: EventEmitter
): {
  exportCSV: (csvOptions?: ExportCsvOptions) => string;
};
```

**Extracted from useIoiTable.ts:**
- Lines 75-161: `resolveExportColumns`
- Lines 1548-1570: `resolveExportRowIndices`
- Lines 1572-1648: `exportCSV`

**Lines:** ~150
**Dependencies:** `csv.ts`, `events.ts`, `nestedPath.ts`, `utils.ts`

---

### 10. `csvImport.ts` (NEW) — CSV Import

**Purpose:** Parse and import CSV data

```typescript
export interface CsvImportApi {
  parseCSV: (source: CsvImportSource, options?: ParseCsvOptions) => Promise<CsvImportPreview<TRow>>;
  commitCSVImport: (mapping?: CsvImportMapping, options?: CommitCsvImportOptions) => CsvImportResult<TRow>;
}

export interface CsvImportDeps {
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  defaultPreviewRowLimit: ComputedRef<number>;
}

export function createCsvImport(
  deps: CsvImportDeps,
  emitEvent: EventEmitter
): CsvImportApi;
```

**Extracted from useIoiTable.ts:**
- Lines 80-96: `ImportColumnBinding`, `ParsedCsvImportSession`
- Lines 164-245: Import helper functions
- Lines 247-339: `buildCsvImportRows`
- Lines 341-351: `readCsvImportSource`
- Lines 1650-1767: `parseCSV`
- Lines 1769-1824: `commitCSVImport`

**Lines:** ~280
**Dependencies:** `csv.ts`, `events.ts`, `editing.ts`, `nestedPath.ts`

---

### 11. `virtualization.ts` (NEW) — Viewport Management

**Purpose:** Virtual scrolling calculations

```typescript
export interface VirtualizationApi {
  setViewport: (scrollTop: number, viewportHeight?: number) => void;
  scrollToRow: (index: number) => void;
}

export interface VirtualizationComputed {
  virtualRange: ComputedRef<VirtualRange>;
  virtualPaddingTop: ComputedRef<number>;
  virtualPaddingBottom: ComputedRef<number>;
  totalHeight: ComputedRef<number>;
}

export interface VirtualizationOptions {
  rowHeight: Ref<number>;
  overscan: Ref<number>;
  paginationEnabled: ComputedRef<boolean>;
  pageSize: ComputedRef<number>;
  pageIndex: ComputedRef<number>;
}

export function createVirtualization(
  state: Ref<IoiTableState>,
  processedRowCount: ComputedRef<number>,
  options: VirtualizationOptions
): {
  api: VirtualizationApi;
  computed: VirtualizationComputed;
};
```

**Extracted from useIoiTable.ts:**
- Lines 465-508: Virtualization computed properties
- Lines 1398-1435: `setViewport`, `scrollToRow`

**Lines:** ~100
**Dependencies:** `utils.ts`

---

### 12. `data.ts` (NEW) — Data Management

**Purpose:** Row and column data management

```typescript
export interface DataApi {
  setRows: (rows: TRow[]) => void;
  setColumns: (columns: ColumnDef<TRow>[]) => void;
  resetState: () => void;
}

export interface DataComputed {
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  totalRows: ComputedRef<number>;
  baseIndices: ComputedRef<number[]>;
  filteredIndices: ComputedRef<number[]>;
  sortedIndices: ComputedRef<number[]>;
  visibleIndices: ComputedRef<number[]>;
  visibleRows: ComputedRef<TRow[]>;
  columnKeyMap: ComputedRef<Map<string, ColumnDef<TRow>>>;
}

export function createDataManager(
  options: MaybeRef<IoiTableOptions<TRow>>,
  state: Ref<IoiTableState>,
  filterState: FilteringState,
  emitEvent: EventEmitter
): {
  api: DataApi;
  computed: DataComputed;
};
```

**Extracted from useIoiTable.ts:**
- Lines 356-390: Normalization and columnKeyMap
- Lines 392-496: Core computed properties
- Lines 606-660: Option watchers
- Lines 936-950: `setRows`, `setColumns`
- Lines 1826-1835: `resetState`

**Lines:** ~200
**Dependencies:** `state.ts`, `events.ts`, external `filter.ts`, `sort.ts`

---

### 13. `facets.ts` (NEW) — Facet Options

**Purpose:** Faceted filter options calculation (extracted from filtering for caching)

```typescript
export interface FacetsOptions {
  rows: Ref<TRow[]>;
  columns: Ref<ColumnDef<TRow>[]>;
  filters: Ref<FilterState[]>;
  globalSearch: Ref<string>;
}

export function createFacets(
  options: FacetsOptions
): {
  getColumnFacetOptions: (field: string) => string[];
  clearCache: () => void;
};
```

**Extracted from useIoiTable.ts:**
- Lines 823-901: `getColumnFacetOptions`

**Lines:** ~80
**Dependencies:** `utils.ts`, external `filter.ts`

---

## Implementation Order

### Phase 1: Foundation (Low Risk)
1. ✅ `types.ts` — No dependencies
2. ✅ `sorting.ts` — Simple, self-contained
3. ✅ `groupExpansion.ts` — Simple, self-contained

### Phase 2: Core Features (Medium Risk)
4. ✅ `virtualization.ts` — Depends only on utils
5. ✅ `expansion.ts` — Depends on row key resolution
6. ✅ `pagination.ts` — Enhance existing module
7. ✅ `facets.ts` — Extract from filtering

### Phase 3: Complex Features (Higher Risk)
8. ✅ `filtering.ts` — Depends on facets, debounce
9. ✅ `selection.ts` — Enhance existing, depends on key resolution
10. ✅ `editing.ts` — Enhance existing, depends on validation

### Phase 4: CSV (Self-Contained)
11. ✅ `csvExport.ts` — Depends on csv.ts
12. ✅ `csvImport.ts` — Depends on csv.ts, editing.ts

### Phase 5: Orchestration
13. ✅ `data.ts` — Brings together filtering, sorting
14. ✅ `useIoiTable.ts` — Thin orchestrator

---

## Migration Strategy

### Step 1: Create New Modules (Non-Breaking)

```bash
# Create new files alongside existing code
touch composables/ioiTable/types.ts
touch composables/ioiTable/sorting.ts
# ... etc
```

### Step 2: Extract & Test Incrementally

For each module:
1. Create module with extracted functions
2. Import and use in `useIoiTable.ts`
3. Run tests: `npm run ci`
4. Commit: `git commit -m "refactor: extract <module> from useIoiTable"`

### Step 3: Update Public API

Ensure `useIoiTable.ts` still exports identical API:

```typescript
// useIoiTable.ts - Final form
export function useIoiTable<TRow>(options): IoiTableApi<TRow> {
  const filtering = createFiltering(...);
  const sorting = createSorting(...);
  const pagination = createPagination(...);
  const selection = createSelection(...);
  const editing = createEditing(...);
  const expansion = createExpansion(...);
  const groupExpansion = createGroupExpansion(...);
  const csvExport = createCsvExport(...);
  const csvImport = createCsvImport(...);
  const virtualization = createVirtualization(...);
  const data = createDataManager(...);

  return {
    schemaVersion: SCHEMA_VERSION,
    ...data.computed,
    ...virtualization.computed,
    state: data.state,
    editingDraft: editing.state.draft,
    editingError: editing.state.error,
    lastEvent: events.lastEvent,
    paginationEnabled: pagination.computed.enabled,
    pageIndex: pagination.computed.pageIndex,
    pageSize: pagination.computed.pageSize,
    pageCount: pagination.computed.pageCount,
    groups: grouping.groups,
    actions: {
      ...data.api,
      ...filtering.api,
      ...sorting.api,
      ...pagination.api,
      ...selection.api,
      ...editing.api,
      ...expansion.api,
      ...groupExpansion.api,
      ...csvExport.api,
      ...csvImport.api,
      ...virtualization.api
    }
  };
}
```

---

## Testing Strategy

### Unit Tests Per Module

Each new module should have corresponding test file:

```
test/
├── ioiTable/
│   ├── filtering.spec.ts
│   ├── sorting.spec.ts
│   ├── pagination.spec.ts
│   ├── selection.spec.ts
│   ├── editing.spec.ts
│   ├── expansion.spec.ts
│   ├── groupExpansion.spec.ts
│   ├── csvExport.spec.ts
│   ├── csvImport.spec.ts
│   ├── virtualization.spec.ts
│   ├── data.spec.ts
│   └── facets.spec.ts
```

### Integration Tests

Keep existing `useIoiTable.spec.ts` to verify API compatibility:

```typescript
describe('useIoiTable API compatibility', () => {
  // All existing tests should pass without modification
});
```

### Coverage Targets

| Module | Target Coverage |
|--------|-----------------|
| filtering.ts | 90% |
| sorting.ts | 95% |
| pagination.ts | 90% |
| selection.ts | 90% |
| editing.ts | 85% |
| expansion.ts | 90% |
| csvExport.ts | 85% |
| csvImport.ts | 85% |
| virtualization.ts | 90% |
| data.ts | 85% |

---

## Risk Mitigation

### Risk 1: Circular Dependencies

**Mitigation:** 
- Use dependency injection pattern
- Pass dependencies as function parameters
- Keep types in separate `types.ts`

### Risk 2: Breaking Changes

**Mitigation:**
- Maintain exact same public API
- Run full test suite after each extraction
- Use TypeScript to catch API mismatches

### Risk 3: Performance Regression

**Mitigation:**
- Benchmark before/after using existing test suite
- Use `shallowRef` for reactive state
- Avoid unnecessary re-computation

---

## Success Criteria

1. ✅ `useIoiTable.ts` under 300 lines
2. ✅ All existing tests pass
3. ✅ No TypeScript errors
4. ✅ No runtime errors
5. ✅ Branch coverage ≥ 85%
6. ✅ Each module has single responsibility
7. ✅ Clear dependency graph (no cycles)

---

## Timeline

| Day | Tasks |
|-----|-------|
| 1 | Phase 1 + Phase 2 (sorting, groupExpansion, virtualization, expansion) |
| 2 | Phase 2 continued + Phase 3 (pagination, facets, filtering) |
| 3 | Phase 3 continued + Phase 4 (selection, editing, csvExport, csvImport) |
| 4 | Phase 5 + Testing + Documentation (data, orchestrator, final tests) |

---

## Next Steps

1. **Review this plan** — Confirm approach and priorities
2. **Create feature branch** — `refactor/split-useIoiTable`
3. **Begin Phase 1** — Start with low-risk extractions
4. **Iterate** — One module at a time with tests

Ready to proceed with implementation?
