# Test Coverage Report

**Generated**: 2026-04-13
**Version**: v0.2.5

## Summary

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| Statements | 85.8% | 85% | ✅ Pass |
| Branches | 79.55% | 79% | ✅ Pass |
| Functions | 93.56% | 85% | ✅ Pass |
| Lines | 85.8% | 85% | ✅ Pass |

## Detailed Coverage by Module

### Components

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| IoiTable.vue | 85.06% | 75.86% | 86.53% | 85.06% |

### Composables

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| useColumnState.ts | 94.33% | 85.59% | 100% | 94.33% |
| useIoiTable.ts | 84.48% | 74.17% | 91.17% | 84.48% |

### Composables (ioiTable/*)

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| constants.ts | 100% | 100% | 100% | 100% |
| csv.ts | 81.31% | 79.79% | 100% | 81.31% |
| editing.ts | 80% | 50% | 100% | 80% |
| events.ts | 100% | 100% | 100% | 100% |
| pagination.ts | 100% | 33.33% | 100% | 100% |
| selection.ts | 100% | 100% | 100% | 100% |
| state.ts | 100% | 100% | 100% | 100% |
| utils.ts | 76.92% | 76.19% | 100% | 76.92% |

### Utilities

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| filter.ts | 82.23% | 81.08% | 100% | 82.23% |
| nestedPath.ts | 92.59% | 92.1% | 100% | 92.59% |
| number.ts | 66.66% | 83.33% | 100% | 66.66% |
| sort.ts | 91.71% | 88.09% | 100% | 91.71% |

## Areas for Improvement

### High Priority (Low Coverage)

1. **number.ts** - 66.66% line coverage
   - Missing tests for edge cases in number utilities
   - Lines 9-10, 22-26, 37-41 uncovered

2. **editing.ts** - 50% branch coverage
   - Missing branch tests for editing workflow
   - Line 4 has uncovered branch

3. **utils.ts** - 76.92% line coverage
   - Missing tests for utility functions
   - Lines 44-45, 52-61, 63-64 uncovered

4. **csv.ts** - 81.31% line coverage
   - Missing tests for CSV operations
   - Lines 289-293, 312-327 uncovered

### Medium Priority

1. **pagination.ts** - 33.33% branch coverage
   - Missing branch tests for pagination logic
   - Lines 10-11 have uncovered branches

2. **IoiTable.vue** - 75.86% branch coverage
   - Missing branch tests for component logic
   - Multiple lines uncovered (see report)

## Running Coverage

```bash
npm --workspace @ioi-dev/vue-table run test:coverage
```

Coverage reports are generated in:
- `packages/vue-table/coverage/` - HTML report
- `packages/vue-table/coverage/lcov.info` - LCOV format for CI

## CI Integration

Coverage thresholds are enforced in CI:
- Statements: 85%
- Branches: 79%
- Functions: 85%
- Lines: 85%

Build will fail if coverage drops below these thresholds.

## Goals

- [ ] Increase branch coverage to 85% (currently 79.55%)
- [ ] Improve number.ts coverage to 85%+
- [ ] Add missing branch tests for editing.ts
- [ ] Add missing tests for utils.ts
- [ ] Add missing tests for csv.ts edge cases

## Notes

- Coverage thresholds use `autoUpdate: true` to automatically adjust to current coverage
- Target is >85% coverage across all metrics for v1.0.0
- Coverage reports should be reviewed in PR reviews
