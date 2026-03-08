import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ioi-vue-table/' : '/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [vue(), tailwindcss() as any],
  resolve: {
    alias: {
      '@ioi-dev/vue-table': resolve(__dirname, '../vue-table/src/index.ts'),
      '@ioi-dev/vue-table/unstyled': resolve(__dirname, '../vue-table/src/unstyled.ts')
    }
  }
});
