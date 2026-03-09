import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/env.d.ts',
        'src/index.ts',
        'src/unstyled.ts'
      ],
      thresholds: {
        lines: 82.96,
        functions: 88.97,
        branches: 79.14,
        statements: 82.96,
        autoUpdate: true
      }
    }
  }
});