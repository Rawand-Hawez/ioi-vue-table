import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        unstyled: resolve(__dirname, 'src/unstyled.ts'),
        'utils/nestedPath': resolve(__dirname, 'src/utils/nestedPath.ts'),
        'composables/useIoiTable': resolve(__dirname, 'src/composables/useIoiTable.ts'),
        'composables/useColumnState': resolve(__dirname, 'src/composables/useColumnState.ts')
      },
      name: 'IoiVueTable',
      fileName: (format, entryName) => {
        const extension = format === 'es' ? 'js' : 'cjs';
        if (entryName === 'index') {
          return `ioi-vue-table.${extension}`;
        }

        return `${entryName}.${extension}`;
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue']
    }
  }
});
