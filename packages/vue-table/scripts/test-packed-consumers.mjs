import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const tmpDir = resolve(process.cwd(), '.tmp-packed-consumer');

function run(cmd, cwd) {
  execSync(cmd, { stdio: 'pipe', cwd: cwd ?? process.cwd() });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function main() {
  if (existsSync(tmpDir)) {
    execSync(`rm -rf "${tmpDir}"`);
  }
  mkdirSync(tmpDir, { recursive: true });

  run(`npm pack --pack-destination "${tmpDir}"`, process.cwd());

  const tarballName = execSync('npm pack --dry-run 2>&1 | tail -1', { encoding: 'utf8' }).trim();
  const tarball = resolve(tmpDir, tarballName);
  assert(existsSync(tarball), `tarball must exist at ${tarball}`);

  const tarFiles = execSync(`tar tf "${tarball}"`, { encoding: 'utf8' }).split('\n');

  console.log('--- Checking tarball contents ---');
  assert(tarFiles.some(f => f.includes('dist/style.css')), 'tarball must contain dist/style.css');
  assert(tarFiles.some(f => f.includes('dist/minimal.css')), 'tarball must contain dist/minimal.css');
  assert(tarFiles.some(f => f.includes('dist/themes/shadcn.css')), 'tarball must contain dist/themes/shadcn.css');
  assert(tarFiles.some(f => f.includes('dist/ioi-vue-table.js')), 'tarball must contain dist/ioi-vue-table.js');
  assert(!tarFiles.some(f => f.includes('AI.md') || f.includes('docs/')), 'tarball must NOT contain AI.md or docs/');

  console.log('--- Setting up default consumer fixture ---');
  const fixtureDir = resolve(tmpDir, 'default-consumer');
  const fixtureSrcDir = resolve(fixtureDir, 'src');
  mkdirSync(fixtureSrcDir, { recursive: true });

  writeFileSync(resolve(fixtureDir, 'package.json'), JSON.stringify({
    name: 'default-consumer-test',
    type: 'module',
    dependencies: {
      '@ioi-dev/vue-table': `file:${tarball}`,
      'vue': '^3.4.0'
    },
    devDependencies: {
      'vite': '^5.4.0',
      '@vitejs/plugin-vue': '^5.2.0'
    }
  }, null, 2));

  writeFileSync(resolve(fixtureDir, 'vite.config.js'), `
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [vue()] });
`);

  writeFileSync(resolve(fixtureDir, 'src/main.js'), `
import { createApp } from 'vue';
import App from './App.vue';
import '@ioi-dev/vue-table/styles.css';
createApp(App).mount('#app');
`);

  writeFileSync(resolve(fixtureDir, 'src/App.vue'), `
<template>
  <IoiTable :columns="columns" :rows="rows" row-key="id" :page-size="5" :show-pagination="true" />
</template>
<script setup>
import { IoiTable } from '@ioi-dev/vue-table';
const columns = [{ field: 'name', header: 'Name' }];
const rows = [{ id: 1, name: 'Test' }];
</script>
`);

  writeFileSync(resolve(fixtureDir, 'index.html'), `<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`);

  run('npm install', fixtureDir);

  console.log('--- Verifying default consumer can resolve imports ---');
  const pkgPath = require.resolve('@ioi-dev/vue-table', { paths: [fixtureDir] });
  assert(pkgPath.includes('ioi-vue-table'), 'default consumer must resolve @ioi-dev/vue-table');

  const cssPath = require.resolve('@ioi-dev/vue-table/styles.css', { paths: [fixtureDir] });
  assert(existsSync(cssPath), 'default consumer must resolve @ioi-dev/vue-table/styles.css');

  console.log('--- Verifying shadcn consumer fixture ---');
  const shadcnDir = resolve(tmpDir, 'shadcn-consumer');
  mkdirSync(shadcnDir, { recursive: true });

  writeFileSync(resolve(shadcnDir, 'package.json'), JSON.stringify({
    name: 'shadcn-consumer-test',
    type: 'module',
    dependencies: {
      '@ioi-dev/vue-table': `file:${tarball}`,
      'vue': '^3.4.0'
    }
  }, null, 2));

  run('npm install', shadcnDir);

  const shadcnPath = require.resolve('@ioi-dev/vue-table/themes/shadcn.css', { paths: [shadcnDir] });
  assert(existsSync(shadcnPath), 'shadcn consumer must resolve @ioi-dev/vue-table/themes/shadcn.css');

  const shadcnContent = readFileSync(shadcnPath, 'utf8');
  assert(shadcnContent.includes('--background'), 'shadcn.css must reference --background');
  assert(shadcnContent.includes('--muted'), 'shadcn.css must reference --muted');

  console.log('\n=== All packed consumer tests PASSED ===');
}

main();
