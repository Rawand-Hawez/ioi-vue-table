import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { useIoiTable } from '@ioi-dev/vue-table/unstyled';

function createRows(count) {
  const groups = ['A', 'B', 'C', 'D'];
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Name ${index + 1}`,
    group: groups[index % groups.length],
    score: (index * 17) % 1000,
    tags: [`tag-${index % 7}`, `batch-${Math.floor(index / 1000)}`],
    createdAt: new Date(2024, 0, (index % 28) + 1).toISOString()
  }));
}

function createColumns() {
  return [
    { field: 'id', type: 'number' },
    { field: 'name', type: 'text' },
    { field: 'group', type: 'text' },
    { field: 'score', type: 'number' },
    { field: 'tags', type: 'text' },
    { field: 'createdAt', type: 'date' }
  ];
}

function measure(operation, run) {
  const start = performance.now();
  const result = run();
  const durationMs = performance.now() - start;
  return { operation, durationMs, result };
}

function runScenario(rowCount) {
  const table = useIoiTable({
    rows: createRows(rowCount),
    columns: createColumns(),
    rowKey: 'id',
    rowHeight: 36,
    viewportHeight: 360,
    overscan: 5
  });

  const samples = [];

  samples.push(
    measure('sort:score:desc', () => {
      table.setSortState([{ field: 'score', direction: 'desc' }]);
      return table.sortedIndices.value.length;
    })
  );

  samples.push(
    measure('filter:group:eq:A', () => {
      table.setColumnFilter('group', {
        type: 'text',
        operator: 'equals',
        value: 'A',
        caseSensitive: false
      });
      return table.filteredIndices.value.length;
    })
  );

  samples.push(
    measure('search:name:contains:999', () => {
      table.setGlobalSearch('999');
      return table.filteredIndices.value.length;
    })
  );

  samples.push(
    measure('csv:export:filtered', () => {
      const csv = table.exportCSV({ scope: 'filtered' });
      return csv.length;
    })
  );

  return {
    rowCount,
    samples: samples.map((sample) => ({
      operation: sample.operation,
      durationMs: Number(sample.durationMs.toFixed(3)),
      resultSize: sample.result
    }))
  };
}

function toMarkdown(report) {
  const lines = [
    '# IOI Vue Table Benchmarks',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    '| Rows | Operation | Duration (ms) | Result size |',
    '| ---: | --- | ---: | ---: |'
  ];

  for (const scenario of report.scenarios) {
    for (const sample of scenario.samples) {
      lines.push(
        `| ${scenario.rowCount} | ${sample.operation} | ${sample.durationMs.toFixed(3)} | ${sample.resultSize} |`
      );
    }
  }

  return lines.join('\n');
}

const scenarios = [1_000, 10_000, 50_000].map((rowCount) => runScenario(rowCount));
const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  scenarios
};

const outputDir = join(process.cwd(), 'output');
mkdirSync(outputDir, { recursive: true });

const jsonPath = join(outputDir, 'bench-results.json');
const markdownPath = join(outputDir, 'bench-results.md');

writeFileSync(jsonPath, JSON.stringify(report, null, 2));
writeFileSync(markdownPath, toMarkdown(report));

console.log(`Wrote benchmark report:\n- ${jsonPath}\n- ${markdownPath}`);
