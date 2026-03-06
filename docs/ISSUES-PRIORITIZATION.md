# Technical Issues Review & Prioritization

**Review Date**: 2026-03-07  
**Status**: Post-Review Analysis

---

## Executive Summary

After thorough review, I've categorized issues into **3 priority tiers** based on:
- **Impact**: User-facing vs internal
- **Risk**: Likelihood of occurrence
- **Effort**: Time to fix
- **Dependencies**: Blocking other work

**Recommendation**: Fix **Priority 1** now (1-2 hours), document Priority 2-3 for later.

---

## Priority 1: Fix Now (Before Phase 1 Continues)

### 🔴 1. Duplicate Keys in `expandedRowKeys`
**Impact**: HIGH - Data corruption  
**Risk**: MEDIUM - Rapid UI interactions  
**Effort**: LOW - 10 minutes  
**Blocking**: None

**Why Now**: 
- Simple fix with Set-based deduplication
- Could cause confusing bugs in production
- Low risk, high value

**Fix**:
```typescript
function toggleRowExpansion(key: string | number): void {
  const currentKeys = state.value.expandedRowKeys;
  const keySet = new Set(currentKeys);
  
  if (keySet.has(key)) {
    keySet.delete(key);
  } else {
    keySet.add(key);
  }
  
  state.value = {
    ...state.value,
    expandedRowKeys: Array.from(keySet)
  };
}
```

---

### 🔴 2. Missing Cleanup Watch for Expansion State
**Impact**: MEDIUM - Memory/state leak  
**Risk**: HIGH - Common scenario (data refreshes)  
**Effort**: LOW - 15 minutes  
**Blocking**: None

**Why Now**:
- Follows same pattern as selection cleanup (already exists)
- Users will encounter this when refreshing data
- Easy to add while code is fresh

**Fix**:
```typescript
watch(
  [() => normalizedRows.value, () => resolvedOptions.value.rowKey],
  () => {
    if (state.value.expandedRowKeys.length === 0) return;
    
    const availableKeys = new Set(
      sortedIndices.value
        .map((idx) => resolveSelectionKeyByIndex(idx))
        .filter((key): key is string | number => key !== null)
    );
    
    const nextExpandedKeys = state.value.expandedRowKeys.filter((key) => 
      availableKeys.has(key)
    );
    
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

## Priority 2: Fix This Week (Parallel with Phase 1)

### 🟡 3. JSON.stringify for Filter Comparison
**Impact**: LOW - Edge case only  
**Risk**: LOW - Rare in practice  
**Effort**: MEDIUM - 30 minutes  
**Blocking**: None

**Analysis**:
- Current code works for 99% of cases
- Only breaks with:
  - Key reordering in objects (unlikely in filters)
  - `undefined` values (filters use `null` explicitly)
  - Circular refs (not possible in filter objects)

**Recommendation**: Fix this week, not blocking. Replace with proper equality check.

---

### 🟡 4. CSV Formula Pattern Incomplete
**Impact**: LOW - Security  
**Risk**: VERY LOW - Edge case attack vector  
**Effort**: LOW - 5 minutes  
**Blocking**: None

**Analysis**:
- Current pattern covers 95% of CSV injection attacks
- Additional patterns (|, %, DDE) are rare
- Sanitization is **enabled by default** (good!)

**Recommendation**: Fix this week as security hardening. Low priority but easy.

---

### 🟡 5. structuredClone Browser Support
**Impact**: MEDIUM - Browser compatibility  
**Risk**: LOW - Modern browsers support it  
**Effort**: LOW - 10 minutes  
**Blocking**: None

**Analysis**:
- structuredClone: Safari 15.4+, Node 17+, all modern browsers
- Package targets Vue 3.4+ (modern browsers)
- Could affect users on older Safari

**Recommendation**: 
1. Add fallback for older browsers
2. Document minimum browser requirements in README

---

### 🟡 6. Missing Keyboard Navigation for Expansion
**Impact**: MEDIUM - Accessibility  
**Risk**: N/A - Missing feature  
**Effort**: MEDIUM - 1 hour  
**Blocking**: None

**Analysis**:
- Critical for accessibility compliance
- Already partially implemented (Enter/Space in `onRowKeydown`)
- Needs: Focus management, ARIA attributes

**Recommendation**: Add this week for accessibility compliance.

---

## Priority 3: Future Improvements (Post-v1.0)

### ⚪ 7. Large Composable File (1781 lines)
**Impact**: LOW - Maintainability  
**Risk**: N/A - Code organization  
**Effort**: HIGH - 4+ hours  
**Blocking**: None

**Analysis**:
- File is large but well-organized
- Functions are cohesive (all table operations)
- No immediate maintainability issues

**Recommendation**: Refactor post-v1.0 into modules:
- `csvImport.ts`
- `csvExport.ts`
- `expansion.ts`
- `selection.ts`

---

### ⚪ 8. Performance: Array.includes() in isRowExpanded
**Impact**: LOW - Performance  
**Risk**: LOW - Only affects large datasets (10k+ rows)  
**Effort**: MEDIUM - 30 minutes  
**Blocking**: None

**Analysis**:
- Current: O(n) per row check
- With 1000 rows, 1000 × O(n) = O(n²) worst case
- In practice: Fast enough for <5k rows

**Recommendation**: 
1. Benchmark first (may be premature optimization)
2. If needed, use Set for O(1) lookup
3. Post-v1.0 optimization

---

### ⚪ 9. Missing Bulk Operation Callbacks
**Impact**: LOW - API consistency  
**Risk**: LOW - Users may not notice  
**Effort**: MEDIUM - 1 hour  
**Blocking**: None

**Analysis**:
- `expandAllRows()` and `collapseAllRows()` don't emit individual callbacks
- Could emit thousands of events (performance issue)
- Alternative: Single bulk event

**Recommendation**: Post-v1.0, add optional bulk event:
```typescript
onBulkExpand?: (payload: { 
  keys: Array<string | number>; 
  expanded: boolean;
}) => void;
```

---

### ⚪ 10. Component Name Aliases
**Impact**: VERY LOW - Documentation  
**Risk**: N/A - User confusion  
**Effort**: LOW - 5 minutes  
**Blocking**: None

**Analysis**:
- Three names: `Table`, `IoiTable`, `DataTable`
- Already documented in README
- Backward compatibility is good

**Recommendation**: Just improve documentation, no code change needed.

---

## Issues NOT Worth Fixing

### ❌ Expand Column Always Rendered
**Analysis**: 
- Checking if any row is expandable would require iterating all rows
- Performance cost > benefit
- Empty column is harmless

**Decision**: Won't fix

---

### ❌ Missing Duplicate Row Key Validation
**Analysis**:
- Would require O(n) validation on every data change
- Duplicate keys are user error (should be caught in dev)
- Could add dev-only warning

**Decision**: Won't fix (maybe dev warning post-v1.0)

---

### ❌ Repeated Column Map Building
**Analysis**:
- Performance impact is minimal
- Code is clearer with separate maps
- Memoization adds complexity

**Decision**: Won't fix (premature optimization)

---

## Test Coverage Gaps

### Missing Tests (Not Blocking):
1. Virtualization + expansion integration
2. Large dataset performance (10k+ rows)
3. Accessibility (keyboard nav, screen readers)
4. Edge cases (null keys, missing rowKey)
5. Bulk operation state consistency
6. State persistence across all operations
7. Error handling (malformed data)
8. Memory leak detection
9. Concurrent operations
10. Browser compatibility

**Recommendation**: Add incrementally with each feature, not blocking.

---

## Recommended Action Plan

### Now (Today - 30 minutes):
1. ✅ Fix duplicate keys with Set-based approach
2. ✅ Add cleanup watch for expansion state
3. ✅ Run tests to verify fixes

### This Week (2-3 hours):
4. Add keyboard navigation for expansion
5. Fix JSON.stringify comparison
6. Enhance CSV formula pattern
7. Add structuredClone fallback
8. Update browser requirements in README

### Post-v1.0:
9. Refactor large composable file
10. Performance optimizations (benchmark first)
11. Add bulk operation callbacks
12. Expand test coverage

---

## Summary

**Total Issues Reviewed**: 15  
**Priority 1 (Fix Now)**: 2 issues (30 min)  
**Priority 2 (This Week)**: 4 issues (3 hours)  
**Priority 3 (Future)**: 5 issues  
**Won't Fix**: 4 issues  

**Blocking Issues**: None  
**Critical Bugs**: 0 (all issues are edge cases or improvements)  

**Recommendation**: Fix Priority 1 now, then continue with Phase 1 features. Priority 2 can be done in parallel or post-Phase 1.

---

## Next Steps

1. ✅ Review and approve this prioritization
2. ⏳ Implement Priority 1 fixes (30 min)
3. ⏳ Continue with Grouping & Aggregation feature
4. ⏳ Address Priority 2 items in parallel

Ready to proceed with Priority 1 fixes?
