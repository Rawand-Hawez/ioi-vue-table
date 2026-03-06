# Phase 1: Core Features Implementation

**Start Date**: 2026-03-07  
**Status**: In Progress  
**Target**: 4-6 weeks  
**Branch**: develop

---

## Overview

Phase 1 implements the three core features required for v1.0.0 MVP:
1. Row Expansion
2. Grouping & Aggregation
3. Server-Side Mode

---

## Feature Branches

```
develop (integration branch)
  ├── feature/row-expansion
  ├── feature/grouping-aggregation
  └── feature/server-mode
```

---

## Feature 1: Row Expansion

**Branch**: `feature/row-expansion`  
**Duration**: 1-2 weeks  
**Status**: Not Started  
**Dependencies**: None

### Requirements

#### Core Functionality
- [ ] Expandable detail rows with lazy rendering
- [ ] Expand/collapse individual rows
- [ ] Expand/collapse all functionality
- [ ] Controlled expansion state (v-model)
- [ ] Slot for expanded row content

#### API Design

**Props:**
```typescript
interface TableProps {
  expandable?: boolean;
  expandedRowKeys?: Set<string | number>;
  rowExpandable?: (row: T) => boolean;
}
```

**Events:**
```typescript
interface TableEvents {
  'update:expandedRowKeys': (keys: Set<string | number>) => void;
  'row-expand': (row: T, expanded: boolean) => void;
}
```

**Slots:**
```typescript
interface TableSlots {
  'expanded-row': (props: { row: T; index: number }) => VNode;
}
```

#### Implementation Tasks

**State Management:**
- [ ] Add expansion state to table state
- [ ] Create `expandedRowKeys` ref (Set<string | number>)
- [ ] Implement `toggleRowExpansion(key)` method
- [ ] Implement `expandAll()` method
- [ ] Implement `collapseAll()` method
- [ ] Implement `isRowExpanded(key)` method

**UI Components:**
- [ ] Add expand/collapse icon to row
- [ ] Create expanded row slot
- [ ] Implement lazy rendering for expanded content
- [ ] Handle expand icon visibility (rowExpandable)

**Integration:**
- [ ] Integrate with virtualization
- [ ] Handle keyboard navigation (Enter to toggle)
- [ ] Add ARIA attributes (aria-expanded)
- [ ] Emit semantic events

**Testing:**
- [ ] Unit tests for expansion state
- [ ] Unit tests for toggle methods
- [ ] Integration tests with virtualization
- [ ] Accessibility tests
- [ ] Visual regression tests

**Documentation:**
- [ ] Update API documentation
- [ ] Add usage examples
- [ ] Add to playground demo
- [ ] Update TypeScript types

### Acceptance Criteria
- [ ] Rows expand/collapse smoothly
- [ ] Expanded content renders lazily
- [ ] State can be controlled externally via v-model
- [ ] Keyboard accessible (Enter to toggle)
- [ ] Works with virtualization
- [ ] ARIA attributes properly set
- [ ] Tests pass with >85% coverage
- [ ] Documentation complete

---

## Feature 2: Grouping & Aggregation

**Branch**: `feature/grouping-aggregation`  
**Duration**: 2-3 weeks  
**Status**: Not Started  
**Dependencies**: Row expansion (for collapsible groups)

### Requirements

#### Core Functionality
- [ ] Basic 1-level collapsible grouping
- [ ] Group-by column configuration
- [ ] Aggregations: sum, avg, count, min, max
- [ ] Group header styling hooks
- [ ] Group expand/collapse state

#### API Design

**Props:**
```typescript
interface TableProps {
  groupBy?: string | string[];
  groupAggregations?: Record<string, AggregationType[]>;
  expandedGroupKeys?: Set<string>;
}

type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
```

**Types:**
```typescript
interface GroupHeader {
  key: string;
  value: any;
  count: number;
  aggregations: Record<string, number>;
}
```

**Slots:**
```typescript
interface TableSlots {
  'group-header': (props: { 
    group: GroupHeader; 
    expanded: boolean 
  }) => VNode;
}
```

#### Implementation Tasks

**Grouping Logic:**
- [ ] Implement group calculation algorithm
- [ ] Create group key generation
- [ ] Handle nested path grouping
- [ ] Sort groups alphabetically or by value
- [ ] Calculate group counts

**Aggregation Functions:**
- [ ] Implement sum aggregation
- [ ] Implement avg aggregation
- [ ] Implement count aggregation
- [ ] Implement min aggregation
- [ ] Implement max aggregation
- [ ] Handle null/undefined values in aggregations

**State Management:**
- [ ] Add grouping state to table state
- [ ] Create `expandedGroupKeys` ref
- [ ] Implement `toggleGroupExpansion(key)` method
- [ ] Implement `expandAllGroups()` method
- [ ] Implement `collapseAllGroups()` method

**UI Components:**
- [ ] Render group headers
- [ ] Add expand/collapse icon to group headers
- [ ] Display aggregation values in headers
- [ ] Style group rows differently
- [ ] Handle group header slot

**Integration:**
- [ ] Integrate with sorting (sort within groups)
- [ ] Integrate with filtering (filter within groups)
- [ ] Integrate with selection (select within groups)
- [ ] Handle virtualization with groups
- [ ] Emit semantic events

**Testing:**
- [ ] Unit tests for grouping logic
- [ ] Unit tests for aggregation functions
- [ ] Integration tests with sorting/filtering
- [ ] Edge case tests (empty groups, null values)
- [ ] Performance tests (large datasets)

**Documentation:**
- [ ] Update API documentation
- [ ] Add grouping examples
- [ ] Add aggregation examples
- [ ] Add to playground demo

### Acceptance Criteria
- [ ] Groups calculated correctly
- [ ] Aggregations accurate
- [ ] Groups collapsible
- [ ] Works with sorting/filtering
- [ ] Group headers customisable
- [ ] Handles edge cases
- [ ] Tests pass with >85% coverage
- [ ] Documentation complete

---

## Feature 3: Server-Side Mode

**Branch**: `feature/server-mode`  
**Duration**: 2-3 weeks  
**Status**: Not Started  
**Dependencies**: None

### Requirements

#### Core Functionality
- [ ] Page-based pagination
- [ ] Cursor-based pagination
- [ ] Infinite scroll with fetchMore
- [ ] Debounced sort/filter/search to backend
- [ ] Loading states (skeleton rows, spinners)
- [ ] Error handling with retry
- [ ] Server-side grouping flag

#### API Design

**Props:**
```typescript
interface TableProps {
  serverMode?: boolean;
  serverData?: ServerDataAdapter;
  paginationMode?: 'page' | 'cursor' | 'infinite';
  debounceMs?: number;
}
```

**Types:**
```typescript
interface ServerDataAdapter {
  fetch: (params: ServerQueryParams) => Promise<ServerResponse>;
  fetchMore?: (cursor: string) => Promise<ServerResponse>;
}

interface ServerQueryParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: SortParam[];
  filter?: FilterParam[];
  search?: string;
}

interface ServerResponse {
  rows: T[];
  totalCount?: number;
  hasNextPage?: boolean;
  cursor?: string;
  error?: string;
}
```

**Events:**
```typescript
interface TableEvents {
  'server-error': (error: Error) => void;
  'server-loading': (loading: boolean) => void;
}
```

#### Implementation Tasks

**Server Mode Architecture:**
- [ ] Design server mode state management
- [ ] Create data adapter interface
- [ ] Implement query params builder
- [ ] Handle server vs client mode switching

**Pagination Modes:**
- [ ] Implement page-based pagination
- [ ] Implement cursor-based pagination
- [ ] Implement infinite scroll
- [ ] Handle pagination controls
- [ ] Display pagination info

**Debouncing:**
- [ ] Implement debounced query builder
- [ ] Debounce sort operations
- [ ] Debounce filter operations
- [ ] Debounce search operations
- [ ] Cancel pending requests on new requests

**Loading States:**
- [ ] Add loading prop/state
- [ ] Create skeleton row component
- [ ] Show loading spinner
- [ ] Disable interactions during loading
- [ ] Handle concurrent requests

**Error Handling:**
- [ ] Catch and display errors
- [ ] Implement retry mechanism
- [ ] Show error UI
- [ ] Emit error events
- [ ] Allow manual retry

**Integration:**
- [ ] Integrate with existing sort/filter/search
- [ ] Disable client-side operations in server mode
- [ ] Handle server-side grouping flag
- [ ] Emit semantic events

**Testing:**
- [ ] Unit tests for query builder
- [ ] Unit tests for pagination modes
- [ ] Integration tests with mock server
- [ ] Error handling tests
- [ ] Loading state tests

**Documentation:**
- [ ] Create server integration guide
- [ ] Add API documentation
- [ ] Create example implementations
- [ ] Add backend integration examples
- [ ] Document best practices

### Acceptance Criteria
- [ ] Server mode works with all pagination types
- [ ] Debouncing prevents excessive requests
- [ ] Loading states display correctly
- [ ] Errors handled gracefully
- [ ] Works with existing features
- [ ] Tests pass with >85% coverage
- [ ] Integration examples provided
- [ ] Documentation complete

---

## Integration Order

### Recommended Sequence

1. **Week 1-2: Row Expansion**
   - Foundation feature
   - No dependencies
   - Quick win to build momentum

2. **Week 3-4: Grouping & Aggregation**
   - Builds on row expansion
   - More complex logic
   - High value feature

3. **Week 5-6: Server-Side Mode**
   - Independent feature
   - Most complex integration
   - High production value

### Parallel Work Opportunities

Some tasks can be parallelized:
- **Documentation** can be written alongside implementation
- **Testing** can start as features are developed
- **Playground demos** can be built incrementally

---

## Success Metrics

### Feature Completion
- [ ] All 3 features implemented
- [ ] All acceptance criteria met
- [ ] Test coverage >85%
- [ ] Documentation complete
- [ ] Playground demos available

### Quality Metrics
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Accessibility compliant
- [ ] TypeScript strict mode passes
- [ ] All tests passing

### Integration Metrics
- [ ] Features work together
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Clean API surface

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Virtualization + expansion complexity | High | Early testing, clear constraints |
| Grouping performance with large datasets | Medium | Optimise group calculations, benchmark |
| Server mode edge cases | Medium | Comprehensive testing, error handling |
| Feature integration conflicts | Low | Integration testing, clear interfaces |

### Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Underestimating complexity | Medium | Buffer time, early prototyping |
| Dependencies between features | Low | Clear sequence, modular design |
| Testing delays | Low | Test-driven development |

---

## Next Steps

### Immediate (This Week)
1. [ ] Start row expansion implementation
2. [ ] Create expansion state management
3. [ ] Implement basic toggle functionality
4. [ ] Add to playground for testing

### Week 2
1. [ ] Complete row expansion UI
2. [ ] Add keyboard navigation
3. [ ] Write tests
4. [ ] Document API

### Week 3-4
1. [ ] Start grouping & aggregation
2. [ ] Implement grouping logic
3. [ ] Add aggregation functions
4. [ ] Integrate with expansion

### Week 5-6
1. [ ] Start server-side mode
2. [ ] Implement pagination modes
3. [ ] Add error handling
4. [ ] Create integration examples

---

## Related Documents

- [v1.0-PLAN.md](./v1.0-PLAN.md) - Overall implementation plan
- [PHASE0-PROGRESS.md](./PHASE0-PROGRESS.md) - Phase 0 completion
- [ROADMAP.md](./ROADMAP.md) - Project roadmap
- [SPEC.md](./SPEC.md) - Feature specification

---

## Changelog

### 2026-03-07
- Phase 1 kickoff
- Created feature branches
- Documented all three features
- Ready to start row expansion
