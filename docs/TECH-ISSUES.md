# Technical Issues & Edge Cases Review

**Review Date**: 2026-03-07  
**Reviewer**: AI Code Review  
**Scope**: Row Expansion Feature Implementation

---

## Critical Issues 🔴

### 1. Missing `rowExpandable` Option in Composable
**Location**: `src/composables/useIoiTable.ts`  
**Issue**: The composable doesn't accept or use `rowExpandable` option, only the component does.

**Current Code**:
```typescript
// useIoiTable.ts - missing from IoiTableOptions
export interface IoiTableOptions<TRow = Record<string, unknown>> {
  // ... other options
  expandable?: boolean;
  rowExpandable?: (row: TRow, index: number) => boolean; // ✅ Present
  expandedRowKeys?: Array<string | number>;
  onRowExpand?: (payload: IoiRowExpandPayload<TRow>) => void;
}
```

**Problem**: In `expandAllRows()`, we check `resolvedOptions.value.rowExpandable`, but this is only passed from component, not available in composable API.

**Impact**: Users of `useIoiTable()` composable cannot use `expandAllRows()` with conditional expansion.

**Fix Required**: Ensure `rowExpandable` is properly used throughout composable.

---

### 2. No Validation of Duplicate Keys in `expandedRowKeys`
**Location**: `src/composables/useIoiTable.ts:1218-1243`  
**Issue**: `toggleRowExpansion()` doesn't prevent duplicate keys.

**Current Code**:
```typescript
function toggleRowExpansion(key: string | number): void {
  const currentKeys = state.value.expandedRowKeys;
  const isExpanded = currentKeys.includes(key);
  const nextKeys = isExpanded
    ? currentKeys.filter((expandedKey) => expandedKey !== key)
    : [...currentKeys, key]; // Could create duplicates if called rapidly
```

**Impact**: Rapid toggling could create duplicate keys in array.

**Fix Required**: Use Set or deduplicate after toggle.

---

### 3. Missing `onRowExpand` Callback in `expandAllRows` and `collapseAllRows`
**Location**: `src/composables/useIoiTable.ts:1246-1270`  
**Issue**: These methods don't emit `onRowExpand` callbacks for each row.

**Current Code**:
```typescript
function expandAllRows(): void {
  const allKeys = sortedIndices.value
    .filter((idx) => {
      if (resolvedOptions.value.rowExpandable) {
        const row = normalizedRows.value[idx];
        return resolvedOptions.value.rowExpandable(row, idx);
      }
      return true;
    })
    .map((idx) => resolveSelectionKeyByIndex(idx))
    .filter((key): key is string | number => key !== null);

  state.value = {
    ...state.value,
    expandedRowKeys: allKeys
  };
  // ❌ No callbacks emitted
}
```

**Impact**: Users won't be notified when rows are expanded/collapsed via bulk operations.

**Fix Required**: Emit `onRowExpand` for each affected row, or add bulk callback.

---

## High Priority Issues 🟡

### 4. No Persistence of Expansion State Across Data Changes
**Location**: Missing watch in `src/composables/useIoiTable.ts`  
**Issue**: When rows change, expanded keys pointing to removed rows stay in state.

**Current Behavior**: Similar to selection, but no cleanup watch exists for expansion.

**Expected**: Should clean up expanded keys when rows are removed.

**Fix Required**: Add watch similar to selection cleanup:
```typescript
watch(
  [() => normalizedRows.value, () => resolvedOptions.value.rowKey],
  () => {
    if (state.value.expandedRowKeys.length === 0) {
      return;
    }

    const availableKeys = new Set(collectSelectionKeys(baseIndices.value));
    const nextExpandedKeys = state.value.expandedRowKeys.filter((key) => availableKeys.has(key));

    if (nextExpandedKeys.length !== state.value.expandedRowKeys.length) {
      state.value = {
        ...state.value,
        expandedRowKeys: nextExpandedKeys
      };
    }
  },
  { flush: 'sync' }
);
```

---

### 5. Missing Keyboard Navigation for Expansion
**Location**: `src/components/IoiTable.vue:681-718`  
**Issue**: `onRowKeydown` only handles selection, not expansion.

**Current Code**:
```typescript
function onRowKeydown(event: KeyboardEvent, row: TRow, rowIndex: number): void {
  const key = event.key;
  if (key === 'Enter' || key === ' ') {
    const rowKey = resolveRowSelectionKey(row, rowIndex);
    if (rowKey === null) {
      return;
    }

    event.preventDefault();
    table.toggleRow(rowKey, { shiftKey: event.shiftKey }); // ❌ Only toggles selection
    return;
  }
```

**Expected**: Should toggle expansion when `expandable` is true.

**Fix Required**: Add expansion keyboard support:
```typescript
if (key === 'Enter' || key === ' ') {
  const rowKey = resolveRowSelectionKey(row, rowIndex);
  if (rowKey === null) return;

  if (props.expandable && isRowExpandable(row, rowIndex)) {
    event.preventDefault();
    toggleRowExpansion(row, rowIndex);
    return;
  }

  if (selectionEnabled.value) {
    event.preventDefault();
    table.toggleRow(rowKey, { shiftKey: event.shiftKey });
  }
}
```

---

### 6. Expand Icon Button Missing Type and Disabled State
**Location**: `src/components/IoiTable.vue` (template)  
**Issue**: Expand icon button doesn't handle disabled state or proper type.

**Current Template**:
```vue
<button
  v-if="isRowExpandable(entry.row, entry.rowIndex)"
  type="button"
  class="ioi-table__expand-icon"
  :aria-label="isRowExpanded(entry.row, entry.rowIndex) ? 'Collapse row' : 'Expand row'"
  @click.stop="toggleRowExpansion(entry.row, entry.rowIndex)"
>
  {{ isRowExpanded(entry.row, entry.rowIndex) ? '▼' : '▶' }}
</button>
```

**Missing**: 
- No `disabled` prop support
- No visual feedback for loading state
- No focus ring styles

**Fix Required**: Add proper button states and styling hooks.

---

### 7. No Controlled Mode Synchronization
**Location**: `src/composables/useIoiTable.ts`  
**Issue**: When `expandedRowKeys` prop changes, state doesn't update.

**Current Code**: Initial value is set, but no watch to sync changes.

**Expected**: Should watch for prop changes like pagination does.

**Fix Required**: Add watch for controlled `expandedRowKeys`:
```typescript
watch(
  () => resolvedOptions.value.expandedRowKeys,
  (nextKeys) => {
    if (nextKeys !== undefined) {
      state.value = {
        ...state.value,
        expandedRowKeys: [...nextKeys]
      };
    }
  },
  { flush: 'sync' }
);
```

---

## Medium Priority Issues 🟠

### 8. Missing TypeScript Strict Null Checks in Template
**Location**: `src/components/IoiTable.vue` (template)  
**Issue**: Template accesses `entry.row` and `entry.rowIndex` without null checks.

**Current Template**:
```vue
<template #expanded-row="{ row, rowIndex }">
  <!-- row and rowIndex could be undefined in strict mode -->
</template>
```

**Fix Required**: Add proper type guards or default values.

---

### 9. No Expansion State in `resetState()`
**Location**: `src/composables/useIoiTable.ts` (resetState function)  
**Issue**: `resetState()` doesn't clear expansion state.

**Current Behavior**: Expansion persists after reset.

**Expected**: Should clear `expandedRowKeys`.

**Fix Required**: Update `resetState()` to include expansion.

---

### 10. Missing Expansion Methods in Expose
**Location**: `src/components/IoiTable.vue:788-817`  
**Issue**: Not all expansion methods are exposed.

**Currently Exposed**:
```typescript
defineExpose({
  toggleRowExpansion: table.toggleRowExpansion,
  expandAllRows: table.expandAllRows,
  collapseAllRows: table.collapseAllRows,
  isRowExpanded: table.isRowExpanded,
  // ... other methods
});
```

**Missing**: Documentation of what's exposed, type safety.

---

### 11. No Performance Optimization for Large Datasets
**Location**: Expansion rendering in template  
**Issue**: Expanded rows are rendered immediately, not lazy-loaded.

**Current Template**:
```vue
<tr
  v-for="entry in visibleRowEntries.filter(e => isRowExpanded(e.row, e.rowIndex))"
  :key="`expanded-${resolveRowKey(entry.row, entry.rowIndex)}`"
  class="ioi-table__expanded-row"
>
```

**Impact**: All expanded rows render even when off-screen.

**Fix Required**: Implement lazy rendering with IntersectionObserver or only render visible expanded rows.

---

### 12. Missing ARIA Attributes for Expand Icon
**Location**: Template expand icon button  
**Issue**: Missing `aria-controls` and `aria-expanded` on button.

**Current**:
```vue
<button
  class="ioi-table__expand-icon"
  :aria-label="..."
>
```

**Expected**:
```vue
<button
  class="ioi-table__expand-icon"
  :aria-label="..."
  :aria-expanded="isRowExpanded(entry.row, entry.rowIndex)"
  :aria-controls="`expanded-row-${resolveRowKey(entry.row, entry.rowIndex)}`"
>
```

---

## Low Priority Issues 🔵

### 13. Hardcoded Expand Icon Characters
**Location**: Template  
**Issue**: Uses Unicode characters (▶, ▼) instead of configurable icons.

**Current**:
```vue
{{ isRowExpanded(entry.row, entry.rowIndex) ? '▼' : '▶' }}
```

**Fix**: Add icon slots or props for custom icons.

---

### 14. No Expansion Animation
**Location**: CSS  
**Issue**: No transition/animation for expand/collapse.

**Expected**: Smooth height transition.

**Fix Required**: Add CSS transition classes.

---

### 15. Missing Expansion State in Semantic Events
**Location**: Event emission  
**Issue**: No semantic event emitted for expansion state changes.

**Expected**: Should emit `data:explore` or similar event with `schemaVersion`.

---

## Test Coverage Gaps

### Missing Test Cases:

1. **Expansion with virtualization** - No test for expanded rows affecting scroll position
2. **Expansion performance** - No test with 1000+ rows
3. **Expansion with dynamic row height** - No test for variable height expanded content
4. **Expansion state persistence** - No test for state preservation across remounts
5. **Concurrent expansion** - No test for rapid toggling
6. **Expansion with row removal** - No test for removing expanded rows
7. **Expansion with row addition** - No test for adding rows while expanded
8. **Accessibility** - No test for keyboard navigation
9. **Screen reader** - No test for ARIA attributes
10. **Edge case**: Expansion with null/undefined row keys

---

## Documentation Gaps

### Missing Documentation:

1. **Expansion with filtering** - How expansion behaves when rows are filtered out
2. **Expansion with sorting** - How expansion state is preserved during sort
3. **Expansion with pagination** - How expansion works across pages
4. **Performance considerations** - Guidelines for large datasets
5. **Styling guide** - How to style expanded rows
6. **Accessibility guide** - Keyboard navigation and ARIA
7. **Migration guide** - If coming from other table libraries
8. **Best practices** - When to use expansion vs detail view

---

## API Consistency Issues

### Inconsistencies Found:

1. **Method naming**: `toggleRowExpansion` vs `toggleRow` (selection) - should be consistent
2. **State naming**: `expandedRowKeys` vs `selectedRowKeys` - ✅ Consistent
3. **Callback naming**: `onRowExpand` vs `onRowClick` - ✅ Consistent
4. **Slot naming**: `expanded-row` vs `cell` - ✅ Consistent

---

## Performance Concerns

### Potential Issues:

1. **O(n) lookup in `isRowExpanded`**: Uses `Array.includes()` on every row render
   - **Impact**: O(n) per row, O(n²) total for table
   - **Fix**: Use Set for O(1) lookup

2. **No memoization of `isRowExpandable`**: Function called on every render
   - **Fix**: Cache result per row

3. **Expanded row filtering**: `visibleRowEntries.filter()` runs on every render
   - **Fix**: Use computed property

---

## Recommendations

### Immediate Actions (Critical):

1. ✅ Add keyboard navigation for expansion
2. ✅ Add controlled mode synchronization watch
3. ✅ Add cleanup watch for removed rows
4. ✅ Fix `expandAllRows` to emit callbacks
5. ✅ Add `aria-controls` and `aria-expanded` to button

### Short Term (This Week):

1. Add missing test cases (virtualization, performance, accessibility)
2. Optimize `isRowExpanded` with Set
3. Add expansion state to `resetState()`
4. Document expansion behavior with filtering/sorting/pagination

### Medium Term (Next Sprint):

1. Add expansion animations
2. Add custom icon support
3. Add lazy rendering for expanded content
4. Create comprehensive accessibility guide
5. Add performance benchmarks

---

## Summary

**Total Issues Found**: 15  
**Critical**: 3  
**High Priority**: 4  
**Medium Priority**: 5  
**Low Priority**: 3  

**Test Coverage Gaps**: 10 areas  
**Documentation Gaps**: 8 areas  

**Overall Assessment**: Feature is functional but needs polish for production readiness. Core logic is sound, but edge cases and accessibility need attention.

**Recommended Action**: Address critical issues before moving to next feature, then tackle high priority items in parallel with next feature development.
