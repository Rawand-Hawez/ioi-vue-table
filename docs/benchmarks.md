# Benchmarks

IOI Vue Table includes a reproducible benchmark workspace at `packages/bench`.

## Run

```bash
npm run bench
```

This command:

1. Builds `@ioi-dev/vue-table`.
2. Runs benchmark scenarios at 1k, 10k, and 50k rows.
3. Writes reports to:
   - `packages/bench/output/bench-results.json`
   - `packages/bench/output/bench-results.md`

## Scenarios

- Sort: `score` descending
- Filter: `group === "A"`
- Global search: `"999"`
- CSV export: `scope: "filtered"`

## Reporting Notes

- Benchmarks are informational by default in CI (non-blocking).
- Compare trends over time rather than treating single-run numbers as absolute.
- Capture hardware/runner context when sharing benchmark regressions.
