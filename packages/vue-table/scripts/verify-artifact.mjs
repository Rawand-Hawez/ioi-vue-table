import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
const packageDir = resolve(scriptDir, '..');
const distDir = resolve(packageDir, 'dist');
const packageJsonPath = resolve(packageDir, 'package.json');

function fail(message) {
  process.stderr.write(`artifact verification failed: ${message}\n`);
  process.exit(1);
}

function ensureFile(path) {
  try {
    const stats = statSync(path);
    if (!stats.isFile()) {
      fail(`${path} exists but is not a file`);
    }
    return stats;
  } catch {
    fail(`missing file: ${path}`);
  }
}

function assertExports(packageJson) {
  const exportsField = packageJson.exports ?? {};
  const stylesExport = exportsField['./styles.css'];
  const styleAliasExport = exportsField['./style.css'];
  const minimalExport = exportsField['./minimal'];
  const minimalCssExport = exportsField['./minimal.css'];

  if (stylesExport !== './dist/style.css') {
    fail('package.json exports["./styles.css"] must point to "./dist/style.css"');
  }

  if (styleAliasExport !== './dist/style.css') {
    fail('package.json exports["./style.css"] must point to "./dist/style.css"');
  }

  if (minimalExport !== './dist/minimal.css') {
    fail('package.json exports["./minimal"] must point to "./dist/minimal.css"');
  }

  if (minimalCssExport !== './dist/minimal.css') {
    fail('package.json exports["./minimal.css"] must point to "./dist/minimal.css"');
  }
}

function collectRuntimeBundleText() {
  const entries = readdirSync(distDir);
  const runtimeFiles = entries.filter((entry) => {
    const extension = extname(entry);
    return extension === '.js' || extension === '.cjs';
  });

  if (runtimeFiles.length === 0) {
    fail('no runtime bundle files (.js/.cjs) found in dist/');
  }

  const parts = runtimeFiles.map((entry) =>
    readFileSync(join(distDir, entry), 'utf8')
  );
  return parts.join('\n');
}

function assertRuntimeSymbols(runtimeText) {
  const requiredSymbols = [
    'pagination-change',
    'update:pageIndex',
    'update:pageSize',
    'header-filter',
    'getColumnFacetOptions'
  ];

  const missingSymbols = requiredSymbols.filter(
    (symbol) => !runtimeText.includes(symbol)
  );

  if (missingSymbols.length > 0) {
    fail(
      `runtime bundle missing expected symbols: ${missingSymbols.join(', ')}`
    );
  }
}

function main() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  assertExports(packageJson);

  const requiredDistFiles = [
    'dist/ioi-vue-table.js',
    'dist/ioi-vue-table.cjs',
    'dist/unstyled.js',
    'dist/unstyled.cjs',
    'dist/style.css',
    'dist/minimal.css'
  ];

  for (const relativePath of requiredDistFiles) {
    ensureFile(resolve(packageDir, relativePath));
  }

  const cssStats = ensureFile(resolve(packageDir, 'dist/style.css'));
  if (cssStats.size <= 0) {
    fail('dist/style.css is empty');
  }

  const minimalCssStats = ensureFile(resolve(packageDir, 'dist/minimal.css'));
  if (minimalCssStats.size <= 0) {
    fail('dist/minimal.css is empty');
  }

  const runtimeText = collectRuntimeBundleText();
  assertRuntimeSymbols(runtimeText);

  process.stdout.write('artifact verification passed\n');
}

main();
