import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IoiVueTable',
      fileName: (format) => (format === 'es' ? 'ioi-vue-table.js' : 'ioi-vue-table.cjs'),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue']
    }
  }
});
