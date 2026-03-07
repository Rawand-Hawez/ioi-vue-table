# @ioi-dev/vue-table-bench

Performance benchmark suite for IOI Vue Table using [tinybench](https://github.com/tinylibs/tinybench).

## Quick Start

```bash
# Run all benchmarks
pnpm bench

# Run with JSON report output
pnpm bench:report
```

## Benchmark Scenarios

| Scenario | Description | Data Size | Target |
|----------|-------------|-----------|--------|
| Initial Render | Time to initialize table with rows | 1,000 | 100ms |
| Virtual Scroll | Time to compute visible rows | 100,000 | 16ms (60fps) |
| Sort | Time to sort by single column | 100,000 | 200ms |
| Multi-Sort | Time to sort by 3 columns | 100,000 | 300ms |
| Filter | Time to apply text filter | 100,000 | 150ms |
| Global Search | Time to search all columns | 100,000 | 200ms |
| Selection Toggle | Time to toggle 1,000 selections | 100,000 | 50ms |
| CSV Parse | Time to parse 10MB CSV | 100,000 rows | 3000ms |

## Output

### Console Output

```
📊 Initial Render (1k rows)
----------------------------------------
  Mean: 45.234ms
  Min:  38.123ms
  Max:  52.456ms
  Std:  4.123ms
  Target: 100ms - ✅ PASS
```

### JSON Report

With `--report` flag, results are written to `benchmark-results.json`:

```json
{
  "Initial Render (1k rows)": {
    "mean": 45.234,
    "min": 38.123,
    "max": 52.456,
    "target": 100,
    "passed": true
  }
}
```

## Scenario Details

### Initial Render

Measures the time to initialize the table composable with 1,000 rows and compute initial visible rows.

```typescript
const api = useIoiTable({
  rows: data,
  columns,
  rowKey: 'id',
});
void api.visibleRows.value;
void api.renderEntries.value;
```

### Virtual Scroll

Measures the time to recompute visible rows when scrolling to the middle of a 100k dataset.

```typescript
const api = useIoiTable({
  rows: data,
  columns,
  rowKey: 'id',
  rowHeight: 40,
  viewportHeight: 600,
});
api.setViewport(50000 * 40, 600); // Scroll to row 50,000
void api.visibleRows.value;
```

### Sort

Measures the time to sort 100k rows by a single column.

```typescript
api.toggleSort('name');
void api.sortedIndices.value;
void api.visibleRows.value;
```

### Multi-Sort

Measures the time to sort 100k rows by 3 columns.

```typescript
api.toggleSort('department', true);
api.toggleSort('name', true);
api.toggleSort('age', true);
void api.sortedIndices.value;
void api.visibleRows.value;
```

### Filter

Measures the time to apply a text filter to 100k rows.

```typescript
api.setColumnFilter('name', { type: 'text', value: 'John', operator: 'contains' });
void api.filteredIndices.value;
void api.visibleRows.value;
```

### Global Search

Measures the time to perform a global search across all columns.

```typescript
api.setGlobalSearch('engineering');
void api.filteredIndices.value;
void api.visibleRows.value;
```

### Selection Toggle

Measures the time to toggle selection on 1,000 rows.

```typescript
for (let i = 0; i < 1000; i++) {
  api.toggleRow(i);
}
```

### CSV Parse

Measures the time to parse a 10MB CSV string.

```typescript
await api.parseCSV(csvString, { hasHeader: true });
```

## Configuration

Benchmarks run with the following defaults:

- **Time**: 5000ms per benchmark
- **Iterations**: 10 minimum
- **Warmup**: Automatic (handled by tinybench)

## Interpreting Results

### Pass/Fail Criteria

Each benchmark has a target time. Results are marked as:
- ✅ **PASS**: Mean time is at or below target
- ❌ **FAIL**: Mean time exceeds target

### Performance Tips

If benchmarks fail:

1. **Initial Render**: Check column definition complexity
2. **Virtual Scroll**: Reduce `overscan` value
3. **Sort/Filter**: Consider server-side mode for large datasets
4. **Selection**: Use batch selection methods (`selectAll`)
5. **CSV Parse**: Reduce `maxRows` or `maxSizeBytes` limits

## CI Integration

Benchmarks exit with code 0 if all pass, 1 if any fail:

```yaml
- name: Run benchmarks
  run: pnpm --filter @ioi-dev/vue-table-bench bench
```

For CI reporting:

```yaml
- name: Run benchmarks with report
  run: pnpm --filter @ioi-dev/vue-table-bench bench:report
  
- name: Upload benchmark results
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-results
    path: packages/bench/benchmark-results.json
```

## Adding New Scenarios

Add new scenarios in `src/scenarios/index.ts`:

```typescript
export const benchmarks: BenchmarkScenario[] = [
  // ... existing scenarios
  {
    name: 'My New Benchmark',
    description: 'Description of what is being tested',
    dataSize: 10000,
    targetMs: 100,
    run: async (data) => {
      const api = useIoiTable({ rows: data, columns, rowKey: 'id' });
      // Perform operations to benchmark
    },
  },
];
```

## Requirements

- Node.js 18+
- pnpm 8+
