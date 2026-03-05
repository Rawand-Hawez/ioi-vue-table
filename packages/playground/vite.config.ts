import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ioi-dev/vue-table': resolve(__dirname, '../vue-table/src/index.ts')
    }
  }
});
